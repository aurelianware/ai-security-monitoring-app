// Development Environment Parameters
using './main.bicep'

param environment = 'dev'
param namePrefix = 'aurelian'
param sqlAdminUsername = 'sqladmin'
param sqlAdminPassword = 'ChangeMe123!' // TODO: Replace with secure password from Key Vault
param storageAccountSku = 'Standard_LRS'
param sqlDatabaseSku = 'Basic'
param sqlDatabaseTier = 'Basic'
param functionAppRuntime = 'node'
param functionAppRuntimeVersion = '20'
