import { prisma } from './prisma';
import * as admin from 'firebase-admin';

let fcmInitialized = false;
let firebaseApp: admin.app.App | null = null;

/**
 * Initialize FCM using Firebase Admin SDK (uses new FCM API v1 internally)
 * Requires service account credentials in environment variable FIREBASE_SERVICE_ACCOUNT
 * or GOOGLE_APPLICATION_CREDENTIALS pointing to service account JSON file
 */
export async function initializeFCM(): Promise<boolean> {
  if (fcmInitialized && firebaseApp) {
    return true;
  }

  try {
    // Get FCM settings from database
    const settings = await prisma.settings.findUnique({
      where: { id: 'settings' },
    });

    if (!settings?.fcmProjectId) {
      console.warn('FCM project ID not configured');
      return false;
    }

    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      // Try to get service account from environment variable
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (serviceAccountJson) {
        try {
          const serviceAccount = JSON.parse(serviceAccountJson);
          firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: settings.fcmProjectId,
          });
        } catch (error) {
          console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', error);
          return false;
        }
      } else if (credentialsPath) {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: settings.fcmProjectId,
        });
      } else {
        console.warn('Firebase service account not configured. Set FIREBASE_SERVICE_ACCOUNT (JSON string) or GOOGLE_APPLICATION_CREDENTIALS (file path)');
        return false;
      }
    } else {
      firebaseApp = admin.app();
    }

    fcmInitialized = true;
    return true;
  } catch (error) {
    console.error('Failed to initialize FCM:', error);
    return false;
  }
}

/**
 * Send push notification to a single device using Firebase Admin SDK
 * (uses new FCM API v1 internally - no legacy API)
 */
export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  imageUrl?: string,
  data?: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const initialized = await initializeFCM();
    if (!initialized || !firebaseApp) {
      return {
        success: false,
        error: 'FCM not initialized. Please configure FCM settings and service account credentials.',
      };
    }

    // Build message payload for FCM API v1 (via Firebase Admin SDK)
    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default',
          priority: 'high',
        },
      },
    };

    // Send via Firebase Admin SDK (uses FCM API v1 internally)
    const response = await admin.messaging(firebaseApp).send(message);

    return {
      success: true,
      messageId: response,
    };
  } catch (error: any) {
    console.error('Error sending push notification:', error);

    // Handle invalid token
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      // Remove invalid token from database
      await prisma.appUser.updateMany({
        where: { fcmToken },
        data: { fcmToken: null },
      });
      return {
        success: false,
        error: 'Invalid FCM token',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to send push notification',
    };
  }
}

/**
 * Send push notification to multiple devices using Firebase Admin SDK
 * (uses new FCM API v1 internally - no legacy API)
 * Processes tokens in parallel with a concurrency limit
 */
export async function sendPushNotificationToMultiple(
  fcmTokens: string[],
  title: string,
  body: string,
  imageUrl?: string,
  data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
  try {
    const initialized = await initializeFCM();
    if (!initialized || !firebaseApp) {
      return {
        successCount: 0,
        failureCount: fcmTokens.length,
        errors: ['FCM not initialized. Please configure FCM settings and service account credentials.'],
      };
    }

    if (fcmTokens.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        errors: [],
      };
    }

    let totalSuccess = 0;
    let totalFailure = 0;
    const allErrors: string[] = [];
    const invalidTokens: string[] = [];

    // Process tokens in parallel with concurrency limit (50 concurrent requests)
    const concurrencyLimit = 50;
    for (let i = 0; i < fcmTokens.length; i += concurrencyLimit) {
      const batch = fcmTokens.slice(i, i + concurrencyLimit);

      const promises = batch.map(async (token) => {
        const message: admin.messaging.Message = {
          token,
          notification: {
            title,
            body,
            ...(imageUrl && { imageUrl }),
          },
          data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {},
          android: {
            priority: 'high',
            notification: {
              channelId: 'default',
              sound: 'default',
              priority: 'high',
            },
          },
        };

        try {
          // Send via Firebase Admin SDK (uses FCM API v1 internally)
          await admin.messaging(firebaseApp!).send(message);
          totalSuccess++;
          return { success: true, token };
        } catch (error: any) {
          totalFailure++;
          const errorMsg = error.message || 'Unknown error';
          allErrors.push(errorMsg);

          // Track invalid tokens
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            invalidTokens.push(token);
          }
          return { success: false, token };
        }
      });

      await Promise.all(promises);
    }

    // Remove invalid tokens from database
    if (invalidTokens.length > 0) {
      await prisma.appUser.updateMany({
        where: {
          fcmToken: {
            in: invalidTokens,
          },
        },
        data: {
          fcmToken: null,
        },
      });
    }

    return {
      successCount: totalSuccess,
      failureCount: totalFailure,
      errors: allErrors,
    };
  } catch (error: any) {
    console.error('Error sending multicast push notification:', error);
    return {
      successCount: 0,
      failureCount: fcmTokens.length,
      errors: [error.message || 'Failed to send push notifications'],
    };
  }
}

/**
 * Send push notification to all active users
 */
export async function sendPushNotificationToAll(
  title: string,
  body: string,
  imageUrl?: string,
  data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number; totalUsers: number }> {
  try {
    // Get all active users with FCM tokens
    const users = await prisma.appUser.findMany({
      where: {
        fcmToken: {
          not: null,
        },
        status: 'Active',
      },
      select: {
        fcmToken: true,
      },
    });

    const fcmTokens = users
      .map((u) => u.fcmToken)
      .filter((token): token is string => token !== null);

    if (fcmTokens.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        totalUsers: 0,
      };
    }

    const result = await sendPushNotificationToMultiple(fcmTokens, title, body, imageUrl, data);

    return {
      successCount: result.successCount,
      failureCount: result.failureCount,
      totalUsers: fcmTokens.length,
    };
  } catch (error: any) {
    console.error('Error sending push notification to all users:', error);
    return {
      successCount: 0,
      failureCount: 0,
      totalUsers: 0,
    };
  }
}

