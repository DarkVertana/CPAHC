# Android App - Field Request Instructions

This document provides the exact `fields` query parameter values your Android app should use for each endpoint to minimize payload size.

---

## 1. Subscriptions Endpoint

### For Subscriptions List Page (`subscriptions_page.dart`)

**Endpoint:**
```
GET /api/woocommerce/subscriptions?email={email}&fields={fields}
```

**Fields Parameter:**
```
id,number,status,date_created,next_payment_date,end_date,currency,total,billing_period,billing_interval,line_items.name,line_items.image.src
```

**Full URL Example:**
```
GET /api/woocommerce/subscriptions?email=user@example.com&fields=id,number,status,date_created,next_payment_date,end_date,currency,total,billing_period,billing_interval,line_items.name,line_items.image.src
```

**Dart/Flutter Code Example:**
```dart
final fields = 'id,number,status,date_created,next_payment_date,end_date,currency,total,billing_period,billing_interval,line_items.name,line_items.image.src';
final url = Uri.parse('$baseUrl/api/woocommerce/subscriptions?email=$email&fields=$fields');
```

---

### For Subscription Details Page (`subscription_details_page.dart`)

**Endpoint:**
```
GET /api/woocommerce/subscriptions?email={email}&fields={fields}
```

**Fields Parameter:**
```
id,number,status,date_created,next_payment_date,end_date,currency,total,billing_period,billing_interval,billing.first_name,billing.last_name,billing.address_1,billing.address_2,billing.city,billing.state,billing.postcode,billing.country,billing.email,billing.phone,shipping.first_name,shipping.last_name,shipping.address_1,shipping.address_2,shipping.city,shipping.state,shipping.postcode,shipping.country,line_items.name,line_items.quantity,line_items.total,line_items.image.src,payment_method_title,payment_method,shipping_total,shipping_method
```

**Full URL Example:**
```
GET /api/woocommerce/subscriptions?email=user@example.com&fields=id,number,status,date_created,next_payment_date,end_date,currency,total,billing_period,billing_interval,billing.first_name,billing.last_name,billing.address_1,billing.address_2,billing.city,billing.state,billing.postcode,billing.country,billing.email,billing.phone,shipping.first_name,shipping.last_name,shipping.address_1,shipping.address_2,shipping.city,shipping.state,shipping.postcode,shipping.country,line_items.name,line_items.quantity,line_items.total,line_items.image.src,payment_method_title,payment_method,shipping_total,shipping_method
```

**Dart/Flutter Code Example:**
```dart
final fields = 'id,number,status,date_created,next_payment_date,end_date,currency,total,billing_period,billing_interval,billing.first_name,billing.last_name,billing.address_1,billing.address_2,billing.city,billing.state,billing.postcode,billing.country,billing.email,billing.phone,shipping.first_name,shipping.last_name,shipping.address_1,shipping.address_2,shipping.city,shipping.state,shipping.postcode,shipping.country,line_items.name,line_items.quantity,line_items.total,line_items.image.src,payment_method_title,payment_method,shipping_total,shipping_method';
final url = Uri.parse('$baseUrl/api/woocommerce/subscriptions?email=$email&fields=$fields');
```

---

## 2. Orders Endpoint (Per Subscription)

### For Orders Page (`orders_page.dart`)

**Endpoint:**
```
GET /api/woocommerce/subscriptions/{id}/orders?email={email}&fields={fields}
```

**Fields Parameter:**
```
id,number,date_created,status,total,currency,line_items.name,line_items.quantity,line_items.total,line_items.image.src,meta_data
```

**Full URL Example:**
```
GET /api/woocommerce/subscriptions/123/orders?email=user@example.com&fields=id,number,date_created,status,total,currency,line_items.name,line_items.quantity,line_items.total,line_items.image.src,meta_data
```

**Dart/Flutter Code Example:**
```dart
final fields = 'id,number,date_created,status,total,currency,line_items.name,line_items.quantity,line_items.total,line_items.image.src,meta_data';
final url = Uri.parse('$baseUrl/api/woocommerce/subscriptions/$subscriptionId/orders?email=$email&fields=$fields');
```

**Note:** `meta_data` is always included automatically (for tracking numbers), but you should still request it explicitly.

---

### For My Plan Page & Treatment History Pages (`my_plan_page.dart`, `treatment_history_page.dart`, `treatment_history_details_page.dart`)

**Endpoint:**
```
GET /api/woocommerce/subscriptions/{id}/orders?email={email}&fields={fields}
```

**Fields Parameter:**
```
id,date_created,meta_data,line_items.name,line_items.image.src
```

**Full URL Example:**
```
GET /api/woocommerce/subscriptions/123/orders?email=user@example.com&fields=id,date_created,meta_data,line_items.name,line_items.image.src
```

**Dart/Flutter Code Example:**
```dart
final fields = 'id,date_created,meta_data,line_items.name,line_items.image.src';
final url = Uri.parse('$baseUrl/api/woocommerce/subscriptions/$subscriptionId/orders?email=$email&fields=$fields');
```

**Critical:** `meta_data` MUST be included - it contains the `medication_schedule` key required for treatment pages.

---

### For Subscription Details Page - Related Orders (`subscription_details_page.dart`)

**Same as Orders Page:**
```
id,number,date_created,status,total,currency,line_items.name,line_items.quantity,line_items.total,line_items.image.src,meta_data
```

---

## 3. All Orders Endpoint (Not Per Subscription)

**Endpoint:**
```
GET /api/woocommerce/orders?email={email}&fields={fields}
```

**Fields Parameter:**
```
id,number,date_created,status,total,currency,line_items.name,line_items.quantity,line_items.total,line_items.image.src,meta_data
```

**Full URL Example:**
```
GET /api/woocommerce/orders?email=user@example.com&fields=id,number,date_created,status,total,currency,line_items.name,line_items.quantity,line_items.total,line_items.image.src,meta_data
```

**Dart/Flutter Code Example:**
```dart
final fields = 'id,number,date_created,status,total,currency,line_items.name,line_items.quantity,line_items.total,line_items.image.src,meta_data';
final url = Uri.parse('$baseUrl/api/woocommerce/orders?email=$email&fields=$fields');
```

---

## Implementation Guide

### Option 1: Add to Each API Call

Simply append `&fields={field_list}` to your existing API URLs.

**Before:**
```dart
final url = Uri.parse('$baseUrl/api/woocommerce/subscriptions?email=$email');
```

**After:**
```dart
final fields = 'id,number,status,date_created,next_payment_date,end_date,currency,total,billing_period,billing_interval,line_items.name,line_items.image.src';
final url = Uri.parse('$baseUrl/api/woocommerce/subscriptions?email=$email&fields=$fields');
```

### Option 2: Create Constants (Recommended)

Create a constants file to manage field lists:

```dart
// api_fields.dart
class ApiFields {
  // Subscriptions
  static const String subscriptionsList = 'id,number,status,date_created,next_payment_date,end_date,currency,total,billing_period,billing_interval,line_items.name,line_items.image.src';
  
  static const String subscriptionsDetail = 'id,number,status,date_created,next_payment_date,end_date,currency,total,billing_period,billing_interval,billing.first_name,billing.last_name,billing.address_1,billing.address_2,billing.city,billing.state,billing.postcode,billing.country,billing.email,billing.phone,shipping.first_name,shipping.last_name,shipping.address_1,shipping.address_2,shipping.city,shipping.state,shipping.postcode,shipping.country,line_items.name,line_items.quantity,line_items.total,line_items.image.src,payment_method_title,payment_method,shipping_total,shipping_method';
  
  // Orders
  static const String ordersList = 'id,number,date_created,status,total,currency,line_items.name,line_items.quantity,line_items.total,line_items.image.src,meta_data';
  
  static const String ordersTreatment = 'id,date_created,meta_data,line_items.name,line_items.image.src';
}

// Usage
final url = Uri.parse('$baseUrl/api/woocommerce/subscriptions?email=$email&fields=${ApiFields.subscriptionsList}');
```

---

## Expected Payload Size Reduction

- **Subscriptions List:** ~60-70% reduction (from 15 KB to 5 KB per subscription)
- **Subscriptions Detail:** ~20-30% reduction (from 15 KB to 12 KB per subscription)
- **Orders List:** ~50-60% reduction (from 30 KB to 15 KB per order)
- **Orders Treatment:** ~70-80% reduction (from 30 KB to 6 KB per order)

---

## Important Notes

1. **Backward Compatible:** If you don't include `fields` parameter, you'll still get all data (but larger payloads)

2. **meta_data Always Included:** For orders, `meta_data` is automatically included even if not in the fields list (required for medication_schedule)

3. **Future-Proof:** If you need additional fields in the future, just add them to the fields parameter - no backend changes needed

4. **Testing:** Test with and without the `fields` parameter to ensure your app handles both cases correctly

---

## Quick Reference - Copy-Paste Field Lists

### Subscriptions List
```
id,number,status,date_created,next_payment_date,end_date,currency,total,billing_period,billing_interval,line_items.name,line_items.image.src
```

### Subscriptions Detail
```
id,number,status,date_created,next_payment_date,end_date,currency,total,billing_period,billing_interval,billing.first_name,billing.last_name,billing.address_1,billing.address_2,billing.city,billing.state,billing.postcode,billing.country,billing.email,billing.phone,shipping.first_name,shipping.last_name,shipping.address_1,shipping.address_2,shipping.city,shipping.state,shipping.postcode,shipping.country,line_items.name,line_items.quantity,line_items.total,line_items.image.src,payment_method_title,payment_method,shipping_total,shipping_method
```

### Orders List
```
id,number,date_created,status,total,currency,line_items.name,line_items.quantity,line_items.total,line_items.image.src,meta_data
```

### Orders Treatment
```
id,date_created,meta_data,line_items.name,line_items.image.src
```

