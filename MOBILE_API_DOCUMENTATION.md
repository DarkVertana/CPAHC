# Mobile Application API Documentation

This document provides comprehensive documentation for all APIs available for building mobile applications (Android/iOS) that integrate with the MY AHC Control Panel.

## Table of Contents

1. [Authentication](#authentication)
2. [Base URL](#base-url)
3. [API Endpoints](#api-endpoints)
   - [User Management](#user-management)
   - [Weight Logs](#weight-logs)
   - [Blogs](#blogs)
   - [Medicines](#medicines)
   - [Medicine Categories](#medicine-categories)
   - [WooCommerce Integration](#woocommerce-integration)
4. [Error Handling](#error-handling)
5. [Best Practices](#best-practices)
6. [Rate Limiting](#rate-limiting)

---

## Authentication

All API endpoints require authentication using an API key. The API key must be included in every request.

### API Key Format

API keys must start with the prefix: `ahc_live_sk_`

Example: `ahc_live_sk_abc123xyz789...`

### Authentication Methods

You can send the API key using either of these methods:

#### Method 1: X-API-Key Header (Recommended)
```http
X-API-Key: ahc_live_sk_your_api_key_here
```

#### Method 2: Authorization Bearer Header
```http
Authorization: Bearer ahc_live_sk_your_api_key_here
```

### Getting an API Key

API keys are generated and managed through the admin dashboard at `/dashboard/settings/api-keys`. Only administrators can create and manage API keys.

---

## Base URL

All API endpoints are relative to your deployment URL:

**Production:** `https://your-domain.com/api`

**Development:** `http://localhost:3000/api`

---

## API Endpoints

### User Management

#### 1. Register User

Register a new user or retrieve existing user data when a user logs into the mobile app.

**Endpoint:** `POST /api/app-users/register`

**Headers:**
```http
Content-Type: application/json
X-API-Key: ahc_live_sk_your_api_key_here
```

**Request Body:**
```json
{
  "wpUserId": "123",
  "email": "user@example.com",
  "name": "John Doe",
  "displayName": "John",
  "phone": "+1234567890",
  "age": 30,
  "height": "5'10\"",
  "weight": "180",
  "goal": "170",
  "initialWeight": "185",
  "weightSet": true
}
```

**Required Fields:**
- `wpUserId` (string): WordPress user ID
- `email` (string): User email address

**Optional Fields:**
- `name` (string): User's full name
- `displayName` (string): User's display name
- `phone` (string): Phone number
- `age` (number): User's age
- `height` (string): User's height
- `weight` (string): Current weight in lbs
- `goal` (string): Goal weight in lbs
- `initialWeight` (string): Initial weight when user started
- `weightSet` (boolean): Whether weight data has been set

**Response (201 Created - New User):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "clx123abc",
    "wpUserId": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "displayName": "John",
    "phone": "+1234567890",
    "age": 30,
    "height": "5'10\"",
    "weight": "180",
    "goal": "170",
    "initialWeight": "185",
    "weightSet": true,
    "status": "Active",
    "lastLoginAt": "2024-01-15T10:30:00.000Z",
    "lastLoginIp": "192.168.1.1",
    "loginCount": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (200 OK - Existing User):**
```json
{
  "success": true,
  "message": "User already registered. Returning existing user data.",
  "user": {
    "id": "clx123abc",
    "wpUserId": "123",
    "email": "user@example.com",
    ...
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: Invalid or missing API key
- `409 Conflict`: User with this email already exists (duplicate registration attempt)

**Important Notes:**
- If a user with the same email already exists, registration is rejected with a 409 error
- If a user with the same `wpUserId` already exists, the existing user data is returned and login tracking is updated
- This endpoint should be called when a user successfully logs into the mobile app

---

#### 2. Get User

Retrieve user data by WordPress user ID or email.

**Endpoint:** `GET /api/app-users/get`

**Headers:**
```http
X-API-Key: ahc_live_sk_your_api_key_here
```

**Query Parameters:**
- `wpUserId` (string, optional): WordPress user ID
- `email` (string, optional): User email address

**Note:** At least one of `wpUserId` or `email` must be provided.

**Example Request:**
```http
GET /api/app-users/get?wpUserId=123
GET /api/app-users/get?email=user@example.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "clx123abc",
    "wpUserId": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "displayName": "John",
    "phone": "+1234567890",
    "age": 30,
    "height": "5'10\"",
    "weight": "180",
    "goal": "170",
    "initialWeight": "185",
    "weightSet": true,
    "status": "Active",
    "lastLoginAt": "2024-01-15T10:30:00.000Z",
    "lastLoginIp": "192.168.1.1",
    "loginCount": 5,
    "tasksToday": 3,
    "totalWorkouts": 25,
    "totalCalories": 5000,
    "streak": 7,
    "createdAt": "2024-01-10T08:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing both wpUserId and email parameters
- `401 Unauthorized`: Invalid or missing API key
- `404 Not Found`: User not found

---

### Weight Logs

#### 3. Submit Weight Log

Submit a new weight log entry for a user.

**Endpoint:** `POST /api/weight-logs/public`

**Headers:**
```http
Content-Type: application/json
X-API-Key: ahc_live_sk_your_api_key_here
```

**Request Body:**
```json
{
  "userId": "123",
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "weight": 175.5,
  "date": "2024-01-15T10:30:00.000Z"
}
```

**Required Fields:**
- `userId` (string): WordPress user ID or user identifier
- `userEmail` (string): User email address
- `weight` (number): Weight in lbs (must be positive)

**Optional Fields:**
- `userName` (string): User's name
- `date` (string, ISO 8601): Date of the weight log (defaults to current date/time)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Weight log created successfully",
  "weightLog": {
    "id": "clx456def",
    "userId": "123",
    "userEmail": "user@example.com",
    "userName": "John Doe",
    "date": "2024-01-15",
    "weight": 175.5,
    "previousWeight": 180.0,
    "change": -4.5,
    "changeType": "decrease",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Change Types:**
- `increase`: Weight increased from previous log
- `decrease`: Weight decreased from previous log
- `no-change`: Weight remained the same

**Important Notes:**
- The system automatically calculates the change from the previous weight log
- If no previous weight log exists, `previousWeight`, `change`, and `changeType` will be `null`
- The user's current weight in the `app_user` table is automatically updated
- If the user doesn't exist, a new user record is created automatically

**Error Responses:**
- `400 Bad Request`: Missing required fields or invalid weight value
- `401 Unauthorized`: Invalid or missing API key
- `500 Internal Server Error`: Server error

---

#### 4. Get Weight Logs

Retrieve weight logs for a specific user.

**Endpoint:** `GET /api/weight-logs/public`

**Headers:**
```http
X-API-Key: ahc_live_sk_your_api_key_here
```

**Query Parameters:**
- `userId` (string, optional): WordPress user ID
- `userEmail` (string, optional): User email address
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 50)
- `startDate` (string, optional): Filter from date (YYYY-MM-DD)
- `endDate` (string, optional): Filter to date (YYYY-MM-DD)

**Note:** At least one of `userId` or `userEmail` must be provided.

**Example Request:**
```http
GET /api/weight-logs/public?userId=123&page=1&limit=10
GET /api/weight-logs/public?userEmail=user@example.com&startDate=2024-01-01&endDate=2024-01-31
```

**Response (200 OK):**
```json
{
  "success": true,
  "logs": [
    {
      "id": "clx456def",
      "userId": "123",
      "userEmail": "user@example.com",
      "userName": "John Doe",
      "appUser": {
        "id": "clx123abc",
        "email": "user@example.com",
        "name": "John Doe",
        "displayName": "John",
        "wpUserId": "123"
      },
      "date": "2024-01-15",
      "weight": 175.5,
      "previousWeight": 180.0,
      "change": -4.5,
      "changeType": "decrease",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing both userId and userEmail parameters
- `401 Unauthorized`: Invalid or missing API key
- `500 Internal Server Error`: Server error

---

### Blogs

#### 5. Get Blogs

Retrieve published blog posts.

**Endpoint:** `GET /api/blogs/public`

**Headers:**
```http
X-API-Key: ahc_live_sk_your_api_key_here
```

**Query Parameters:**
- `id` (string, optional): Get a single blog by ID
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 50)
- `search` (string, optional): Search term (searches title, tagline, description, and tags)
- `tag` (string, optional): Filter by specific tag

**Example Request:**
```http
GET /api/blogs/public?page=1&limit=10
GET /api/blogs/public?id=clx789ghi
GET /api/blogs/public?search=health&tag=fitness
```

**Response - Single Blog (200 OK):**
```json
{
  "success": true,
  "blog": {
    "id": "clx789ghi",
    "title": "10 Tips for Healthy Living",
    "tagline": "Discover the secrets to a healthier lifestyle",
    "description": "<p>Rich HTML content here...</p>",
    "tags": ["health", "fitness", "wellness"],
    "featuredImage": "https://example.com/image.jpg",
    "createdAt": "2024-01-10T08:00:00.000Z",
    "updatedAt": "2024-01-12T14:30:00.000Z"
  }
}
```

**Response - List of Blogs (200 OK):**
```json
{
  "success": true,
  "blogs": [
    {
      "id": "clx789ghi",
      "title": "10 Tips for Healthy Living",
      "tagline": "Discover the secrets to a healthier lifestyle",
      "description": "<p>Rich HTML content here...</p>",
      "tags": ["health", "fitness", "wellness"],
      "featuredImage": "https://example.com/image.jpg",
      "createdAt": "2024-01-10T08:00:00.000Z",
      "updatedAt": "2024-01-12T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Important Notes:**
- Only published blogs are returned
- The `description` field contains HTML content that should be rendered in a WebView or HTML renderer
- Tags are returned as an array of strings

**Error Responses:**
- `401 Unauthorized`: Invalid or missing API key
- `404 Not Found`: Blog not found or not published (when using `id` parameter)
- `500 Internal Server Error`: Server error

---

### Medicines

#### 6. Get Medicines

Retrieve active medicines/products.

**Endpoint:** `GET /api/medicines/public`

**Headers:**
```http
X-API-Key: ahc_live_sk_your_api_key_here
```

**Query Parameters:**
- `id` (string, optional): Get a single medicine by ID
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 50)
- `search` (string, optional): Search term (searches title, tagline, and description)
- `categoryId` (number, optional): Filter by category ID

**Example Request:**
```http
GET /api/medicines/public?page=1&limit=10
GET /api/medicines/public?id=clx123abc
GET /api/medicines/public?categoryId=1&search=vitamin
```

**Response - Single Medicine (200 OK):**
```json
{
  "success": true,
  "medicine": {
    "id": "clx123abc",
    "categoryId": 1,
    "category": {
      "id": 1,
      "title": "Weight Loss",
      "tagline": "Accelerate Your Metabolism Naturally"
    },
    "title": "Premium Fat Burner",
    "tagline": "Advanced weight loss formula",
    "description": "Detailed product description...",
    "image": "data:image/png;base64,iVBORw0KGgo...",
    "url": "https://example.com/product/premium-fat-burner",
    "createdAt": "2024-01-10T08:00:00.000Z",
    "updatedAt": "2024-01-12T14:30:00.000Z"
  }
}
```

**Response - List of Medicines (200 OK):**
```json
{
  "success": true,
  "medicines": [
    {
      "id": "clx123abc",
      "categoryId": 1,
      "category": {
        "id": 1,
        "title": "Weight Loss",
        "tagline": "Accelerate Your Metabolism Naturally"
      },
      "title": "Premium Fat Burner",
      "tagline": "Advanced weight loss formula",
      "description": "Detailed product description...",
      "image": "data:image/png;base64,iVBORw0KGgo...",
      "url": "https://example.com/product/premium-fat-burner",
      "createdAt": "2024-01-10T08:00:00.000Z",
      "updatedAt": "2024-01-12T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Important Notes:**
- Only active medicines are returned
- Images are stored as Base64 data URLs
- Each medicine includes its category information

**Error Responses:**
- `401 Unauthorized`: Invalid or missing API key
- `404 Not Found`: Medicine not found or not active (when using `id` parameter)
- `500 Internal Server Error`: Server error

---

### Medicine Categories

#### 7. Get Medicine Categories

Retrieve medicine categories.

**Endpoint:** `GET /api/medicine-categories/public`

**Headers:**
```http
X-API-Key: ahc_live_sk_your_api_key_here
```

**Query Parameters:**
- `id` (number, optional): Get a single category by ID
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 50, max: 100)
- `search` (string, optional): Search term (searches title and tagline)

**Example Request:**
```http
GET /api/medicine-categories/public?page=1&limit=50
GET /api/medicine-categories/public?id=1
GET /api/medicine-categories/public?search=weight
```

**Response - Single Category (200 OK):**
```json
{
  "success": true,
  "category": {
    "id": 1,
    "title": "Weight Loss",
    "tagline": "Accelerate Your Metabolism Naturally",
    "medicineCount": 15,
    "createdAt": "2024-01-10T08:00:00.000Z",
    "updatedAt": "2024-01-12T14:30:00.000Z"
  }
}
```

**Response - List of Categories (200 OK):**
```json
{
  "success": true,
  "categories": [
    {
      "id": 1,
      "title": "Weight Loss",
      "tagline": "Accelerate Your Metabolism Naturally",
      "medicineCount": 15,
      "createdAt": "2024-01-10T08:00:00.000Z",
      "updatedAt": "2024-01-12T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

**Important Notes:**
- Category IDs are numeric and start from 1
- Each category includes the count of medicines in that category

**Error Responses:**
- `400 Bad Request`: Invalid category ID format
- `401 Unauthorized`: Invalid or missing API key
- `404 Not Found`: Category not found (when using `id` parameter)
- `500 Internal Server Error`: Server error

---

### WooCommerce Integration

#### 8. Get WooCommerce Orders

Retrieve orders from WooCommerce based on user email.

**Endpoint:** `GET /api/woocommerce/orders`

**Headers:**
```http
X-API-Key: ahc_live_sk_your_api_key_here
```

**Query Parameters:**
- `email` (string, required): User email address

**Example Request:**
```http
GET /api/woocommerce/orders?email=user@example.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "orders": [
    {
      "id": 12345,
      "status": "processing",
      "date_created": "2024-01-15T10:30:00",
      "total": "99.99",
      "currency": "USD",
      "line_items": [
        {
          "id": 678,
          "name": "Premium Fat Burner",
          "quantity": 2,
          "price": "49.99",
          "image": "https://example.com/product-image.jpg"
        }
      ],
      "billing": {
        "first_name": "John",
        "last_name": "Doe",
        "email": "user@example.com",
        "phone": "+1234567890"
      },
      "shipping": {
        "first_name": "John",
        "last_name": "Doe",
        "address_1": "123 Main St",
        "city": "New York",
        "state": "NY",
        "postcode": "10001",
        "country": "US"
      }
    }
  ]
}
```

**Important Notes:**
- WooCommerce API credentials must be configured in admin settings
- The API automatically enriches order items with product details (name, quantity, image)
- Only orders for the specified email are returned

**Error Responses:**
- `400 Bad Request`: Missing email parameter or invalid WooCommerce API URL
- `401 Unauthorized`: Invalid or missing API key
- `500 Internal Server Error`: WooCommerce API error or configuration issue

---

#### 9. Cancel WooCommerce Order

Cancel an order in WooCommerce.

**Endpoint:** `POST /api/woocommerce/orders`

**Headers:**
```http
Content-Type: application/json
X-API-Key: ahc_live_sk_your_api_key_here
```

**Request Body:**
```json
{
  "orderId": 12345,
  "email": "user@example.com"
}
```

**Required Fields:**
- `orderId` (number): WooCommerce order ID
- `email` (string): User email for verification

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "order": {
    "id": 12345,
    "status": "cancelled",
    ...
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: Invalid or missing API key
- `403 Forbidden`: Order does not belong to the specified email
- `404 Not Found`: Order not found
- `409 Conflict`: Order cannot be cancelled (already cancelled or completed)
- `500 Internal Server Error`: Server error

---

#### 10. Get WooCommerce Subscriptions

Retrieve subscriptions from WooCommerce based on user email.

**Endpoint:** `GET /api/woocommerce/subscriptions`

**Headers:**
```http
X-API-Key: ahc_live_sk_your_api_key_here
```

**Query Parameters:**
- `email` (string, required): User email address

**Example Request:**
```http
GET /api/woocommerce/subscriptions?email=user@example.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "subscriptions": [
    {
      "id": 789,
      "status": "active",
      "date_created": "2024-01-01T00:00:00",
      "next_payment_date": "2024-02-01T00:00:00",
      "billing_period": "month",
      "billing_interval": 1,
      "total": "29.99",
      "currency": "USD",
      "line_items": [
        {
          "id": 456,
          "name": "Monthly Premium Plan",
          "quantity": 1,
          "price": "29.99"
        }
      ]
    }
  ]
}
```

**Important Notes:**
- Requires WooCommerce Subscriptions plugin to be installed
- WooCommerce API credentials must be configured in admin settings

**Error Responses:**
- `400 Bad Request`: Missing email parameter or invalid WooCommerce API URL
- `401 Unauthorized`: Invalid or missing API key
- `404 Not Found`: Subscriptions endpoint not found (plugin may not be installed)
- `500 Internal Server Error`: WooCommerce API error or configuration issue

---

## Error Handling

All API endpoints follow a consistent error response format:

### Error Response Structure

```json
{
  "error": "Error message describing what went wrong",
  "details": "Additional error details (only in development mode)"
}
```

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters or missing required fields
- `401 Unauthorized`: Invalid or missing API key
- `403 Forbidden`: Access denied (e.g., order doesn't belong to user)
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate registration)
- `500 Internal Server Error`: Server error

### Error Handling Best Practices

1. **Always check the HTTP status code** before processing the response
2. **Handle 401 errors** by prompting the user to re-authenticate
3. **Log error details** for debugging (but don't display sensitive information to users)
4. **Implement retry logic** for network errors (with exponential backoff)
5. **Show user-friendly error messages** based on the error type

### Example Error Handling (Flutter/Dart)

```dart
try {
  final response = await http.get(
    Uri.parse('$baseUrl/api/blogs/public'),
    headers: {
      'X-API-Key': apiKey,
    },
  );

  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    // Process successful response
  } else if (response.statusCode == 401) {
    // Handle unauthorized - invalid API key
    throw Exception('Invalid API key. Please contact support.');
  } else {
    final error = json.decode(response.body);
    throw Exception(error['error'] ?? 'An error occurred');
  }
} catch (e) {
  // Handle network errors, timeouts, etc.
  print('Error: $e');
}
```

---

## Best Practices

### 1. API Key Security

- **Never commit API keys to version control**
- Store API keys securely (use secure storage on mobile devices)
- Rotate API keys periodically
- Use different API keys for development and production

### 2. Request Optimization

- **Use pagination** for large datasets (don't request all records at once)
- **Cache responses** when appropriate (blogs, categories, etc.)
- **Implement request debouncing** for search functionality
- **Use appropriate page sizes** (default limits are optimized)

### 3. Data Handling

- **Validate data** before sending to the API
- **Handle null values** appropriately
- **Parse dates correctly** (ISO 8601 format)
- **Display loading states** during API calls

### 4. Network Handling

- **Implement timeout handling** (recommended: 30 seconds)
- **Handle offline scenarios** gracefully
- **Retry failed requests** with exponential backoff
- **Show appropriate error messages** to users

### 5. User Experience

- **Show loading indicators** during API calls
- **Provide feedback** for user actions (success/error messages)
- **Implement pull-to-refresh** for lists
- **Cache frequently accessed data** locally

---

## Rate Limiting

Currently, there are no strict rate limits implemented. However, to ensure optimal performance:

- **Avoid making excessive requests** in a short time period
- **Implement client-side caching** to reduce API calls
- **Batch requests** when possible
- **Use pagination** instead of fetching all data at once

If you experience performance issues, contact the administrator to review API usage patterns.

---

## Example Integration (Flutter/Dart)

### API Service Class

```dart
class ApiService {
  static const String baseUrl = 'https://your-domain.com/api';
  static const String apiKey = 'ahc_live_sk_your_api_key_here';

  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
  };

  // Register User
  static Future<Map<String, dynamic>> registerUser({
    required String wpUserId,
    required String email,
    String? name,
    String? weight,
    String? goal,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/app-users/register'),
      headers: headers,
      body: json.encode({
        'wpUserId': wpUserId,
        'email': email,
        'name': name,
        'weight': weight,
        'goal': goal,
      }),
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to register user');
    }
  }

  // Submit Weight Log
  static Future<Map<String, dynamic>> submitWeightLog({
    required String userId,
    required String userEmail,
    required double weight,
    String? date,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/weight-logs/public'),
      headers: headers,
      body: json.encode({
        'userId': userId,
        'userEmail': userEmail,
        'weight': weight,
        'date': date,
      }),
    );

    if (response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to submit weight log');
    }
  }

  // Get Blogs
  static Future<Map<String, dynamic>> getBlogs({
    int page = 1,
    int limit = 10,
    String? search,
    String? tag,
  }) async {
    final queryParams = {
      'page': page.toString(),
      'limit': limit.toString(),
      if (search != null) 'search': search,
      if (tag != null) 'tag': tag,
    };

    final response = await http.get(
      Uri.parse('$baseUrl/blogs/public').replace(queryParameters: queryParams),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to fetch blogs');
    }
  }

  // Get Medicines
  static Future<Map<String, dynamic>> getMedicines({
    int page = 1,
    int limit = 10,
    int? categoryId,
    String? search,
  }) async {
    final queryParams = {
      'page': page.toString(),
      'limit': limit.toString(),
      if (categoryId != null) 'categoryId': categoryId.toString(),
      if (search != null) 'search': search,
    };

    final response = await http.get(
      Uri.parse('$baseUrl/medicines/public').replace(queryParameters: queryParams),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to fetch medicines');
    }
  }
}
```

---

## Support

For API support, issues, or questions:

1. Check this documentation first
2. Review error messages and status codes
3. Contact the development team with:
   - API endpoint being used
   - Request details (without sensitive data)
   - Error response received
   - Steps to reproduce

---

## Changelog

### Version 1.0.0 (Current)
- Initial API documentation
- User registration and retrieval
- Weight logs submission and retrieval
- Blogs API
- Medicines and categories API
- WooCommerce integration (orders and subscriptions)

---

**Last Updated:** January 2024

**API Version:** 1.0.0

