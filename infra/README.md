# Infrastructure Configuration

This directory contains infrastructure-related configuration files for the PrivaseeAI production deployment.

## Azure Blob Storage Lifecycle Management

### blob-lifecycle.json

This policy automatically manages blob storage lifecycle:

1. **Automatic Deletion (30 days)**: Deletes blobs older than 30 days in:
   - `events/` - Detection event data
   - `media/` - Images and thumbnails
   - `recordings/` - Video recordings

2. **Cool Tier Migration (7 days)**: Moves blobs to Cool storage tier after 7 days to reduce costs

### Apply the Policy

To apply this lifecycle policy to your Azure Storage account:

```bash
# Set your variables
RESOURCE_GROUP="your-resource-group"
STORAGE_ACCOUNT="your-storage-account"

# Apply the lifecycle policy
az storage account management-policy create \
  --account-name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --policy @infra/blob-lifecycle.json
```

### Verify the Policy

```bash
# View the applied policy
az storage account management-policy show \
  --account-name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP
```

## Cost Optimization

This lifecycle policy helps optimize storage costs by:
- Moving old data to Cool storage tier (lower cost)
- Automatically cleaning up data older than retention period
- Reducing storage footprint and associated costs

## Customization

Adjust the `daysAfterModificationGreaterThan` values in the JSON file to match your retention requirements:
- Increase for longer retention
- Decrease for more aggressive cleanup
