# API Performance Test Script

This Python script tests the 3 main WooCommerce endpoints and measures their performance to compare with your Next.js app.

## Setup

1. **Install Python requests library** (if not already installed):
   ```bash
   pip install requests
   ```

2. **Edit the configuration** in `test_endpoints.py`:
   ```python
   BASE_URL = "http://localhost:3000"  # Your API base URL
   API_KEY = "ahc_live_sk_your_api_key_here"  # Your API key
   USER_EMAIL = "user@example.com"  # Email to test
   ```

## Usage

Run the script:
```bash
python test_endpoints.py
```

Or if it's executable:
```bash
./test_endpoints.py
```

## What It Tests

1. **Subscriptions Endpoint**
   - `GET /api/woocommerce/subscriptions?email={email}`
   - Measures response time
   - Saves response to `subscriptions_response.json`

2. **Orders Endpoint**
   - `GET /api/woocommerce/orders?email={email}`
   - Measures response time
   - Saves response to `orders_response.json`

3. **Subscription Orders Endpoint**
   - For each subscription found, tests: `GET /api/woocommerce/subscriptions/{id}/orders?email={email}`
   - Measures response time for each
   - Saves responses to `subscription_{id}_orders_response.json`

## Output

The script will:
- Display timing for each request (in seconds and milliseconds)
- Show status codes and data counts
- Save all JSON responses to files
- Generate a summary in `test_summary.json`

## Example Output

```
================================================================================
WooCommerce API Performance Test
================================================================================
Base URL: http://localhost:3000
Email: user@example.com
Timestamp: 2024-01-15 10:30:45
================================================================================

📋 Test 1: Fetching Subscriptions
--------------------------------------------------------------------------------
URL: http://localhost:3000/api/woocommerce/subscriptions?email=user@example.com
Status Code: 200
Time Taken: 2.345s (2345.00ms)
Subscriptions Found: 2
  ✓ Saved to: subscriptions_response.json

📦 Test 2: Fetching All Orders
--------------------------------------------------------------------------------
URL: http://localhost:3000/api/woocommerce/orders?email=user@example.com
Status Code: 200
Time Taken: 1.892s (1892.00ms)
Orders Found: 5
  ✓ Saved to: orders_response.json

🔗 Test 3: Fetching Orders for Each Subscription
--------------------------------------------------------------------------------

  Subscription 1: ID 123
  URL: http://localhost:3000/api/woocommerce/subscriptions/123/orders?email=user@example.com
  Status Code: 200
  Time Taken: 0.856s (856.00ms)
  Orders Found: 2
  ✓ Saved to: subscription_123_orders_response.json

================================================================================
📊 PERFORMANCE SUMMARY
================================================================================

1. Subscriptions Endpoint:
   Time: 2.345s (2345.00ms)
   Status: 200
   Count: 2 subscriptions

2. Orders Endpoint:
   Time: 1.892s (1892.00ms)
   Status: 200
   Count: 5 orders

3. Subscription Orders Endpoint:
   Total Time: 1.712s (1712.00ms)
   Average Time: 0.856s (856.00ms)
   Requests: 2
   - Subscription 123: 0.856s (856.00ms)
   - Subscription 456: 0.856s (856.00ms)

Total Test Time: 5.949s (5949.00ms)
```

## Comparing with Next.js App

After running the script, compare the times:
- **Python script times** = Direct API call time (what you measured before)
- **Next.js app times** = Python script time + Next.js processing overhead

If Next.js is significantly slower, the difference is likely:
- Database queries (API key validation, settings lookup)
- Additional processing/enrichment
- Network latency between Next.js and WooCommerce

## Troubleshooting

**Error: "API key must start with 'ahc_live_sk_'"**
- Make sure your API key starts with `ahc_live_sk_`

**Error: "Request timeout"**
- Increase timeout in the script (currently 60 seconds)
- Check if your API is running

**Error: 401 Unauthorized**
- Check your API key is correct
- Make sure the API key is active in your database

**Error: Connection refused**
- Make sure your Next.js app is running
- Check the BASE_URL is correct

