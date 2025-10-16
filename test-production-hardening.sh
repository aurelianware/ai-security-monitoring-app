#!/bin/bash
# Production Hardening Verification Script
# Tests all production-ready features

echo "🧪 Production Hardening Verification Tests"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

test_passed() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

test_failed() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

echo ""
echo "📦 1. Testing Build Process"
echo "----------------------------"

if npm run build > /dev/null 2>&1; then
    test_passed "Build succeeds"
else
    test_failed "Build fails"
fi

if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    test_passed "Build artifacts created"
else
    test_failed "Build artifacts missing"
fi

echo ""
echo "🔧 2. Testing Configuration Files"
echo "----------------------------------"

if [ -f "Dockerfile" ]; then
    test_passed "Dockerfile exists"
else
    test_failed "Dockerfile missing"
fi

if grep -q "node:20-bullseye AS build" Dockerfile; then
    test_passed "Multi-stage build configured"
else
    test_failed "Multi-stage build not configured"
fi

if grep -q "node:20-alpine AS runtime" Dockerfile; then
    test_passed "Alpine runtime configured"
else
    test_failed "Alpine runtime not configured"
fi

if [ -f ".github/workflows/build-and-push.yml" ]; then
    test_passed "Build workflow exists"
else
    test_failed "Build workflow missing"
fi

if [ -f ".github/workflows/deploy-aca.yml" ]; then
    test_passed "Deploy workflow exists"
else
    test_failed "Deploy workflow missing"
fi

if [ -f "infra/blob-lifecycle.json" ]; then
    test_passed "Blob lifecycle policy exists"
else
    test_failed "Blob lifecycle policy missing"
fi

if python3 -c "import json; json.load(open('infra/blob-lifecycle.json'))" 2>/dev/null; then
    test_passed "Blob lifecycle JSON is valid"
else
    test_failed "Blob lifecycle JSON is invalid"
fi

echo ""
echo "🗄️ 3. Testing Prisma Schema"
echo "---------------------------"

if [ -f "prisma/schema.prisma" ]; then
    test_passed "Prisma schema exists"
else
    test_failed "Prisma schema missing"
fi

if grep -q "postgresql" prisma/schema.prisma; then
    test_passed "PostgreSQL datasource configured"
else
    test_failed "PostgreSQL datasource not configured"
fi

if grep -q "model Tenant" prisma/schema.prisma; then
    test_passed "Tenant model defined"
else
    test_failed "Tenant model missing"
fi

if grep -q "model Event" prisma/schema.prisma; then
    test_passed "Event model defined"
else
    test_failed "Event model missing"
fi

echo ""
echo "🔐 4. Testing Security Configuration"
echo "-------------------------------------"

if grep -q "Strict-Transport-Security" server.js; then
    test_passed "HSTS header configured"
else
    test_failed "HSTS header missing"
fi

if grep -q "Content-Security-Policy" server.js; then
    test_passed "CSP header configured"
else
    test_failed "CSP header missing"
fi

if grep -q "X-Frame-Options" server.js; then
    test_passed "X-Frame-Options configured"
else
    test_failed "X-Frame-Options missing"
fi

if grep -q "X-Content-Type-Options" server.js; then
    test_passed "X-Content-Type-Options configured"
else
    test_failed "X-Content-Type-Options missing"
fi

if grep -q "Referrer-Policy" server.js; then
    test_passed "Referrer-Policy configured"
else
    test_failed "Referrer-Policy missing"
fi

if grep -q "Permissions-Policy" server.js; then
    test_passed "Permissions-Policy configured"
else
    test_failed "Permissions-Policy missing"
fi

if grep -q "privaseeai.net" server.js; then
    test_passed "CORS whitelist configured"
else
    test_failed "CORS whitelist missing"
fi

echo ""
echo "🏥 5. Testing Health Endpoints"
echo "------------------------------"

if grep -q "/healthz" server.js; then
    test_passed "/healthz endpoint defined"
else
    test_failed "/healthz endpoint missing"
fi

if grep -q "/health" server.js; then
    test_passed "/health endpoint defined"
else
    test_failed "/health endpoint missing"
fi

if grep -q "HEALTHCHECK" Dockerfile; then
    test_passed "Docker healthcheck configured"
else
    test_failed "Docker healthcheck missing"
fi

echo ""
echo "📊 6. Testing Monitoring Integration"
echo "-------------------------------------"

if grep -q "applicationinsights" server.js; then
    test_passed "Application Insights integration added"
else
    test_failed "Application Insights integration missing"
fi

if grep -q "applicationinsights" package.json; then
    test_passed "applicationinsights package in dependencies"
else
    test_failed "applicationinsights package missing"
fi

echo ""
echo "📚 7. Testing Documentation"
echo "---------------------------"

if grep -q "Production Readiness Checklist" README.md; then
    test_passed "Production Readiness checklist in README"
else
    test_failed "Production Readiness checklist missing"
fi

if [ -f "infra/README.md" ]; then
    test_passed "Infrastructure documentation exists"
else
    test_failed "Infrastructure documentation missing"
fi

echo ""
echo "=========================================="
echo "📊 Test Results Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total:  $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Production hardening complete.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Please review the results above.${NC}"
    exit 1
fi
