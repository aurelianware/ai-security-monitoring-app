/**
 * Azure Durable Functions: Video Ingest Pipeline
 * 
 * Architecture:
 * 1. Event Grid trigger (eventGridStarter) receives BlobCreated event
 * 2. Orchestrator (ingestOrchestrator) coordinates the pipeline
 * 3. Activities execute in sequence:
 *    - speechTranscribe: Azure Speech Service (STT + diarization)
 *    - noteDraft: Azure OpenAI (clinical note + CDT codes)
 *    - persistEncounter: EMR database write
 */

// Import all functions to ensure they're registered
import "./eventGridStarter";
import "./ingestOrchestrator";
import "./activities/speechTranscribe";
import "./activities/noteDraft";
import "./activities/persistEncounter";

export * from "./eventGridStarter";
export * from "./ingestOrchestrator";
export * from "./activities/speechTranscribe";
export * from "./activities/noteDraft";
export * from "./activities/persistEncounter";
