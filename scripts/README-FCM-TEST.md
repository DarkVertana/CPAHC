# FCM Device Testing Scripts

This directory contains scripts to test FCM (Firebase Cloud Messaging) device registration and push notifications.

## Quick Start

### Option 1: Mock Device Test (Recommended for Testing Registration)

This script registers a mock FCM token to test the registration flow:

```powershell
.\scripts\test-fcm-device.ps1 -Email "user@example.com" -ApiKey "ahc_live_sk_..."
```

### Option 2: Set Environment Variables

```powershell
$env:API_KEY = "ahc_live_sk_..."
.\scripts\test-fcm-device.ps1 -Email "user@example.com"
```

## Parameters

- `-Email` (Required): Email address of the test user
- `-ApiKey` (Optional): API key for authentication (or set `API_KEY` env var)
- `-BaseUrl` (Optional): Base URL of your API (default: `http://localhost:3000`)
- `-WpUserId` (Optional): WordPress user ID (default: auto-generated)

## What the Script Does

1. ✅ Generates a mock FCM token
2. ✅ Registers the token with your API at `/api/app-users/fcm-token`
3. ✅ Verifies the registration was successful
4. ✅ Provides instructions for testing push notifications

## Testing Push Notifications

After running the script:

1. Go to your admin dashboard: `http://localhost:3000/dashboard/notifications`
2. Create a new notification
3. Enable "Active Status"
4. The notification will be sent to all registered devices (including your test device)

## Important Notes

⚠️ **Mock Tokens**: The script generates mock FCM tokens for testing registration. These tokens won't receive actual push notifications.

✅ **Real Testing**: To test actual push notifications, you need:
- A real Android/iOS device
- The mobile app installed
- The app registered with FCM

## Troubleshooting

### "API Key is required"
- Make sure you provide the API key using `-ApiKey` parameter
- Or set the `API_KEY` environment variable
- Get your API key from: `http://localhost:3000/dashboard/settings` (API Keys section)

### "Failed to register FCM token"
- Check that your server is running
- Verify the API key is valid and active
- Check server logs for detailed error messages

### "Node.js is not installed"
- Install Node.js from https://nodejs.org/
- Make sure Node.js is in your PATH

## Example Output

```
========================================
FCM Device Test Script
========================================

Node.js version: v20.10.0

Configuration:
  Email: test@example.com
  WordPress User ID: test_user_12345
  Base URL: http://localhost:3000
  API Key: ahc_live_sk_abcd...

Starting FCM device test...

🔧 FCM Device Registration Test
================================

📱 Generated Test FCM Token: dfj_VYdASZOm27EZMi8c...
📤 Step 1: Registering FCM token with API...
✅ FCM token registered successfully!
   User ID: clx1234567890
   Email: test@example.com
   Token Registered: Yes

🔍 Step 2: Verifying device registration...
✅ Device registration verified

📋 Step 3: Testing Push Notifications
=====================================

To test if push notifications work:
1. Go to your admin dashboard:
   http://localhost:3000/dashboard/notifications
2. Create a new notification...
```
