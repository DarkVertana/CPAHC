#!/bin/bash

# Fastify BFF API Testing Script
# Usage: ./test-endpoints.sh [access_token]

BASE_URL="http://127.0.0.1:3001"
TOKEN="${1:-}"

echo "=== Fastify BFF API Testing ==="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test Health
echo -e "${YELLOW}1. Testing Health Endpoint${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Health check failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}2. Testing Login (no token provided, skipping protected endpoints)${NC}"
    echo "To test protected endpoints, run:"
    echo "  ./test-endpoints.sh YOUR_ACCESS_TOKEN"
    echo ""
    exit 0
fi

# Test Protected Endpoints
echo -e "${YELLOW}2. Testing Protected Endpoints with Token${NC}"
echo ""

# GET /v1/me
echo -e "${YELLOW}  → GET /v1/me${NC}"
response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/v1/me")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" -eq 200 ]; then
    echo -e "  ${GREEN}✓ Success${NC}"
else
    echo -e "  ${RED}✗ Failed (HTTP $http_code)${NC}"
fi
echo ""

# GET /v1/me/addresses
echo -e "${YELLOW}  → GET /v1/me/addresses${NC}"
response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/v1/me/addresses")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" -eq 200 ]; then
    echo -e "  ${GREEN}✓ Success${NC}"
else
    echo -e "  ${RED}✗ Failed (HTTP $http_code)${NC}"
fi
echo ""

# GET /v1/me/orders
echo -e "${YELLOW}  → GET /v1/me/orders${NC}"
response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/v1/me/orders?page=1&per_page=5")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" -eq 200 ]; then
    echo -e "  ${GREEN}✓ Success${NC}"
else
    echo -e "  ${RED}✗ Failed (HTTP $http_code)${NC}"
fi
echo ""

# GET /v1/me/subscriptions
echo -e "${YELLOW}  → GET /v1/me/subscriptions${NC}"
response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/v1/me/subscriptions")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" -eq 200 ]; then
    echo -e "  ${GREEN}✓ Success${NC}"
else
    echo -e "  ${RED}✗ Failed (HTTP $http_code)${NC}"
fi
echo ""

# GET /v1/me/plan
echo -e "${YELLOW}  → GET /v1/me/plan${NC}"
response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/v1/me/plan")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" -eq 200 ]; then
    echo -e "  ${GREEN}✓ Success${NC}"
else
    echo -e "  ${RED}✗ Failed (HTTP $http_code)${NC}"
fi
echo ""

# GET /v1/me/treatments
echo -e "${YELLOW}  → GET /v1/me/treatments${NC}"
response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/v1/me/treatments?page=1&per_page=5")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" -eq 200 ]; then
    echo -e "  ${GREEN}✓ Success${NC}"
else
    echo -e "  ${RED}✗ Failed (HTTP $http_code)${NC}"
fi
echo ""

# GET /v1/admin/requests
echo -e "${YELLOW}  → GET /v1/admin/requests${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/v1/admin/requests?limit=5")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" -eq 200 ]; then
    echo -e "  ${GREEN}✓ Success${NC}"
else
    echo -e "  ${RED}✗ Failed (HTTP $http_code)${NC}"
fi
echo ""

echo -e "${GREEN}=== Testing Complete ===${NC}"
