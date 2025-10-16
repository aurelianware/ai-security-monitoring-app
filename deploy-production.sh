#!/bin/bash

# Azure Resource Provisioning Script for WebSecurityApp Production
# This script creates Azure resources using Bicep templates

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Azure Resource Provisioning for WebSecurityApp${NC}"
echo "========================================================="

# Configuration - Update these values
RESOURCE_GROUP="rg-websecurityapp-prod"
LOCATION="eastus2"
APP_NAME="websecurityapp"
ENVIRONMENT="production"

echo -e "${YELLOW}Configuration:${NC}"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "App Name: $APP_NAME"
echo "Environment: $ENVIRONMENT"
echo ""

# Check if user is logged into Azure CLI
echo -e "${BLUE}🔍 Checking Azure CLI authentication...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${RED}❌ Not logged into Azure CLI. Please run 'az login'${NC}"
    exit 1
fi

SUBSCRIPTION_ID=$(az account show --query id --output tsv)
echo -e "${GREEN}✅ Logged into Azure (Subscription: $SUBSCRIPTION_ID)${NC}"

# Create Resource Group
echo -e "${BLUE}📦 Creating Resource Group...${NC}"
az group create \
    --name $RESOURCE_GROUP \
    --location $LOCATION \
    --output table

# Deploy Bicep template
echo -e "${BLUE}🏗️  Deploying Azure resources with Bicep...${NC}"
DEPLOYMENT_NAME="websecurityapp-$(date +%Y%m%d-%H%M%S)"

az deployment group create \
    --resource-group $RESOURCE_GROUP \
    --template-file deploy/azure-app-service.bicep \
    --parameters \
        appName=$APP_NAME \
        location=$LOCATION \
    --name $DEPLOYMENT_NAME \
    --output table

# Get deployment outputs
echo -e "${BLUE}📋 Getting deployment details...${NC}"
APP_URL=$(az deployment group show \
    --resource-group $RESOURCE_GROUP \
    --name $DEPLOYMENT_NAME \
    --query properties.outputs.appUrl.value \
    --output tsv)

STORAGE_CONNECTION_STRING=$(az deployment group show \
    --resource-group $RESOURCE_GROUP \
    --name $DEPLOYMENT_NAME \
    --query properties.outputs.storageConnectionString.value \
    --output tsv)

APP_INSIGHTS_KEY=$(az deployment group show \
    --resource-group $RESOURCE_GROUP \
    --name $DEPLOYMENT_NAME \
    --query properties.outputs.appInsightsInstrumentationKey.value \
    --output tsv)

# Display results
echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "========================================================="
echo -e "${YELLOW}App URL:${NC} $APP_URL"
echo -e "${YELLOW}Storage Connection String:${NC} $STORAGE_CONNECTION_STRING"
echo -e "${YELLOW}Application Insights Key:${NC} $APP_INSIGHTS_KEY"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Update your .env.production file with these values"
echo "2. Configure OAuth applications with production URLs"
echo "3. Set up GitHub Actions secrets for deployment"
echo "4. Configure custom domain (optional)"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC} Save the connection string and keys securely!"