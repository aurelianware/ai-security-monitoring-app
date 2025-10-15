# Ingest Functions - Azure Durable Functions

Azure Durable Functions service for ingesting video chunks and processing through Speech-to-Text (STT) and Large Language Model (LLM) pipeline to Electronic Medical Records (EMR).

## Architecture

```
Event Grid (BlobCreated)
  ↓
eventGridStarter (Trigger)
  ↓
ingestOrchestrator (Orchestrator)
  ↓
  ├─→ speechTranscribe (Activity) - Azure Speech Service
  ├─→ noteDraft (Activity) - Azure OpenAI
  └─→ persistEncounter (Activity) - EMR Database
```

## Functions

### Event Grid Trigger: `eventGridStarter`
- Listens for BlobCreated events from Azure Blob Storage
- Extracts encounter ID from blob name
- Starts orchestration for each video chunk

### Orchestrator: `ingestOrchestrator`
- Coordinates per-encounter pipeline
- Chains activities in sequence
- Handles error scenarios

### Activities

#### `speechTranscribe`
- **Purpose**: Convert audio/video to text with speaker diarization
- **Service**: Azure Cognitive Services Speech
- **Features**: 
  - Real-time transcription
  - Speaker identification
  - PII/PHI redaction (HIPAA compliance)
  - Timestamp extraction

#### `noteDraft`
- **Purpose**: Generate clinical notes with CDT code suggestions
- **Service**: Azure OpenAI (GPT-4)
- **Features**:
  - SOAP note format
  - CDT (Current Dental Terminology) code extraction
  - Treatment recommendations
  - Structured output

#### `persistEncounter`
- **Purpose**: Write encounter data to EMR database
- **Service**: Azure SQL Database / Cosmos DB
- **Features**:
  - Transactional writes
  - Audit trail
  - HIPAA-compliant storage

## Local Development

### Prerequisites
- Node.js 20+
- Azure Functions Core Tools v4
- Azure Storage Emulator (Azurite)

### Setup

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start local function runtime
npm start
```

### Configuration

Edit `local.settings.json`:

```json
{
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "OPENAI_ENDPOINT": "https://your-openai.openai.azure.com/",
    "OPENAI_API_KEY": "your-key-here",
    "SPEECH_REGION": "eastus",
    "SPEECH_KEY": "your-key-here",
    "EMR_CONNECTION_STRING": "your-connection-string"
  }
}
```

**Note**: In production, all secrets should be stored in Azure Key Vault.

## Deployment

### Deploy to Azure

```bash
# Build production bundle
npm run build

# Deploy using Azure Functions Core Tools
func azure functionapp publish your-function-app-name
```

### Event Grid Subscription

Create Event Grid subscription for Blob Storage:

```bash
az eventgrid event-subscription create \
  --name video-ingest-subscription \
  --source-resource-id /subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.Storage/storageAccounts/{storage} \
  --endpoint https://your-function-app.azurewebsites.net/runtime/webhooks/eventgrid \
  --endpoint-type webhook \
  --included-event-types Microsoft.Storage.BlobCreated \
  --subject-begins-with /blobServices/default/containers/video-chunks/
```

## Next Steps

- [ ] Implement Azure Speech Service integration in `speechTranscribe`
- [ ] Implement Azure OpenAI integration in `noteDraft`
- [ ] Add EMR database client in `persistEncounter`
- [ ] Configure Event Grid subscription
- [ ] Set up Key Vault for secrets
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Configure Application Insights monitoring
- [ ] Set up CI/CD pipeline

## Testing

Currently stubbed with mock data. Run locally:

```bash
# Start function app
npm start

# Trigger with mock Event Grid event (use Azure Storage Explorer or CLI)
```

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `local.settings.json` with real credentials
- Use Azure Key Vault for production secrets
- Enable managed identity for Function App
- Ensure HIPAA compliance for PHI data handling
- Implement proper access controls and audit logging

## License

MIT
