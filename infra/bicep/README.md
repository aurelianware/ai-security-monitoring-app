# Bicep Infrastructure for Aurelian AI Security Monitoring

Azure infrastructure-as-code using Bicep for the AI Security Monitoring application.

## Overview

This deployment creates:

- **Storage Account** with `encounters` container for blob storage
- **Key Vault** (RBAC mode) for secrets management
- **Azure SQL Database** (`emrdb`) for structured data
- **Event Grid Topic** for event-driven architecture
- **Function App** (consumption plan) for serverless compute

## Prerequisites

- Azure CLI installed
- Azure subscription
- Appropriate permissions to create resources

## Quick Start

### 1. Login to Azure

```bash
az login
az account set --subscription "<YOUR_SUBSCRIPTION_ID>"
```

### 2. Create Resource Group

```bash
az group create \
  --name rg-aurelian-dev \
  --location eastus
```

### 3. Deploy Infrastructure

```bash
az deployment group create \
  --resource-group rg-aurelian-dev \
  --template-file infra/bicep/main.bicep \
  --parameters infra/bicep/main.dev.bicepparam
```

## Deployment Parameters

### main.dev.bicepparam (Development)

- **environment**: `dev`
- **namePrefix**: `aurelian`
- **sqlAdminUsername**: `sqladmin`
- **sqlAdminPassword**: `ChangeMe123!` (⚠️ Change in production!)
- **storageAccountSku**: `Standard_LRS`
- **sqlDatabaseSku**: `Basic`
- **sqlDatabaseTier**: `Basic`
- **functionAppRuntime**: `node`
- **functionAppRuntimeVersion**: `20`

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Azure Resource Group                   │
│                                                  │
│  ┌──────────────┐      ┌──────────────┐         │
│  │   Storage    │      │  Key Vault   │         │
│  │   Account    │      │    (RBAC)    │         │
│  │              │      │              │         │
│  │ - encounters │      │ - Secrets    │         │
│  └──────────────┘      └──────────────┘         │
│                                                  │
│  ┌──────────────┐      ┌──────────────┐         │
│  │   Azure SQL  │      │  Event Grid  │         │
│  │   Database   │      │    Topic     │         │
│  │              │      │              │         │
│  │ - emrdb      │      │ - Events     │         │
│  └──────────────┘      └──────────────┘         │
│                                                  │
│  ┌──────────────────────────────────┐           │
│  │       Function App                │          │
│  │     (Consumption Plan)            │          │
│  │                                   │          │
│  │  - Node.js 20                     │          │
│  │  - Serverless compute             │          │
│  └──────────────────────────────────┘           │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Outputs

After deployment, you'll receive:

- **storageAccountName**: Name of the storage account
- **storageBlobEndpoint**: Blob storage endpoint
- **encountersContainerName**: Container name for encounters
- **keyVaultName**: Key Vault name
- **keyVaultUri**: Key Vault URI
- **sqlServerName**: SQL Server name
- **sqlServerFqdn**: SQL Server fully qualified domain name
- **sqlDatabaseName**: Database name
- **sqlConnectionStringTemplate**: Connection string template
- **eventGridTopicName**: Event Grid topic name
- **eventGridTopicEndpoint**: Event Grid endpoint
- **functionAppName**: Function App name
- **functionAppHostname**: Function App hostname

## Modules

### storage.bicep

Creates a Storage Account with:
- Hot access tier
- TLS 1.2 minimum
- 7-day blob retention
- `encounters` container with private access

### keyvault.bicep

Creates a Key Vault with:
- RBAC authorization
- Soft delete enabled (7 days retention)
- Standard SKU
- TLS 1.2 minimum

### sql.bicep

Creates Azure SQL with:
- SQL Server v12
- Basic tier database (2GB)
- Firewall rule for Azure services
- TLS 1.2 minimum

### eventgrid.bicep

Creates Event Grid Topic with:
- EventGridSchema input
- Public network access (DEV)

### functions.bicep

Creates Function App with:
- Consumption (Y1) plan
- Node.js 20 runtime
- Linux OS
- HTTPS only
- Functions runtime v4

## Security Considerations

### DEV Profile (Current)

⚠️ **Development settings - NOT production-ready:**

- Public endpoints enabled for quick development
- SQL admin password in parameter file
- Basic tier SQL database
- No private endpoints
- No customer-managed keys (CMK)
- Function App storage keys in app settings

### PROD Profile (Recommended)

For production deployments, implement:

1. **Private Endpoints**
   - Storage Account private endpoint
   - SQL Database private endpoint
   - Key Vault private endpoint
   - Virtual Network integration

2. **Managed Identity**
   - Enable system-assigned managed identity for Function App
   - Use managed identity for Key Vault access
   - Use managed identity for Storage access

3. **Customer-Managed Keys**
   - Enable CMK for Storage Account
   - Enable TDE with CMK for SQL Database

4. **Secrets Management**
   - Store SQL admin password in Key Vault
   - Reference Key Vault secrets in app settings
   - Remove inline passwords

5. **Network Security**
   - Set `publicNetworkAccess: 'Disabled'` for all resources
   - Configure firewall rules
   - Use vNet integration for Function App

6. **Enhanced SKUs**
   - Storage: `Standard_GRS` or higher
   - SQL: `Standard` or `Premium` tier
   - Key Vault: Consider Premium for HSM

## Next Steps

1. **Wire Event Grid Subscription**
   ```bash
   az eventgrid event-subscription create \
     --name blob-to-function \
     --source-resource-id <storage-account-id> \
     --endpoint <function-endpoint> \
     --endpoint-type azurefunction
   ```

2. **Deploy Function Code**
   - Create ingest function for processing blobs
   - Deploy using Azure Functions Core Tools or CI/CD

3. **Add Private Endpoints** (for production)
   - Create `privateEndpoints.bicep` module
   - Deploy vNet and subnets
   - Create private endpoints for all services

4. **Configure CI/CD**
   - GitHub Actions workflow for infrastructure
   - Separate environments (dev, staging, prod)
   - Automated testing and validation

## Cost Estimation

**DEV Environment (estimated monthly):**
- Storage Account (LRS): ~$0.50
- Key Vault: ~$0.30
- Azure SQL Basic: ~$5.00
- Event Grid: ~$0.60
- Function App (consumption): ~$0.50

**Total: ~$7/month** (excluding data transfer and compute beyond free tier)

## Cleanup

To delete all resources:

```bash
az group delete --name rg-aurelian-dev --yes --no-wait
```

## Troubleshooting

### Deployment Fails with Name Conflict

Resource names must be globally unique. The template uses `uniqueString()` to generate unique suffixes. If deployment fails, try:
- Use a different `namePrefix`
- Deploy to a different resource group

### SQL Connection Issues

Ensure firewall rules allow your IP:
```bash
az sql server firewall-rule create \
  --resource-group rg-aurelian-dev \
  --server <sql-server-name> \
  --name AllowMyIP \
  --start-ip-address <your-ip> \
  --end-ip-address <your-ip>
```

### Function App Storage Access Error

The Function App requires storage account keys. In DEV, these are set with `<set>` placeholder. Update manually or use Key Vault references.

## License

MIT
