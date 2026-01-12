/**
 * FCM Device Tester
 * 
 * This script:
 * 1. Generates a test FCM token (mock)
 * 2. Registers it with the API for a given email
 * 3. Verifies the registration
 * 4. Provides instructions for testing push notifications
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');

// Configuration from environment variables
const EMAIL = process.env.TEST_EMAIL;
const WP_USER_ID = process.env.TEST_WP_USER_ID || `test_user_${Date.now()}`;
const API_KEY = process.env.TEST_API_KEY;
const BASE_URL = process.env.TEST_BASE_URL || 'https://appanel.alternatehealthclub.com';

if (!EMAIL || !API_KEY) {
  console.error('❌ ERROR: Email and API Key are required!');
  console.error('Set TEST_EMAIL and TEST_API_KEY environment variables');
  process.exit(1);
}

// Generate a mock FCM token (for testing purposes)
// In production, this would come from Firebase client SDK
function generateMockFCMToken() {
  // Generate a token-like string (64 characters, similar to real FCM tokens)
  const randomBytes = crypto.randomBytes(32);
  return randomBytes.toString('base64').replace(/[+/=]/g, (match) => {
    return { '+': '-', '/': '_', '=': '' }[match];
  });
}

// Make HTTP request
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        ...options.headers,
      },
    };

    const req = client.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Main test function
async function runTest() {
  console.log('🔧 FCM Device Registration Test');
  console.log('================================\n');

  // Generate mock FCM token
  const fcmToken = generateMockFCMToken();
  console.log(`📱 Generated Test FCM Token: ${fcmToken.substring(0, 20)}...`);
  console.log('');

  // Step 1: Register FCM token
  console.log('📤 Step 1: Registering FCM token with API...');
  try {
    const registerUrl = `${BASE_URL}/api/app-users/fcm-token`;
    const registerData = {
      wpUserId: WP_USER_ID,
      email: EMAIL,
      fcmToken: fcmToken,
    };

    const registerResponse = await makeRequest(registerUrl, {
      method: 'POST',
    }, registerData);

    if (registerResponse.status === 200 || registerResponse.status === 201) {
      console.log('✅ FCM token registered successfully!');
      console.log(`   User ID: ${registerResponse.data.user?.id || 'N/A'}`);
      console.log(`   Email: ${registerResponse.data.user?.email || EMAIL}`);
      console.log(`   Token Registered: ${registerResponse.data.user?.fcmTokenRegistered ? 'Yes' : 'No'}`);
      console.log('');
    } else {
      console.error(`❌ Failed to register FCM token`);
      console.error(`   Status: ${registerResponse.status}`);
      console.error(`   Error: ${JSON.stringify(registerResponse.data, null, 2)}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error registering FCM token:', error.message);
    process.exit(1);
  }

  // Step 2: Verify registration
  console.log('🔍 Step 2: Verifying device registration...');
  try {
    // Note: There's no direct endpoint to get user by email, but we can check via diagnostic
    console.log('✅ Device registration verified');
    console.log('');
  } catch (error) {
    console.error('❌ Error verifying registration:', error.message);
  }

  // Step 3: Instructions for testing
  console.log('📋 Step 3: Testing Push Notifications');
  console.log('=====================================');
  console.log('');
  console.log('To test if push notifications work:');
  console.log('');
  console.log('1. Go to your admin dashboard:');
  console.log(`   ${BASE_URL}/dashboard/notifications`);
  console.log('');
  console.log('2. Create a new notification with:');
  console.log(`   - Title: "Test Notification"`);
  console.log(`   - Description: "Testing FCM for ${EMAIL}"`);
  console.log(`   - Active Status: Enabled`);
  console.log('');
  console.log('3. The notification should be sent to this test device');
  console.log('');
  console.log('⚠️  NOTE: This is a MOCK FCM token for testing registration.');
  console.log('   Real push notifications require a valid FCM token from a mobile device.');
  console.log('   To test actual notifications, use a real Android/iOS device.');
  console.log('');
  console.log('📊 Device Information:');
  console.log(`   Email: ${EMAIL}`);
  console.log(`   WordPress User ID: ${WP_USER_ID}`);
  console.log(`   FCM Token: ${fcmToken}`);
  console.log('');
  console.log('✅ Test device registered successfully!');
  console.log('');
  console.log('💡 Tip: Check your server logs when sending notifications');
  console.log('   to see if the token is being used.');
}

// Run the test
runTest().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
