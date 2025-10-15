# Quick Start Guide

## Testing the EDI X12 837D Builder

### Install Dependencies
```bash
cd services/edi-x12
npm install
```

### Build
```bash
npm run build
```

### Run Tests
```bash
npm test
```

Expected output:
```
✓ test/builder837D.test.ts  (15 tests) 
Test Files  1 passed (1)
Tests  15 passed (15)
```

### Generate 837D File
```bash
npm run gen:837d
```

Expected output:
```
🏗️  Building 837D transaction...
✅ 837D file generated successfully!
📄 Output: /path/to/outbox/CLM0001.837d
📊 Size: 988 bytes
```

View the generated file:
```bash
cat outbox/CLM0001.837d
```

---

## Deploying Bicep Infrastructure

### Prerequisites
- Azure CLI installed (`az --version`)
- Azure subscription
- Logged in to Azure (`az login`)

### Validate Bicep Files
```bash
cd infra/bicep
az bicep build --file main.bicep
```

Expected output: (no errors, files compile successfully)

### Deploy to Azure

1. **Set your subscription**
```bash
az account set --subscription "<YOUR_SUBSCRIPTION_ID>"
```

2. **Create resource group**
```bash
az group create \
  --name rg-aurelian-dev \
  --location eastus
```

3. **Deploy infrastructure**
```bash
az deployment group create \
  --resource-group rg-aurelian-dev \
  --template-file main.bicep \
  --parameters main.dev.bicepparam
```

4. **View outputs**
```bash
az deployment group show \
  --resource-group rg-aurelian-dev \
  --name main \
  --query properties.outputs
```

### Cleanup
```bash
az group delete --name rg-aurelian-dev --yes --no-wait
```

---

## Project Structure

```
├── services/
│   └── edi-x12/              # EDI X12 837D Builder
│       ├── src/
│       │   ├── builder837D.ts   # Core builder
│       │   ├── cli.ts          # CLI tool
│       │   └── index.ts        # Exports
│       ├── test/
│       │   └── builder837D.test.ts  # Tests
│       ├── sample/
│       │   └── claim.json      # Sample data
│       ├── outbox/             # Generated files
│       └── package.json
│
└── infra/
    └── bicep/                # Azure Infrastructure
        ├── main.bicep            # Main template
        ├── main.dev.bicepparam   # DEV parameters
        └── modules/
            ├── storage.bicep     # Storage Account
            ├── keyvault.bicep    # Key Vault
            ├── sql.bicep         # Azure SQL
            ├── eventgrid.bicep   # Event Grid
            └── functions.bicep   # Function App
```

---

## Key Features

### EDI X12 837D Builder
- ✅ X12 005010X224A2 compliant
- ✅ Supports dental claims (837D)
- ✅ Handles tooth/surface codes
- ✅ Multiple service lines
- ✅ Complete segment generation
- ✅ CLI tool for generation
- ✅ 15 comprehensive tests

### Bicep Infrastructure
- ✅ Storage Account with encounters container
- ✅ Key Vault (RBAC mode)
- ✅ Azure SQL Database (emrdb)
- ✅ Event Grid Topic
- ✅ Function App (consumption, Node.js 20)
- ✅ All resources validated
- ✅ DEV-optimized configuration
- ✅ Cost: ~$7/month

---

## Documentation

- `services/edi-x12/README.md` - EDI X12 builder documentation
- `infra/bicep/README.md` - Bicep deployment guide
- `IMPLEMENTATION_SUMMARY.md` - Complete implementation details

---

## Support

For issues or questions, refer to:
1. README files in respective directories
2. IMPLEMENTATION_SUMMARY.md for detailed information
3. Code comments in source files
