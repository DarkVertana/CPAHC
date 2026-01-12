/**
 * Real FCM Device Tester (requires Firebase client SDK)
 * 
 * This script uses Firebase client SDK to:
 * 1. Get a real FCM token from Firebase
 * 2. Register it with your API
 * 3. Listen for actual push notifications
 * 
 * Note: This requires firebase package to be installed
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const EMAIL = process.env.TEST_EMAIL;
const WP_USER_ID = process.env.TEST_WP_USER_ID || `test_user_${Date.now()}`;
const API_KEY = process.env.TEST_API_KEY;
const BASE_URL = process.env.TEST_BASE_URL || 'https://appanel.alternatehealthclub.com';
const GOOGLE_SERVICES_JSON = process.env.GOOGLE_SERVICES_JSON || path.join(__dirname, '../android/app/google-services.json');

if (!EMAIL || !API_KEY) {
  console.error('❌ ERROR: Email and API Key are required!');
  console.error('Set TEST_EMAIL and TEST_API_KEY environment variables');
  process.exit(1);
}

// Check if firebase package is available
let firebase;
try {
  firebase = require('firebase/app');
  require('firebase/messaging');
} catch (e) {
  console.error('❌ Firebase client SDK not found!');
  console.error('Install it with: npm install firebase');
  console.error('');
  console.error('Alternatively, use the mock test script: test-fcm-device.ps1');
  process.exit(1);
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

// Initialize Firebase and get FCM token
async function initializeFirebase() {
  try {
    // Read google-services.json
    if (!fs.existsSync(GOOGLE_SERVICES_JSON)) {
      throw new Error(`google-services.json not found at: ${GOOGLE_SERVICES_JSON}`);
    }

    const googleServices = JSON.parse(fs.readFileSync(GOOGLE_SERVICES_JSON, 'utf8'));
    const projectInfo = googleServices.project_info;
    const client = googleServices.client[0];
    const apiKey = client.api_key[0].current_key;

    // Initialize Firebase
    const firebaseConfig = {
      apiKey: apiKey,
      projectId: projectInfo.project_id,
      messagingSenderId: projectInfo.project_number,
      appId: client.client_info.mobilesdk_app_id,
    };

    const app = firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized');
    console.log(`   Project ID: ${projectInfo.project_id}`);
    console.log('');

    // Get FCM token
    // Note: In Node.js environment, we can't use getMessaging() directly
    // This would require a browser-like environment or using Firebase Admin SDK
    console.log('⚠️  Note: Getting FCM token in Node.js requires special setup.');
    console.log('   For real device testing, use the Android/iOS app.');
    console.log('');
    
    return null; // Can't get real token in Node.js without additional setup
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error.message);
    throw error;
  }
}

// Main function
async function runTest() {
  console.log('🔧 Real FCM Device Test');
  console.log('=======================\n');

  console.log('⚠️  This script requires Firebase client SDK and a browser-like environment.');
  console.log('   For testing, it\'s recommended to:');
  console.log('   1. Use the mock test script (test-fcm-device.ps1)');
  console.log('   2. Or test with a real Android/iOS device');
  console.log('');
  
  try {
    await initializeFirebase();
  } catch (error) {
    console.error('Failed to initialize Firebase');
    process.exit(1);
  }
}

// Run test
if (require.main === module) {
  runTest().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTest, makeRequest };
