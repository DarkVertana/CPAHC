#!/usr/bin/env python3
"""
WooCommerce API Performance Test Script

This script tests the 3 main WooCommerce endpoints and measures their performance.
It uses the same authentication as the Next.js app.

Usage:
1. Set BASE_URL to your API base URL (e.g., 'http://localhost:3000' or 'https://your-domain.com')
2. Set API_KEY to your API key (must start with 'ahc_live_sk_')
3. Set USER_EMAIL to the email address to test
4. Run: python test_endpoints.py
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Tuple

# ============================================================================
# CONFIGURATION - EDIT THESE VALUES
# ============================================================================

# Base URL of your API (without trailing slash)
BASE_URL = "https://appanel.alternatehealthclub.com"  # Change to your API URL

# Your API key (must start with 'ahc_live_sk_')
API_KEY = "ahc_live_sk_f0284bd528e3588b54fa4f8e4f148441ca16e39aee2b09176c7016b989659503"  # Change to your actual API key

# Email address to test
USER_EMAIL = "akshay@devgraphix.com"  # Change to the email you want to test

# ============================================================================
# END CONFIGURATION
# ============================================================================


def make_request(url: str, headers: Dict[str, str]) -> Tuple[Dict[str, Any], float, int]:
    """
    Make an API request and measure the time taken.
    
    Returns:
        (response_data, time_taken_seconds, status_code)
    """
    start_time = time.time()
    
    try:
        response = requests.get(url, headers=headers, timeout=60)
        elapsed_time = time.time() - start_time
        
        # Try to parse JSON response
        try:
            response_data = response.json()
        except json.JSONDecodeError:
            response_data = {"error": "Invalid JSON response", "raw": response.text[:500]}
        
        return response_data, elapsed_time, response.status_code
    
    except requests.exceptions.Timeout:
        elapsed_time = time.time() - start_time
        return {"error": "Request timeout"}, elapsed_time, 0
    
    except requests.exceptions.RequestException as e:
        elapsed_time = time.time() - start_time
        return {"error": str(e)}, elapsed_time, 0


def format_time(seconds: float) -> str:
    """Format time in seconds and milliseconds."""
    ms = seconds * 1000
    return f"{seconds:.3f}s ({ms:.2f}ms)"


def save_json_file(data: Dict[str, Any], filename: str):
    """Save JSON data to a file."""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  ✓ Saved to: {filename}")


def main():
    print("=" * 80)
    print("WooCommerce API Performance Test")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Email: {USER_EMAIL}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    print()
    
    # Validate API key format
    if not API_KEY.startswith('ahc_live_sk_'):
        print("❌ ERROR: API key must start with 'ahc_live_sk_'")
        return
    
    # Set up headers (same as Next.js app)
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    results = {}
    total_start_time = time.time()
    
    # ========================================================================
    # Test 1: Subscriptions Endpoint
    # ========================================================================
    print("📋 Test 1: Fetching Subscriptions")
    print("-" * 80)
    subscriptions_url = f"{BASE_URL}/api/woocommerce/subscriptions?email={USER_EMAIL}"
    print(f"URL: {subscriptions_url}")
    
    subscriptions_data, subscriptions_time, subscriptions_status = make_request(
        subscriptions_url, headers
    )
    
    print(f"Status Code: {subscriptions_status}")
    print(f"Time Taken: {format_time(subscriptions_time)}")
    
    if subscriptions_status == 200:
        count = subscriptions_data.get('count', 0)
        print(f"Subscriptions Found: {count}")
        results['subscriptions'] = {
            'time_seconds': subscriptions_time,
            'time_ms': subscriptions_time * 1000,
            'status_code': subscriptions_status,
            'count': count
        }
        save_json_file(subscriptions_data, 'subscriptions_response.json')
    else:
        print(f"❌ Error: {subscriptions_data.get('error', 'Unknown error')}")
        results['subscriptions'] = {
            'time_seconds': subscriptions_time,
            'time_ms': subscriptions_time * 1000,
            'status_code': subscriptions_status,
            'error': subscriptions_data.get('error', 'Unknown error')
        }
        save_json_file(subscriptions_data, 'subscriptions_response.json')
    
    print()
    
    # ========================================================================
    # Test 2: Orders Endpoint
    # ========================================================================
    print("📦 Test 2: Fetching All Orders")
    print("-" * 80)
    orders_url = f"{BASE_URL}/api/woocommerce/orders?email={USER_EMAIL}"
    print(f"URL: {orders_url}")
    
    orders_data, orders_time, orders_status = make_request(orders_url, headers)
    
    print(f"Status Code: {orders_status}")
    print(f"Time Taken: {format_time(orders_time)}")
    
    if orders_status == 200:
        count = orders_data.get('count', 0)
        print(f"Orders Found: {count}")
        results['orders'] = {
            'time_seconds': orders_time,
            'time_ms': orders_time * 1000,
            'status_code': orders_status,
            'count': count
        }
        save_json_file(orders_data, 'orders_response.json')
    else:
        print(f"❌ Error: {orders_data.get('error', 'Unknown error')}")
        results['orders'] = {
            'time_seconds': orders_time,
            'time_ms': orders_time * 1000,
            'status_code': orders_status,
            'error': orders_data.get('error', 'Unknown error')
        }
        save_json_file(orders_data, 'orders_response.json')
    
    print()
    
    # ========================================================================
    # Test 3: Subscription Orders Endpoint (for each subscription)
    # ========================================================================
    print("🔗 Test 3: Fetching Orders for Each Subscription")
    print("-" * 80)
    
    subscription_orders_results = []
    
    if subscriptions_status == 200 and 'subscriptions' in subscriptions_data:
        subscriptions_list = subscriptions_data.get('subscriptions', [])
        
        if len(subscriptions_list) == 0:
            print("No subscriptions found, skipping subscription orders test.")
        else:
            for idx, subscription in enumerate(subscriptions_list, 1):
                subscription_id = subscription.get('id')
                if not subscription_id:
                    continue
                
                print(f"\n  Subscription {idx}: ID {subscription_id}")
                subscription_orders_url = (
                    f"{BASE_URL}/api/woocommerce/subscriptions/{subscription_id}/orders"
                    f"?email={USER_EMAIL}"
                )
                print(f"  URL: {subscription_orders_url}")
                
                sub_orders_data, sub_orders_time, sub_orders_status = make_request(
                    subscription_orders_url, headers
                )
                
                print(f"  Status Code: {sub_orders_status}")
                print(f"  Time Taken: {format_time(sub_orders_time)}")
                
                if sub_orders_status == 200:
                    count = sub_orders_data.get('count', 0)
                    print(f"  Orders Found: {count}")
                    subscription_orders_results.append({
                        'subscription_id': subscription_id,
                        'time_seconds': sub_orders_time,
                        'time_ms': sub_orders_time * 1000,
                        'status_code': sub_orders_status,
                        'count': count
                    })
                    filename = f'subscription_{subscription_id}_orders_response.json'
                    save_json_file(sub_orders_data, filename)
                else:
                    print(f"  ❌ Error: {sub_orders_data.get('error', 'Unknown error')}")
                    subscription_orders_results.append({
                        'subscription_id': subscription_id,
                        'time_seconds': sub_orders_time,
                        'time_ms': sub_orders_time * 1000,
                        'status_code': sub_orders_status,
                        'error': sub_orders_data.get('error', 'Unknown error')
                    })
                    filename = f'subscription_{subscription_id}_orders_response.json'
                    save_json_file(sub_orders_data, filename)
    else:
        print("Cannot fetch subscription orders - subscriptions endpoint failed.")
    
    results['subscription_orders'] = subscription_orders_results
    print()
    
    # ========================================================================
    # Summary
    # ========================================================================
    total_time = time.time() - total_start_time
    
    print("=" * 80)
    print("📊 PERFORMANCE SUMMARY")
    print("=" * 80)
    print()
    
    # Subscriptions
    if 'subscriptions' in results:
        sub = results['subscriptions']
        print(f"1. Subscriptions Endpoint:")
        print(f"   Time: {format_time(sub['time_seconds'])}")
        print(f"   Status: {sub['status_code']}")
        if 'count' in sub:
            print(f"   Count: {sub['count']} subscriptions")
        print()
    
    # Orders
    if 'orders' in results:
        ord = results['orders']
        print(f"2. Orders Endpoint:")
        print(f"   Time: {format_time(ord['time_seconds'])}")
        print(f"   Status: {ord['status_code']}")
        if 'count' in ord:
            print(f"   Count: {ord['count']} orders")
        print()
    
    # Subscription Orders
    if subscription_orders_results:
        print(f"3. Subscription Orders Endpoint:")
        total_sub_orders_time = sum(r['time_seconds'] for r in subscription_orders_results)
        avg_sub_orders_time = total_sub_orders_time / len(subscription_orders_results)
        print(f"   Total Time: {format_time(total_sub_orders_time)}")
        print(f"   Average Time: {format_time(avg_sub_orders_time)}")
        print(f"   Requests: {len(subscription_orders_results)}")
        for r in subscription_orders_results:
            print(f"   - Subscription {r['subscription_id']}: {format_time(r['time_seconds'])}")
        print()
    
    print(f"Total Test Time: {format_time(total_time)}")
    print()
    
    # Save summary
    summary = {
        'test_timestamp': datetime.now().isoformat(),
        'base_url': BASE_URL,
        'email': USER_EMAIL,
        'results': results,
        'total_time_seconds': total_time,
        'total_time_ms': total_time * 1000
    }
    save_json_file(summary, 'test_summary.json')
    
    print("=" * 80)
    print("✅ Test Complete!")
    print("=" * 80)
    print("\nGenerated Files:")
    print("  - subscriptions_response.json")
    print("  - orders_response.json")
    print("  - subscription_*_orders_response.json (one per subscription)")
    print("  - test_summary.json")


if __name__ == "__main__":
    main()

