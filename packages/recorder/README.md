# @aurelian/recorder

Chunked MediaRecorder wrapper for 2-minute video segments with automatic codec detection.

## Installation

```bash
npm install @aurelian/recorder
```

## Usage

```typescript
import { ChunkRecorder } from '@aurelian/recorder';

// Create recorder with options
const recorder = new ChunkRecorder({
  chunkDuration: 120000, // 2 minutes (default)
  onChunk: (event) => {
    console.log('Chunk complete:', event.chunk.size, 'bytes');
    console.log('Chunk index:', event.chunkIndex);
    // Save or upload chunk
  },
  onError: (error) => {
    console.error('Recording error:', error);
  }
});

// Get media stream (from camera, canvas, etc.)
const stream = await navigator.mediaDevices.getUserMedia({ video: true });

// Start recording
recorder.start(stream);

// Check recording state
console.log('Recording:', recorder.isRecording());
console.log('Elapsed:', recorder.getElapsedTime(), 'ms');

// Pause/resume
recorder.pause();
recorder.resume();

// Stop and get final blob
const blob = await recorder.stop();
console.log('Final recording:', blob.size, 'bytes');
```

## API

### `ChunkRecorder`

Main class for chunked video recording.

#### Constructor Options

```typescript
interface RecorderOptions {
  mimeType?: string;              // Preferred codec (auto-detected if not specified)
  videoBitsPerSecond?: number;    // Video bitrate
  audioBitsPerSecond?: number;    // Audio bitrate
  chunkDuration?: number;         // Chunk duration in ms (default: 120000 = 2 minutes)
  onChunk?: (event: ChunkEvent) => void;  // Called when chunk completes
  onError?: (error: Error) => void;       // Called on errors
}
```

#### Methods

- `start(stream)`: Start recording from MediaStream
- `stop()`: Stop recording and return final Blob
- `pause()`: Pause recording
- `resume()`: Resume recording
- `getState()`: Get current recording state ('inactive' | 'recording' | 'paused')
- `isRecording()`: Check if actively recording
- `getElapsedTime()`: Get elapsed recording time in milliseconds

### Codec Detection

The recorder automatically detects and uses the best supported codec in this order:
1. `video/webm;codecs=vp9`
2. `video/webm;codecs=vp8`
3. `video/webm`
4. `video/mp4`
5. Default (no mimeType specified)

You can also specify a preferred codec via the `mimeType` option.

### Chunk Events

```typescript
interface ChunkEvent {
  chunk: Blob;        // Video chunk blob
  timestamp: number;  // Recording start timestamp
  chunkIndex: number; // Chunk sequence number
}
```

## Use Cases

- **2-minute video segments**: Perfect for security monitoring systems
- **Continuous recording**: Automatically rotates to new chunks
- **Upload optimization**: Process chunks as they complete instead of waiting for full recording
- **Storage management**: Save chunks incrementally to prevent memory issues

## License

MIT
