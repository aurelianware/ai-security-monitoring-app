# Azure Deployment Guide

## Prerequisites
- Azure CLI installed
- Azure subscription active
- Domain chosen (pending)

## 1. Resource Group Setup
```bash
az group create --name websecurity-prod-rg --location "East US"
```

## 2. Database Setup (PostgreSQL)
```bash
# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group websecurity-prod-rg \
  --name websecurity-db-server \
  --location "East US" \
  --admin-user securityadmin \
  --admin-password [SECURE_PASSWORD] \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 14

# Create database
az postgres flexible-server db create \
  --resource-group websecurity-prod-rg \
  --server-name websecurity-db-server \
  --database-name websecurity-prod
```

## 3. App Service Plan
```bash
az appservice plan create \
  --name websecurity-plan \
  --resource-group websecurity-prod-rg \
  --sku B1 \
  --is-linux
```

## 4. Web App Creation
```bash
az webapp create \
  --resource-group websecurity-prod-rg \
  --plan websecurity-plan \
  --name ai-security-monitor \
  --runtime "NODE:18-lts" \
  --deployment-source-url https://github.com/aurelianware/ai-security-monitoring-app
```

## 5. Environment Variables
Set in Azure Portal or via CLI:
```bash
az webapp config appsettings set \
  --resource-group websecurity-prod-rg \
  --name ai-security-monitor \
  --settings \
    NODE_ENV=production \
    NEXTAUTH_URL=https://yourdomain.com \
    NEXTAUTH_SECRET=[SECURE_SECRET] \
    DATABASE_URL=[POSTGRES_CONNECTION_STRING] \
    STRIPE_PUBLISHABLE_KEY=[pk_live_...] \
    STRIPE_SECRET_KEY=[sk_live_...] \
    GOOGLE_CLIENT_ID=[PRODUCTION_ID] \
    GITHUB_CLIENT_ID=[PRODUCTION_ID]
```

## 6. Custom Domain & SSL
```bash
# Add custom domain
az webapp config hostname add \
  --resource-group websecurity-prod-rg \
  --webapp-name ai-security-monitor \
  --hostname yourdomain.com

# Enable HTTPS
az webapp config ssl create \
  --resource-group websecurity-prod-rg \
  --name ai-security-monitor \
  --hostname yourdomain.com
```

## 7. Deployment Pipeline
Using GitHub Actions for CI/CD:
- Automatic deployment on push to main
- Build and test before deployment
- Zero-downtime deployment

## Estimated Costs (Monthly)
- App Service B1: ~$13
- PostgreSQL Flexible Server: ~$12
- Custom domain SSL: Free with App Service
- **Total: ~$25/month**

## Next Steps After Deployment
1. Test all functionality
2. Set up monitoring and alerts
3. Configure backup strategy
4. Performance optimization
5. Security hardening