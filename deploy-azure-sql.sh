#!/bin/bash

# Azure Deployment Script for AI Security Monitor (SQL Database Version)
# This script sets up the complete Azure infrastructure

set -e

echo "🚀 Setting up Azure infrastructure for AI Security Monitor..."

# Configuration
RESOURCE_GROUP="websecurity-prod-rg"
LOCATION="eastus"
APP_NAME="ai-security-monitor"
SQL_SERVER_NAME="cloudhealthoffice-sql-$(date +%s)"
ADMIN_USER="securityadmin"
ADMIN_PASSWORD="SecurePass$(date +%s)!"
DB_NAME="websecurity_prod"
CUSTOM_DOMAIN="cloudhealthoffice.com"

echo "📋 Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  App Name: $APP_NAME"
echo "  SQL Server: $SQL_SERVER_NAME"
echo ""

# Create SQL Server
echo "🗄️  Creating SQL Server..."
az sql server create \
  --resource-group $RESOURCE_GROUP \
  --name $SQL_SERVER_NAME \
  --location $LOCATION \
  --admin-user $ADMIN_USER \
  --admin-password "$ADMIN_PASSWORD"

# Configure firewall to allow Azure services
echo "🔥 Configuring firewall..."
az sql server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER_NAME \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Create database
echo "💾 Creating database..."
az sql db create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER_NAME \
  --name $DB_NAME \
  --edition Basic \
  --capacity 5

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
  --runtime "NODE:20-lts" \
  --deployment-source-url https://github.com/aurelianware/ai-security-monitoring-app

# Generate connection string for SQL Server
DB_CONNECTION_STRING="sqlserver://$SQL_SERVER_NAME.database.windows.net:1433;database=$DB_NAME;user=$ADMIN_USER;password=$ADMIN_PASSWORD;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30;"

# Configure app settings
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
echo "  SQL Server: $SQL_SERVER_NAME.database.windows.net"
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