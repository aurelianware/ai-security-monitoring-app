#!/bin/bash

# Azure Deployment Script for AI Security Monitor
# This script sets up the complete Azure infrastructure

set -e

echo "🚀 Setting up Azure infrastructure for AI Security Monitor..."

# Configuration
RESOURCE_GROUP="websecurity-prod-rg"
LOCATION="eastus"
APP_NAME="ai-security-monitor"
DB_SERVER_NAME="cloudhealthoffice-db-$(date +%s)"
ADMIN_USER="securityadmin"
ADMIN_PASSWORD="SecurePass$(date +%s)!"
DB_NAME="websecurity_prod"
CUSTOM_DOMAIN="cloudhealthoffice.com"

echo "📋 Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  App Name: $APP_NAME"
echo "  Database Server: $DB_SERVER_NAME"
echo ""

# Login to Azure (if not already logged in)
echo "🔐 Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "Please log in to Azure:"
    az login
fi

# Create resource group
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create PostgreSQL server
echo "🗄️  Creating PostgreSQL server..."
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --location $LOCATION \
  --admin-user $ADMIN_USER \
  --admin-password "$ADMIN_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 14 \
  --public-access 0.0.0.0

# Create database
echo "💾 Creating database..."
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --database-name $DB_NAME

# Create App Service plan
echo "⚙️  Creating App Service plan..."
az appservice plan create \
  --name "${APP_NAME}-plan" \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

# Create Web App
echo "🌐 Creating Web App..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan "${APP_NAME}-plan" \
  --name $APP_NAME \
  --runtime "NODE:18-lts" \
  --deployment-source-url https://github.com/aurelianware/ai-security-monitoring-app

# Generate connection string
DB_CONNECTION_STRING="postgresql://$ADMIN_USER:$ADMIN_PASSWORD@$DB_SERVER_NAME.postgres.database.azure.com:5432/$DB_NAME?sslmode=require"

# Configure app settings (placeholder values)
echo "🔧 Configuring app settings..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    NODE_ENV=production \
    NEXTAUTH_URL="https://$CUSTOM_DOMAIN" \
    NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
    DATABASE_URL="$DB_CONNECTION_STRING" \
    STRIPE_PUBLISHABLE_KEY="pk_live_REPLACE_WITH_ACTUAL_KEY" \
    STRIPE_SECRET_KEY="sk_live_REPLACE_WITH_ACTUAL_KEY" \
    STRIPE_WEBHOOK_SECRET="whsec_REPLACE_WITH_ACTUAL_SECRET" \
    GOOGLE_CLIENT_ID="REPLACE_WITH_ACTUAL_CLIENT_ID" \
    GOOGLE_CLIENT_SECRET="REPLACE_WITH_ACTUAL_CLIENT_SECRET" \
    GITHUB_CLIENT_ID="REPLACE_WITH_ACTUAL_CLIENT_ID" \
    GITHUB_CLIENT_SECRET="REPLACE_WITH_ACTUAL_CLIENT_SECRET"

echo ""
echo "✅ Azure infrastructure setup complete!"
echo ""
echo "📄 Summary:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Web App URL: https://$APP_NAME.azurewebsites.net"
echo "  Custom Domain: https://$CUSTOM_DOMAIN (configure DNS)"
echo "  Database Server: $DB_SERVER_NAME.postgres.database.azure.com"
echo "  Database Name: $DB_NAME"
echo ""
echo "🔐 Database Credentials:"
echo "  Username: $ADMIN_USER"
echo "  Password: $ADMIN_PASSWORD"
echo ""
echo "🌐 DNS Configuration Required:"
echo "  Add CNAME record in GoDaddy:"
echo "  Type: CNAME"
echo "  Name: @ (or www)"
echo "  Value: $APP_NAME.azurewebsites.net"
echo "  TTL: 3600"
echo ""
echo "📝 Next Steps:"
echo "  1. Configure DNS in GoDaddy (above)"
echo "  2. Add custom domain to Azure App Service"
echo "  3. Set up Stripe production keys"
echo "  4. Configure OAuth production credentials"
echo "  5. Deploy your application"
echo ""
echo "💰 Estimated monthly cost: ~$25 USD (well under your $150 credit!)"