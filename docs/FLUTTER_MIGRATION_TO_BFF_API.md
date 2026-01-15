# Flutter App Migration Plan: Next.js API → Fastify BFF API

## Overview

Migrate the Flutter Android app from using Next.js API endpoints (with API key authentication) to Fastify BFF API endpoints (with JWT token authentication).

## Key Changes Summary

### 1. Base URL Change

- **Old**: `https://appanel.alternatehealthclub.com/api/...` (Next.js API base URL)
- **New**: `https://api.alternatehealthclub.com/v1/...` (BFF API)

### 2. Authentication Change

- **Old**: API Key in headers (`X-API-Key` or `Authorization: Bearer <api-key>`)
- **New**: JWT Access Token in headers (`Authorization: Bearer <access-token>`)
- **New**: Token refresh mechanism using refresh tokens

### 3. Login Flow Change

- **Old**: App authenticates with WordPress JWT, then calls `/api/app-users/register`
- **New**: App calls BFF `/v1/auth/login` with email/username + password, receives BFF tokens

## Endpoint Mapping

### Authentication Endpoints

| Old Endpoint | New BFF Endpoint | Changes |
|--------------|------------------|---------|
| `POST https://appanel.alternatehealthclub.com/api/app-users/register` | `POST /v1/auth/login` | **Complete change** - Now handles WordPress auth + returns tokens |
| N/A | `POST /v1/auth/refresh` | **New** - Refresh access token |
| N/A | `POST /v1/auth/logout` | **New** - Revoke refresh token |

**Login Request (New)**:

```dart
POST https://api.alternatehealthclub.com/v1/auth/login
Headers: { "Content-Type": "application/json" }
Body: {
  "email": "user@example.com",  // or "username": "testuser"
  "password": "password",
  "deviceId": "optional-device-id"
}
```

**Login Response (New)**:

```dart
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "cuid...",
    "email": "user@example.com",
    "name": "User Name",
    "displayName": "User Name"
  }
}
```

### User Profile Endpoints

| Old Endpoint | New BFF Endpoint | Changes |
|--------------|------------------|---------|
| `GET https://appanel.alternatehealthclub.com/api/app-users/get?wpUserId=...` or `?email=...` | `GET /v1/me` | No query params needed (user from JWT token) |

**Request (New)**:

```dart
GET https://api.alternatehealthclub.com/v1/me
Headers: { "Authorization": "Bearer <access-token>" }
```

**Response (New)**:

```dart
{
  "id": "cuid...",
  "email": "user@example.com",
  "name": "User Name",
  "displayName": "User Name"
}
```

### WooCommerce Data Endpoints

| Old Endpoint | New BFF Endpoint | Changes |
|--------------|------------------|---------|
| `GET https://appanel.alternatehealthclub.com/api/woocommerce/subscriptions?email=...` | `GET /v1/me/subscriptions` | No email param (from JWT token) |
| `GET https://appanel.alternatehealthclub.com/api/woocommerce/orders?email=...&page=1&per_page=20` | `GET /v1/me/orders?page=1&per_page=20&status=any` | No email param, optional status filter |
| `GET https://appanel.alternatehealthclub.com/api/woocommerce/orders/{orderId}` (if exists) | `GET /v1/me/orders/{orderId}` | No email param needed |
| `GET https://appanel.alternatehealthclub.com/api/woocommerce/billing-address?email=...` | `GET /v1/me/addresses` | Returns both billing AND shipping |
| `PUT https://appanel.alternatehealthclub.com/api/woocommerce/billing-address` | `PATCH /v1/me/addresses` | Method change, body format similar |

**Subscriptions Request (New)**:

```dart
GET https://api.alternatehealthclub.com/v1/me/subscriptions
Headers: { "Authorization": "Bearer <access-token>" }
```

**Orders Request (New)**:

```dart
GET https://api.alternatehealthclub.com/v1/me/orders?page=1&per_page=20&status=any
Headers: { "Authorization": "Bearer <access-token>" }
// status can be: "any", "pending", "processing", "completed", "cancelled", etc.
```

**Addresses Request (New)**:

```dart
GET https://api.alternatehealthclub.com/v1/me/addresses
Headers: { "Authorization": "Bearer <access-token>" }

Response: {
  "billing": { ... },
  "shipping": { ... }
}
```

**Update Addresses Request (New)**:

```dart
PATCH https://api.alternatehealthclub.com/v1/me/addresses
Headers: { 
  "Authorization": "Bearer <access-token>",
  "Content-Type": "application/json"
}
Body: {
  "billing": { ... },  // Optional - only include fields to update
  "shipping": { ... }  // Optional - only include fields to update
}
```

### New Endpoints (Not in Old API)

| New BFF Endpoint | Purpose |
|------------------|---------|
| `GET /v1/me/plan` | Get active subscriptions with latest related orders |
| `GET /v1/me/treatments?page=1&per_page=20` | Get orders with treatment data |
| `GET /v1/me/treatments/{orderId}` | Get parsed treatment data for specific order |

## Implementation Steps

### Step 1: Update API Configuration

**Create/Update API Configuration File**:

```dart
class ApiConfig {
  // Old base URL (remove after migration)
  // static const String baseUrl = 'https://appanel.alternatehealthclub.com/api';
  
  // New BFF base URL
  static const String baseUrl = 'https://api.alternatehealthclub.com/v1';
  
  // Remove API key storage
  // static String? apiKey;
  
  // Add token storage
  static String? accessToken;
  static String? refreshToken;
}
```

### Step 2: Implement Token Storage

**Use secure storage for tokens** (e.g., `flutter_secure_storage`):

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  static const _storage = FlutterSecureStorage();
  
  static Future<void> saveTokens(String accessToken, String refreshToken) async {
    await _storage.write(key: 'access_token', value: accessToken);
    await _storage.write(key: 'refresh_token', value: refreshToken);
  }
  
  static Future<String?> getAccessToken() async {
    return await _storage.read(key: 'access_token');
  }
  
  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: 'refresh_token');
  }
  
  static Future<void> clearTokens() async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }
}
```

### Step 3: Update HTTP Client with Token Interceptor

**Create authenticated HTTP client**:

```dart
import 'package:dio/dio.dart';

class ApiClient {
  final Dio _dio = Dio();
  
  ApiClient() {
    _dio.options.baseUrl = ApiConfig.baseUrl;
    _dio.options.headers['Content-Type'] = 'application/json';
    
    // Add token interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await TokenStorage.getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        // Handle 401 - token expired, try refresh
        if (error.response?.statusCode == 401) {
          final refreshed = await _refreshToken();
          if (refreshed) {
            // Retry original request
            final opts = error.requestOptions;
            final token = await TokenStorage.getAccessToken();
            opts.headers['Authorization'] = 'Bearer $token';
            final response = await _dio.request(
              opts.path,
              options: Options(
                method: opts.method,
                headers: opts.headers,
              ),
              data: opts.data,
              queryParameters: opts.queryParameters,
            );
            return handler.resolve(response);
          }
        }
        handler.next(error);
      },
    ));
  }
  
  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await TokenStorage.getRefreshToken();
      if (refreshToken == null) return false;
      
      final response = await _dio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      
      if (response.statusCode == 200) {
        final newAccessToken = response.data['accessToken'];
        await TokenStorage.saveTokens(newAccessToken, refreshToken);
        return true;
      }
    } catch (e) {
      // Refresh failed, logout user
      await TokenStorage.clearTokens();
    }
    return false;
  }
}
```

### Step 4: Update Authentication Service

**Replace old login flow**:

```dart
// OLD (Remove):
// 1. Authenticate with WordPress JWT
// 2. Call POST https://appanel.alternatehealthclub.com/api/app-users/register with user data

// NEW:
class AuthService {
  final ApiClient _client = ApiClient();
  
  Future<LoginResponse> login(String email, String password, {String? deviceId}) async {
    try {
      final response = await _client.post(
        '/auth/login',
        data: {
          'email': email,  // or 'username': email
          'password': password,
          if (deviceId != null) 'deviceId': deviceId,
        },
      );
      
      final loginResponse = LoginResponse.fromJson(response.data);
      
      // Save tokens
      await TokenStorage.saveTokens(
        loginResponse.accessToken,
        loginResponse.refreshToken,
      );
      
      return loginResponse;
    } catch (e) {
      throw AuthException('Login failed: ${e.toString()}');
    }
  }
  
  Future<void> logout() async {
    try {
      final refreshToken = await TokenStorage.getRefreshToken();
      if (refreshToken != null) {
        await _client.post('/auth/logout', data: {'refreshToken': refreshToken});
      }
    } catch (e) {
      // Continue with logout even if API call fails
    } finally {
      await TokenStorage.clearTokens();
    }
  }
}
```

### Step 5: Update Data Services

**Subscriptions Service**:

```dart
// OLD:
// GET https://appanel.alternatehealthclub.com/api/woocommerce/subscriptions?email=user@example.com
// Headers: { "X-API-Key": apiKey }

// NEW:
class SubscriptionsService {
  final ApiClient _client = ApiClient();
  
  Future<List<Subscription>> getSubscriptions() async {
    final response = await _client.get('/me/subscriptions');
    return (response.data['subscriptions'] as List)
        .map((json) => Subscription.fromJson(json))
        .toList();
  }
}
```

**Orders Service**:

```dart
// OLD:
// GET https://appanel.alternatehealthclub.com/api/woocommerce/orders?email=user@example.com&page=1&per_page=20
// Headers: { "X-API-Key": apiKey }

// NEW:
class OrdersService {
  final ApiClient _client = ApiClient();
  
  Future<OrdersResponse> getOrders({
    int page = 1,
    int perPage = 20,
    String? status,  // "any", "pending", "completed", etc.
  }) async {
    final queryParams = {
      'page': page,
      'per_page': perPage,
      if (status != null) 'status': status,
    };
    
    final response = await _client.get('/me/orders', queryParameters: queryParams);
    return OrdersResponse.fromJson(response.data);
  }
  
  Future<Order> getOrderDetails(int orderId) async {
    final response = await _client.get('/me/orders/$orderId');
    return Order.fromJson(response.data);
  }
}
```

**Addresses Service**:

```dart
// OLD:
// GET https://appanel.alternatehealthclub.com/api/woocommerce/billing-address?email=user@example.com
// PUT https://appanel.alternatehealthclub.com/api/woocommerce/billing-address
// Body: { "email": "...", "billing": {...} }

// NEW:
class AddressesService {
  final ApiClient _client = ApiClient();
  
  Future<AddressesResponse> getAddresses() async {
    final response = await _client.get('/me/addresses');
    return AddressesResponse.fromJson(response.data);
  }
  
  Future<AddressesResponse> updateAddresses({
    Map<String, dynamic>? billing,
    Map<String, dynamic>? shipping,
  }) async {
    final response = await _client.patch(
      '/me/addresses',
      data: {
        if (billing != null) 'billing': billing,
        if (shipping != null) 'shipping': shipping,
      },
    );
    return AddressesResponse.fromJson(response.data);
  }
}
```

**User Service**:

```dart
// OLD:
// GET https://appanel.alternatehealthclub.com/api/app-users/get?wpUserId=123 or ?email=user@example.com
// Headers: { "X-API-Key": apiKey }

// NEW:
class UserService {
  final ApiClient _client = ApiClient();
  
  Future<User> getProfile() async {
    final response = await _client.get('/me');
    return User.fromJson(response.data);
  }
}
```

### Step 6: Add New Services (Plan & Treatments)

**Plan Service**:

```dart
class PlanService {
  final ApiClient _client = ApiClient();
  
  Future<List<PlanSubscription>> getActivePlan() async {
    final response = await _client.get('/me/plan');
    return (response.data['plan'] as List)
        .map((json) => PlanSubscription.fromJson(json))
        .toList();
  }
}
```

**Treatments Service**:

```dart
class TreatmentsService {
  final ApiClient _client = ApiClient();
  
  Future<TreatmentsResponse> getTreatments({
    int page = 1,
    int perPage = 20,
  }) async {
    final response = await _client.get(
      '/me/treatments',
      queryParameters: {
        'page': page,
        'per_page': perPage,
      },
    );
    return TreatmentsResponse.fromJson(response.data);
  }
  
  Future<Treatment> getTreatmentByOrderId(int orderId) async {
    final response = await _client.get('/me/treatments/$orderId');
    return Treatment.fromJson(response.data);
  }
}
```

## Data Model Updates

### Remove from Models

- Remove `email` query parameters from request models
- Remove API key from storage/models

### Add to Models

- `LoginResponse` model:

```dart
class LoginResponse {
  final String accessToken;
  final String refreshToken;
  final UserSummary user;
  
  LoginResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });
  
  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      accessToken: json['accessToken'],
      refreshToken: json['refreshToken'],
      user: UserSummary.fromJson(json['user']),
    );
  }
}
```

- `AddressesResponse` model (now includes both billing and shipping):

```dart
class AddressesResponse {
  final Address billing;
  final Address shipping;
  
  AddressesResponse({
    required this.billing,
    required this.shipping,
  });
}
```

- `PlanSubscription` model:

```dart
class PlanSubscription {
  final Subscription subscription;
  final Order? latestOrder;
  final Treatment? treatment;
}
```

## Error Handling Updates

### Token Expiration Handling

- Implement automatic token refresh on 401 errors
- If refresh fails, redirect to login screen
- Clear stored tokens on logout

### Error Response Format

BFF returns consistent error format:

```dart
{
  "error": "Error message",
  "details": "Additional details (development only)"
}
```

## Migration Checklist

- [ ] Update base URL configuration
- [ ] Remove API key storage and usage
- [ ] Implement token storage (secure storage)
- [ ] Update HTTP client with token interceptor
- [ ] Implement token refresh logic
- [ ] Update login flow (remove WordPress JWT direct call, use BFF login)
- [ ] Update user profile endpoint
- [ ] Update subscriptions endpoint (remove email param)
- [ ] Update orders endpoint (remove email param, add status filter)
- [ ] Update addresses endpoint (now returns billing + shipping)
- [ ] Update address update endpoint (method: PUT → PATCH)
- [ ] Add plan endpoint integration
- [ ] Add treatments endpoint integration
- [ ] Update error handling for new error format
- [ ] Test token refresh flow
- [ ] Test logout flow
- [ ] Remove old API key authentication code
- [ ] Update all API service classes
- [ ] Update UI to use new endpoints
- [ ] Test all screens that use API calls

## Testing Strategy

1. **Authentication Flow**:
   - Test login with email
   - Test login with username
   - Test token refresh on 401
   - Test logout

2. **Data Fetching**:
   - Test all endpoints with valid token
   - Test endpoints with expired token (should auto-refresh)
   - Test endpoints with invalid token (should redirect to login)

3. **Edge Cases**:
   - Network errors
   - Server errors (500)
   - Invalid credentials
   - Token refresh failure

## Rollback Plan

If issues occur, you can temporarily:

1. Keep both API implementations
2. Use feature flag to switch between old and new APIs
3. Gradually migrate endpoints one by one

## Notes

- The BFF handles WordPress authentication internally - app no longer needs to call WordPress JWT endpoint directly
- All user identification is now via JWT token (no email query params needed)
- Refresh tokens are stored securely and used automatically
- Access tokens expire in 15 minutes (configurable)
- Refresh tokens expire in 30 days (configurable)
