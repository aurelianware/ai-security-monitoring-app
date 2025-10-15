import * as df from "durable-functions";
import { OrchestrationContext, OrchestrationHandler } from "durable-functions";

interface OrchestratorInput {
  blobUrl: string;
  blobName: string;
  encounterId: string;
  eventId: string;
  eventTime: string;
}

/**
 * Durable orchestrator for per-encounter pipeline.
 * Coordinates the flow: STT → LLM → EMR
 */
const ingestOrchestrator: OrchestrationHandler = function* (
  context: OrchestrationContext
) {
  const input = context.df.getInput() as OrchestratorInput;
  
  context.log(`Starting orchestration for encounter: ${input.encounterId}`);
  context.log(`Blob: ${input.blobName}`);

  try {
    // Activity 1: Speech-to-Text transcription with diarization
    context.log("Step 1: Starting speech transcription...");
    const transcriptResult = yield context.df.callActivity("speechTranscribe", {
      blobUrl: input.blobUrl,
      encounterId: input.encounterId
    });
    context.log(`Transcript received: ${transcriptResult.wordCount} words`);

    // Activity 2: LLM clinical note draft with CDT code suggestions
    context.log("Step 2: Drafting clinical note with LLM...");
    const noteResult = yield context.df.callActivity("noteDraft", {
      transcript: transcriptResult.transcript,
      speakers: transcriptResult.speakers,
      encounterId: input.encounterId
    });
    context.log(`Note drafted with ${noteResult.cdtCodes?.length || 0} CDT codes`);

    // Activity 3: Persist encounter data to EMR database
    context.log("Step 3: Persisting encounter to EMR...");
    const persistResult = yield context.df.callActivity("persistEncounter", {
      encounterId: input.encounterId,
      transcript: transcriptResult.transcript,
      note: noteResult.note,
      cdtCodes: noteResult.cdtCodes,
      metadata: {
        blobUrl: input.blobUrl,
        eventId: input.eventId,
        eventTime: input.eventTime
      }
    });
    context.log(`Encounter persisted with ID: ${persistResult.recordId}`);

    return {
      success: true,
      encounterId: input.encounterId,
      recordId: persistResult.recordId,
      message: "Encounter processing completed successfully"
    };

  } catch (error: any) {
    context.log(`Error in orchestration: ${error}`);
    return {
      success: false,
      encounterId: input.encounterId,
      error: error?.message || "Unknown error occurred"
    };
  }
};

df.app.orchestration("ingestOrchestrator", ingestOrchestrator);

export default ingestOrchestrator;
