import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { initializeFCM } from '@/lib/fcm-service';
import { prisma } from '@/lib/prisma';

/**
 * Diagnostic endpoint to test FCM configuration
 * Returns detailed information about FCM setup status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      fcmConfigured: false,
      issues: [],
      warnings: [],
      info: {},
    };

    // Check database settings
    const settings = await prisma.settings.findUnique({
      where: { id: 'settings' },
    });

    if (!settings) {
      diagnostics.issues.push('Settings record not found in database');
      return NextResponse.json(diagnostics);
    }

    // Check FCM Project ID
    if (!settings.fcmProjectId) {
      diagnostics.issues.push('FCM Project ID is not configured in database settings');
    } else {
      diagnostics.info.fcmProjectId = settings.fcmProjectId;
    }

    // Check environment variables
    const hasServiceAccountJson = !!process.env.FIREBASE_SERVICE_ACCOUNT;
    const hasCredentialsPath = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!hasServiceAccountJson && !hasCredentialsPath) {
      diagnostics.issues.push(
        'Neither FIREBASE_SERVICE_ACCOUNT nor GOOGLE_APPLICATION_CREDENTIALS environment variable is set'
      );
    } else {
      if (hasServiceAccountJson) {
        try {
          const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
          diagnostics.info.serviceAccountMethod = 'FIREBASE_SERVICE_ACCOUNT (JSON string)';
          diagnostics.info.serviceAccountProjectId = parsed.project_id;
          if (parsed.project_id !== settings.fcmProjectId) {
            diagnostics.warnings.push(
              `Service account project ID (${parsed.project_id}) does not match database FCM Project ID (${settings.fcmProjectId})`
            );
          }
        } catch (error: any) {
          diagnostics.issues.push(
            `FIREBASE_SERVICE_ACCOUNT contains invalid JSON: ${error.message}`
          );
        }
      }
      if (hasCredentialsPath) {
        diagnostics.info.serviceAccountMethod = 'GOOGLE_APPLICATION_CREDENTIALS (file path)';
        diagnostics.info.credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      }
    }

    // Try to initialize FCM
    try {
      const initialized = await initializeFCM();
      if (initialized) {
        diagnostics.fcmConfigured = true;
        diagnostics.info.status = 'FCM initialized successfully';
      } else {
        diagnostics.issues.push('FCM initialization failed (check logs for details)');
      }
    } catch (error: any) {
      diagnostics.issues.push(`FCM initialization error: ${error.message}`);
    }

    // Check for users with FCM tokens
    const usersWithTokens = await prisma.appUser.count({
      where: {
        fcmToken: {
          not: null,
        },
        status: 'Active',
      },
    });

    diagnostics.info.activeUsersWithTokens = usersWithTokens;
    if (usersWithTokens === 0) {
      diagnostics.warnings.push('No active users with FCM tokens found');
    }

    // Overall status
    diagnostics.status = diagnostics.issues.length === 0 ? 'ready' : 'not_ready';

    return NextResponse.json(diagnostics);
  } catch (error: any) {
    console.error('FCM diagnostic error:', error);
    return NextResponse.json(
      {
        error: 'An error occurred while running diagnostics',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
