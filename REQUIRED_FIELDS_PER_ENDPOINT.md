# Required Fields Per Endpoint

This document details all the fields required from each API endpoint, based on actual usage in the application.

---

## 1. Subscriptions Endpoint

**Endpoint:** `GET /api/woocommerce/subscriptions?email={email}`  
**Base URL:** `https://appanel.alternatehealthclub.com`  
**Used by:**
- `subscriptions_page.dart` (list view)
- `subscription_details_page.dart` (detail view)

### Fields Required for Subscriptions List Page

```json
{
  "id": "number (integer, required)",
  "number": "string (subscription number, required)",
  "status": "string (required) - e.g., 'active', 'on-hold', 'cancelled', 'expired'",
  "date_created": "string (ISO 8601 datetime, required)",
  "next_payment_date": "string (ISO 8601 datetime, optional) - for active subscriptions",
  "end_date": "string (ISO 8601 datetime, optional) - for cancelled/expired subscriptions",
  "currency": "string (required) - e.g., 'USD'",
  "total": "string (decimal as string, required) - e.g., '99.00'",
  "billing_period": "string (required) - e.g., 'month', 'year'",
  "billing_interval": "number (integer, required) - e.g., 1, 3, 6",
  "line_items": [
    {
      "name": "string (product name, required)",
      "image": {
        "src": "string (image URL, required) - will be converted to 150x150 thumbnail"
      }
    }
  ]
}
```

**Field Details:**
- `id`: WooCommerce subscription ID (used for API calls)
- `number`: Subscription number (displayed as SUB-{number})
- `status`: Subscription status (mapped to display status)
- `date_created`: Subscription start date
- `next_payment_date`: Next billing date (only for active subscriptions)
- `end_date`: End date (only for cancelled/expired subscriptions)
- `currency`: Currency code (USD, etc.)
- `total`: Subscription price per billing cycle
- `billing_period`: Billing frequency period (month, year)
- `billing_interval`: Number of periods (1 = monthly, 3 = quarterly, etc.)
- `line_items[].name`: Product name
- `line_items[].image.src`: Product image URL (will be converted to thumbnail)

### Fields Required for Subscription Details Page

All fields from the list view, **PLUS**:

```json
{
  "billing": {
    "first_name": "string (required)",
    "last_name": "string (required)",
    "address_1": "string (required)",
    "address_2": "string (optional)",
    "city": "string (required)",
    "state": "string (required)",
    "postcode": "string (required)",
    "country": "string (required)",
    "email": "string (required)",
    "phone": "string (required)"
  },
  "shipping": {
    "first_name": "string (required)",
    "last_name": "string (required)",
    "address_1": "string (required)",
    "address_2": "string (optional)",
    "city": "string (required)",
    "state": "string (required)",
    "postcode": "string (required)",
    "country": "string (required)"
  },
  "line_items": [
    {
      "name": "string (required)",
      "quantity": "number (integer, required)",
      "total": "string (decimal as string, required) - line item total price"
    }
  ],
  "payment_method_title": "string (optional) - e.g., 'Credit Card'",
  "payment_method": "string (optional) - e.g., 'stripe'",
  "shipping_total": "string (decimal as string, optional) - shipping cost",
  "shipping_method": "string (optional) - shipping method name"
}
```

**Additional Field Details:**
- `billing`: Complete billing address information
- `shipping`: Complete shipping address information
- `line_items[].quantity`: Quantity of items in subscription
- `line_items[].total`: Line item total price (quantity × unit price)
- `payment_method_title`: Payment method display name
- `payment_method`: Payment method identifier
- `shipping_total`: Shipping cost (used to calculate subtotal)
- `shipping_method`: Shipping method name

### Complete Field List for Subscriptions Endpoint

**Minimum (for list view):**
```
id, number, status, date_created, next_payment_date, end_date,
currency, total, billing_period, billing_interval,
line_items[name, image[src]]
```

**Complete (for detail view):**
```
id, number, status, date_created, next_payment_date, end_date,
currency, total, billing_period, billing_interval,
billing[first_name, last_name, address_1, address_2, city, state, postcode, country, email, phone],
shipping[first_name, last_name, address_1, address_2, city, state, postcode, country],
line_items[name, quantity, total, image[src]],
payment_method_title, payment_method, shipping_total, shipping_method
```

---

## 2. Orders Endpoint (Per Subscription)

**Endpoint:** `GET /api/woocommerce/subscriptions/{id}/orders?email={email}`  
**Base URL:** `https://appanel.alternatehealthclub.com`  
**Used by:**
- `orders_page.dart` (all orders list)
- `subscription_details_page.dart` (related orders for a subscription)
- `my_plan_page.dart` (treatment schedule from orders)
- `treatment_history_page.dart` (treatment history from orders)
- `treatment_history_details_page.dart` (treatment details from orders)

### Fields Required for Orders Page

```json
{
  "id": "number (integer, required)",
  "number": "string (order number, optional) - if not provided, uses id",
  "date_created": "string (ISO 8601 datetime, required)",
  "status": "string (required) - e.g., 'pending', 'processing', 'completed', 'cancelled'",
  "total": "string (decimal as string, required)",
  "currency": "string (required) - e.g., 'USD'",
  "line_items": [
    {
      "name": "string (product name, required)",
      "quantity": "number (integer, required)",
      "total": "string (decimal as string, required) - line item total price",
      "image": {
        "src": "string (image URL, required) - will be converted to 150x150 thumbnail"
      }
    }
  ],
  "meta_data": [
    {
      "key": "string (required) - tracking-related keys",
      "value": "string (required) - tracking number value"
    }
  ]
}
```

**Field Details:**
- `id`: WooCommerce order ID
- `number`: Order number (displayed as Order #{number})
- `date_created`: Order creation date
- `status`: Order status (mapped to display status)
- `total`: Order total price
- `currency`: Currency code
- `line_items[].name`: Product name
- `line_items[].quantity`: Quantity ordered
- `line_items[].total`: Line item total (quantity × unit price)
- `line_items[].image.src`: Product image URL (will be converted to thumbnail)
- `meta_data[]`: Metadata array (searched for tracking-related keys)

**Note:** The orders page searches `meta_data` for keys containing "tracking" or "track" to find tracking numbers.

### Fields Required for My Plan Page & Treatment History Pages

```json
{
  "id": "number (integer, required)",
  "date_created": "string (ISO 8601 datetime, required)",
  "meta_data": [
    {
      "key": "string (required) - MUST include 'medication_schedule' key",
      "value": "string (required) - JSON string containing medication schedule"
    }
  ],
  "line_items": [
    {
      "name": "string (product name, required)",
      "image": {
        "src": "string (image URL, required) - will be converted to 150x150 thumbnail"
      }
    }
  ]
}
```

**Critical Field:** `meta_data` must include an entry with `key: "medication_schedule"` and `value` containing a JSON string with the medication schedule structure.

**medication_schedule Structure (example):**
```json
{
  "0": [
    {
      "medicines": "string (medicine name)",
      "concentration": "string (e.g., '2.5', '5.0')",
      "med_schedule": "string (schedule description)",
      "med_dosage": "string (dosage description)",
      "week_doses": [
        {
          "week_number": "number (integer)",
          "dose_number": "number (integer)",
          "date": "string (date)",
          "time": "string (time)",
          "dose_amount": "string (dose amount)"
        }
      ]
    }
  ],
  "1": [ /* month 2 medications */ ],
  "2": [ /* month 3 medications */ ]
  // ... up to N months
}
```

**Field Details:**
- `id`: Order ID (used to link treatments to orders)
- `date_created`: Order date (used as treatment start date)
- `meta_data[].key`: Must include "medication_schedule" key
- `meta_data[].value`: JSON string containing medication schedule (parsed by app)
- `line_items[].name`: Product name (matched with medications)
- `line_items[].image.src`: Product image URL (matched with medications by name)

### Fields Required for Subscription Details Page (Related Orders)

Same as Orders Page fields, but `meta_data` is optional (only needed if tracking info is to be displayed).

### Complete Field List for Orders Endpoint

**Minimum (for orders list):**
```
id, number, date_created, status, total, currency,
line_items[name, quantity, total, image[src]],
meta_data[key, value]
```

**Complete (for treatment pages - MUST include medication_schedule):**
```
id, date_created,
meta_data[key, value] - MUST include key='medication_schedule',
line_items[name, image[src]]
```

**Note:** The `meta_data` array should include ALL metadata entries, as the app searches through them for:
- Tracking-related keys (for orders page)
- `medication_schedule` key (for treatment pages)

---

## Summary: Field Filtering Recommendations

### Subscriptions Endpoint

**Query Parameter Format (if backend supports):**
```
?_fields=id,number,status,date_created,next_payment_date,end_date,currency,total,billing_period,billing_interval,billing,shipping,line_items[name,quantity,total,image[src]],payment_method_title,payment_method,shipping_total,shipping_method
```

**Or separate endpoints:**
- `/api/woocommerce/subscriptions?email={email}` → Minimal fields for list
- `/api/woocommerce/subscriptions/{id}?email={email}` → Full fields for detail

### Orders Endpoint

**Query Parameter Format (if backend supports):**
```
?_fields=id,number,date_created,status,total,currency,line_items[name,quantity,total,image[src]],meta_data[key,value]
```

**Important:** The `meta_data` array MUST include ALL entries (especially `medication_schedule` for treatment pages), as the app searches through them dynamically.

---

## Field Size Impact Estimate

### Subscriptions Endpoint
- **Current:** ~5-15 KB per subscription (with all fields)
- **Optimized (list):** ~2-5 KB per subscription (60-70% reduction)
- **Optimized (detail):** ~8-12 KB per subscription (20-30% reduction)

### Orders Endpoint
- **Current:** ~10-30 KB per order (with all fields)
- **Optimized:** ~5-15 KB per order (50-60% reduction)

**Note:** These estimates assume WooCommerce REST API includes many fields not used by the app. Actual reduction depends on what fields WooCommerce returns by default.

---

## Image Optimization

All image URLs (`line_items[].image.src`) should be converted to thumbnail URLs (150x150) on the client side using the `ImageUtils.convertToThumbnail()` method. This reduces image download size by ~90-95% (from 1-5MB to 50-150KB per image).

---

## Backend Implementation Notes

1. **Field Filtering:** WooCommerce REST API does not natively support field filtering via query parameters. If field filtering is desired, it must be implemented in the backend wrapper API.

2. **Alternative Approach:** Create lightweight endpoints:
   - `/api/woocommerce/subscriptions/lite?email={email}` - Returns minimal fields
   - `/api/woocommerce/subscriptions/{id}/orders/lite?email={email}` - Returns minimal fields

3. **Meta Data:** The `meta_data` array should always be included in full, as the app searches through it for specific keys dynamically.

4. **Image URLs:** Backend can optionally pre-convert image URLs to thumbnails, but client-side conversion is already implemented and works correctly.

