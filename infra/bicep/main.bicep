// Main Bicep Template
// Orchestrates infrastructure deployment for Aurelian AI Security Monitoring

targetScope = 'resourceGroup'

@description('Environment name (dev, staging, prod)')
param environment string = 'dev'

@description('Name prefix for all resources')
param namePrefix string = 'aurelian'

@description('Location for all resources')
param location string = resourceGroup().location

@description('SQL Server administrator username')
param sqlAdminUsername string = 'sqladmin'

@description('SQL Server administrator password')
@secure()
param sqlAdminPassword string

@description('Storage account SKU')
@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_RAGRS'
  'Standard_ZRS'
  'Premium_LRS'
])
param storageAccountSku string = 'Standard_LRS'

@description('SQL Database SKU')
param sqlDatabaseSku string = 'Basic'

@description('SQL Database tier')
param sqlDatabaseTier string = 'Basic'

@description('Function App runtime')
param functionAppRuntime string = 'node'

@description('Function App runtime version')
param functionAppRuntimeVersion string = '20'

// Generate unique resource names
var uniqueSuffix = uniqueString(resourceGroup().id)
var storageAccountName = '${namePrefix}${environment}st${uniqueSuffix}'
var keyVaultName = '${namePrefix}-${environment}-kv-${uniqueSuffix}'
var sqlServerName = '${namePrefix}-${environment}-sql-${uniqueSuffix}'
var eventGridTopicName = '${namePrefix}-${environment}-eg-${uniqueSuffix}'
var functionAppName = '${namePrefix}-${environment}-func-${uniqueSuffix}'

var tags = {
  environment: environment
  managedBy: 'bicep'
  project: 'aurelian-security-monitoring'
}

// Storage Account
module storage './modules/storage.bicep' = {
  name: 'storage-deployment'
  params: {
    storageAccountName: storageAccountName
    location: location
    sku: storageAccountSku
    containerName: 'encounters'
    tags: tags
  }
}

// Key Vault
module keyVault './modules/keyvault.bicep' = {
  name: 'keyvault-deployment'
  params: {
    keyVaultName: keyVaultName
    location: location
    sku: 'standard'
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enablePurgeProtection: false // DEV: false; PROD: should be true
    tags: tags
  }
}

// Azure SQL Database
module sqlDatabase './modules/sql.bicep' = {
  name: 'sql-deployment'
  params: {
    sqlServerName: sqlServerName
    databaseName: 'emrdb'
    location: location
    administratorLogin: sqlAdminUsername
    administratorLoginPassword: sqlAdminPassword
    skuName: sqlDatabaseSku
    tier: sqlDatabaseTier
    tags: tags
  }
}

// Event Grid Topic
module eventGrid './modules/eventgrid.bicep' = {
  name: 'eventgrid-deployment'
  params: {
    topicName: eventGridTopicName
    location: location
    tags: tags
  }
}

// Function App
module functions './modules/functions.bicep' = {
  name: 'functions-deployment'
  params: {
    functionAppName: functionAppName
    location: location
    storageAccountName: storage.outputs.storageAccountName
    runtime: functionAppRuntime
    runtimeVersion: functionAppRuntimeVersion
    tags: tags
  }
}

// Outputs
@description('Storage Account Name')
output storageAccountName string = storage.outputs.storageAccountName

@description('Storage Blob Endpoint')
output storageBlobEndpoint string = storage.outputs.blobEndpoint

@description('Encounters Container Name')
output encountersContainerName string = storage.outputs.containerName

@description('Key Vault Name')
output keyVaultName string = keyVault.outputs.keyVaultName

@description('Key Vault URI')
output keyVaultUri string = keyVault.outputs.keyVaultUri

@description('SQL Server Name')
output sqlServerName string = sqlDatabase.outputs.sqlServerName

@description('SQL Server FQDN')
output sqlServerFqdn string = sqlDatabase.outputs.sqlServerFqdn

@description('SQL Database Name')
output sqlDatabaseName string = sqlDatabase.outputs.databaseName

@description('SQL Connection String Template')
output sqlConnectionStringTemplate string = sqlDatabase.outputs.connectionStringTemplate

@description('Event Grid Topic Name')
output eventGridTopicName string = eventGrid.outputs.topicName

@description('Event Grid Topic Endpoint')
output eventGridTopicEndpoint string = eventGrid.outputs.topicEndpoint

@description('Function App Name')
output functionAppName string = functions.outputs.functionAppName

@description('Function App Hostname')
output functionAppHostname string = functions.outputs.defaultHostname
