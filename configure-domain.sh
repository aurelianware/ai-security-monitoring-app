#!/bin/bash

# Domain Configuration Script for privaseeai.net
# This script will check DNS propagation and configure the domain in Azure

DOMAIN="privaseeai.net"
WEBAPP_NAME="websecurityapp"
RESOURCE_GROUP="rg-websecurityapp-prod"
VERIFICATION_ID="160080722F0D17A3A4FFF02F5256670F0B0EDE8B8F8BC2931E7CFAF19E543B3A"
AZURE_IP="20.119.128.21"

echo "🌐 Domain Configuration for $DOMAIN"
echo "=================================================="

# Function to check DNS records
check_dns() {
    echo "🔍 Checking DNS records..."
    
    # Check A record
    echo "Checking A record for $DOMAIN..."
    A_RECORD=$(dig +short A $DOMAIN | head -1)
    if [ "$A_RECORD" = "$AZURE_IP" ]; then
        echo "✅ A record is correctly configured: $A_RECORD"
        A_RECORD_OK=true
    else
        echo "❌ A record not configured correctly. Expected: $AZURE_IP, Got: $A_RECORD"
        A_RECORD_OK=false
    fi
    
    # Check TXT record for domain verification
    echo "Checking TXT record for domain verification..."
    TXT_RECORD=$(dig +short TXT asuid.$DOMAIN | tr -d '"')
    if [ "$TXT_RECORD" = "$VERIFICATION_ID" ]; then
        echo "✅ Domain verification TXT record is correctly configured"
        TXT_RECORD_OK=true
    else
        echo "❌ Domain verification TXT record not found or incorrect"
        echo "   Expected: $VERIFICATION_ID"
        echo "   Got: $TXT_RECORD"
        TXT_RECORD_OK=false
    fi
    
    # Check CNAME for www
    echo "Checking CNAME record for www.$DOMAIN..."
    CNAME_RECORD=$(dig +short CNAME www.$DOMAIN)
    if [[ "$CNAME_RECORD" == *"azurewebsites.net"* ]]; then
        echo "✅ CNAME record for www is correctly configured: $CNAME_RECORD"
        CNAME_RECORD_OK=true
    else
        echo "⚠️  CNAME record for www not configured (optional): $CNAME_RECORD"
        CNAME_RECORD_OK=false
    fi
}

# Function to add domain to Azure
add_domain_to_azure() {
    echo "🔧 Adding domain to Azure App Service..."
    
    # Add root domain
    echo "Adding $DOMAIN to Azure App Service..."
    az webapp config hostname add \
        --webapp-name $WEBAPP_NAME \
        --resource-group $RESOURCE_GROUP \
        --hostname $DOMAIN
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully added $DOMAIN to Azure App Service"
    else
        echo "❌ Failed to add $DOMAIN to Azure App Service"
        return 1
    fi
    
    # Add www subdomain if CNAME is configured
    if [ "$CNAME_RECORD_OK" = true ]; then
        echo "Adding www.$DOMAIN to Azure App Service..."
        az webapp config hostname add \
            --webapp-name $WEBAPP_NAME \
            --resource-group $RESOURCE_GROUP \
            --hostname www.$DOMAIN
        
        if [ $? -eq 0 ]; then
            echo "✅ Successfully added www.$DOMAIN to Azure App Service"
        else
            echo "❌ Failed to add www.$DOMAIN to Azure App Service"
        fi
    fi
}

# Function to configure SSL
configure_ssl() {
    echo "🔒 Configuring SSL certificate..."
    
    # Bind SSL certificate for root domain
    az webapp config ssl bind \
        --certificate-thumbprint auto \
        --ssl-type SNI \
        --name $WEBAPP_NAME \
        --resource-group $RESOURCE_GROUP \
        --hostname $DOMAIN
    
    if [ $? -eq 0 ]; then
        echo "✅ SSL certificate configured for $DOMAIN"
    else
        echo "❌ Failed to configure SSL for $DOMAIN"
    fi
    
    # Bind SSL certificate for www subdomain if configured
    if [ "$CNAME_RECORD_OK" = true ]; then
        az webapp config ssl bind \
            --certificate-thumbprint auto \
            --ssl-type SNI \
            --name $WEBAPP_NAME \
            --resource-group $RESOURCE_GROUP \
            --hostname www.$DOMAIN
        
        if [ $? -eq 0 ]; then
            echo "✅ SSL certificate configured for www.$DOMAIN"
        else
            echo "❌ Failed to configure SSL for www.$DOMAIN"
        fi
    fi
}

# Main execution
echo "📋 DNS Records Required:"
echo "1. TXT Record: asuid.$DOMAIN = $VERIFICATION_ID"
echo "2. A Record: $DOMAIN = $AZURE_IP"
echo "3. CNAME Record (optional): www.$DOMAIN = $WEBAPP_NAME.azurewebsites.net"
echo ""

# Check current DNS configuration
check_dns

echo ""
echo "📊 DNS Check Summary:"
echo "A Record: $([ "$A_RECORD_OK" = true ] && echo "✅ OK" || echo "❌ MISSING")"
echo "TXT Record: $([ "$TXT_RECORD_OK" = true ] && echo "✅ OK" || echo "❌ MISSING")"
echo "CNAME Record: $([ "$CNAME_RECORD_OK" = true ] && echo "✅ OK" || echo "⚠️  OPTIONAL")"

# If DNS is ready, configure Azure
if [ "$A_RECORD_OK" = true ] && [ "$TXT_RECORD_OK" = true ]; then
    echo ""
    echo "🚀 DNS records are ready! Configuring Azure..."
    add_domain_to_azure
    
    if [ $? -eq 0 ]; then
        echo "⏳ Waiting 30 seconds for domain binding to complete..."
        sleep 30
        configure_ssl
        
        echo ""
        echo "🎉 Domain configuration complete!"
        echo "Your app should now be available at:"
        echo "   https://$DOMAIN"
        if [ "$CNAME_RECORD_OK" = true ]; then
            echo "   https://www.$DOMAIN"
        fi
        echo ""
        echo "🔄 Next steps:"
        echo "1. Update OAuth applications with new domain"
        echo "2. Test authentication functionality"
        echo "3. Update environment variables in Azure"
    fi
else
    echo ""
    echo "⚠️  DNS records are not ready yet. Please:"
    echo "1. Add the required DNS records to your domain provider"
    echo "2. Wait 5-30 minutes for DNS propagation"
    echo "3. Run this script again"
    echo ""
    echo "💡 You can check DNS propagation at: https://dnschecker.org"
fi