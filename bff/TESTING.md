# Testing Fastify BFF on Localhost

## Prerequisites

1. Node.js 18+ installed
2. PostgreSQL database running
3. WooCommerce API credentials
4. WordPress site accessible

## Step 1: Install Dependencies

```bash
# Install root dependencies (if not already done)
npm install

# Install BFF dependencies
cd bff
npm install
cd ..
```

## Step 2: Set Up Environment Variables

Create or update your `.env` file in the root directory with:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# BFF Server Configuration
BFF_PORT=3001
BFF_HOST=127.0.0.1
BFF_JWT_SECRET=your-super-secret-jwt-key-change-in-production
BFF_JWT_ACCESS_EXPIRES=15m
BFF_JWT_REFRESH_EXPIRES=30d

# WooCommerce API (server-only, never exposed to mobile)
WP_BASE_URL=https://alternatehealthclub.com
WC_CONSUMER_KEY=ck_your_consumer_key_here
WC_CONSUMER_SECRET=cs_your_consumer_secret_here

# Optional: Redis Cache
# REDIS_URL=redis://localhost:6379

# Next.js (existing)
PORT=3000
NODE_ENV=development
```

## Step 3: Run Prisma Migration

```bash
# Generate Prisma client
npm run db:generate

# Run migration to create MobileRefreshToken table
npm run db:migrate
```

## Step 4: Start the BFF Server

### Option A: Development Mode (with hot reload)

```bash
# Start BFF only
npm run dev:bff

# Or start both Next.js and BFF together
npm run dev:all
```

The BFF will be available at: `http://127.0.0.1:3001`

### Option B: Production Mode

```bash
# Build the BFF
npm run build:bff

# Start the BFF
npm run start:bff
```

## Step 5: Test the Health Endpoint

```bash
# Test health check
curl http://127.0.0.1:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-15T...",
  "service": "fastify-bff"
}
```

## Step 6: Test Authentication

### Login

```bash
curl -X POST http://127.0.0.1:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "userpassword"
  }'
```

Expected response:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

Save the `accessToken` for subsequent requests.

### Test Protected Endpoint (GET /v1/me)

```bash
curl http://127.0.0.1:3001/v1/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Step 7: Test Other Endpoints

### Get User Profile
```bash
curl http://127.0.0.1:3001/v1/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Addresses
```bash
curl http://127.0.0.1:3001/v1/me/addresses \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Orders
```bash
curl "http://127.0.0.1:3001/v1/me/orders?page=1&per_page=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Subscriptions
```bash
curl http://127.0.0.1:3001/v1/me/subscriptions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Plan
```bash
curl http://127.0.0.1:3001/v1/me/plan \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Treatments
```bash
curl "http://127.0.0.1:3001/v1/me/treatments?page=1&per_page=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Admin: Get Request Logs
```bash
curl "http://127.0.0.1:3001/v1/admin/requests?limit=10"
```

## Step 8: Test Refresh Token

```bash
curl -X POST http://127.0.0.1:3001/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Step 9: Test Logout

```bash
curl -X POST http://127.0.0.1:3001/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Troubleshooting

### Port Already in Use
If port 3001 is already in use:
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Prisma Client Not Generated
```bash
cd bff
npx prisma generate
```

### TypeScript Compilation Errors
```bash
cd bff
npm run typecheck
```

### WooCommerce API Errors
- Verify `WP_BASE_URL` is correct
- Check `WC_CONSUMER_KEY` and `WC_CONSUMER_SECRET` are valid
- Ensure WooCommerce REST API is enabled in WordPress

### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database exists and user has permissions

## Using Postman or Insomnia

Import these endpoints:

1. **Base URL**: `http://127.0.0.1:3001`
2. **Auth**: Set `Authorization` header as `Bearer {token}` for protected routes

## Development Tips

1. **Watch Mode**: Use `npm run dev:bff` for automatic reload on file changes
2. **Logs**: Check console output for detailed request/response logs
3. **Debug**: Set `NODE_ENV=development` for verbose error messages
4. **Request Logs**: Use `/v1/admin/requests` to see recent API calls

## Next Steps

Once local testing is successful:
1. Configure OpenLiteSpeed reverse proxy
2. Set up PM2 for production
3. Configure environment variables on server
4. Test with mobile app
