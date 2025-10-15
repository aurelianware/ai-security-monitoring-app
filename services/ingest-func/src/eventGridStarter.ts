import { app, InvocationContext, EventGridEvent } from "@azure/functions";
import * as df from "durable-functions";

/**
 * Event Grid trigger for BlobCreated events.
 * Starts a new orchestration for each video chunk uploaded.
 */
export async function eventGridStarter(
  event: EventGridEvent,
  context: InvocationContext
): Promise<void> {
  const client = df.getClient(context);

  // Extract blob information from Event Grid event
  const blobUrl = String(event.data?.url || "");
  const blobName = blobUrl.split('/').pop() || "unknown";
  
  context.log(`BlobCreated event received for blob: ${blobName}`);
  context.log(`Event ID: ${event.id}`);
  context.log(`Event time: ${event.eventTime}`);

  // Extract encounter ID from blob name (e.g., "encounter-123-chunk-001.mp4")
  const encounterIdMatch = blobName?.match(/encounter-([^-]+)/);
  const encounterId = encounterIdMatch ? encounterIdMatch[1] : 'unknown';

  // Start orchestration
  const instanceId = await client.startNew("ingestOrchestrator", {
    input: {
      blobUrl,
      blobName,
      encounterId,
      eventId: event.id,
      eventTime: event.eventTime
    }
  });

  context.log(`Started orchestration with ID: ${instanceId}`);
  context.log(`Processing encounter: ${encounterId}`);
}

app.eventGrid("eventGridStarter", {
  handler: eventGridStarter
});
