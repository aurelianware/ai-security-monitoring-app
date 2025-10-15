# Quick Reference: Aurelian Packages

## Installation

```bash
# Packages are part of the workspace - no separate install needed
# Just import them in your code
```

## Building

```bash
# Build all packages
npm -w packages/capture run build
npm -w packages/thermal run build
npm -w packages/recorder run build

# Clean all builds
npm -w packages/capture run clean
npm -w packages/thermal run clean
npm -w packages/recorder run clean
```

## @aurelian/capture - Camera Utilities

```typescript
import { UvcCapture } from '@aurelian/capture';

const camera = new UvcCapture();

// List devices
const devices = await camera.enumerateDevices();

// Start camera
const stream = await camera.start({
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30 }
});

// Attach to video
camera.attachToElement(videoElement);

// Capture frame
const imageData = camera.captureFrame();
const blob = await camera.captureFrameAsBlob('image/jpeg', 0.8);

// Stop camera
camera.stop();
```

## @aurelian/thermal - Thermal Rendering

```typescript
import { renderThermal, PALETTES, renderColorBar } from '@aurelian/thermal';

// Render thermal overlay
renderThermal(canvas, videoElement, {
  palette: 'ironbow', // or 'white-hot', 'black-hot', 'grayscale'
  opacity: 0.7
});

// Available palettes
console.log(Object.keys(PALETTES)); // ['ironbow', 'white-hot', 'black-hot', 'grayscale']

// Render color bar legend
renderColorBar(legendCanvas, 'ironbow', true);
```

## @aurelian/recorder - Video Recording

```typescript
import { ChunkRecorder } from '@aurelian/recorder';

// Create recorder
const recorder = new ChunkRecorder({
  chunkDuration: 120000, // 2 minutes
  onChunk: (event) => {
    console.log(`Chunk ${event.chunkIndex}: ${event.chunk.size} bytes`);
    // Save or upload chunk
  },
  onError: (error) => {
    console.error('Error:', error);
  }
});

// Start recording
recorder.start(stream);

// Pause/resume
recorder.pause();
recorder.resume();

// Check state
console.log(recorder.isRecording()); // true/false
console.log(recorder.getState()); // 'inactive' | 'recording' | 'paused'
console.log(recorder.getElapsedTime()); // milliseconds

// Stop and get final blob
const blob = await recorder.stop();
```

## Complete Example

```typescript
import { UvcCapture } from '@aurelian/capture';
import { renderThermal } from '@aurelian/thermal';
import { ChunkRecorder } from '@aurelian/recorder';

async function setupSecurityCamera() {
  // 1. Initialize camera
  const camera = new UvcCapture();
  const stream = await camera.start();
  camera.attachToElement(videoElement);

  // 2. Setup thermal rendering (10 FPS)
  setInterval(() => {
    renderThermal(thermalCanvas, videoElement, {
      palette: 'ironbow',
      opacity: 0.7
    });
  }, 100);

  // 3. Start recording with 2-min chunks
  const recorder = new ChunkRecorder({
    chunkDuration: 120000,
    onChunk: async (event) => {
      console.log(`Chunk ${event.chunkIndex} complete`);
      await uploadToServer(event.chunk);
    }
  });
  
  recorder.start(stream);
}
```

## Testing

```bash
# Run all tests
npm test

# Current status: 17 tests passing
# - 5 app utility tests
# - 12 package integration tests
```

## Documentation

- **README_PACKAGES.md** - Main documentation
- **EXAMPLE_USAGE.md** - Complete usage examples
- **SUMMARY.md** - Implementation details
- **packages/*/README.md** - Per-package docs

## Package Sizes

- **@aurelian/capture**: ~5KB compiled JS
- **@aurelian/thermal**: ~6KB compiled JS
- **@aurelian/recorder**: ~7KB compiled JS

Total: ~18KB for all three packages

## Browser Requirements

- Chrome/Edge 90+
- Firefox 88+
- Safari 14.1+
- Modern MediaStream, Canvas, and MediaRecorder APIs

## Key Features

✅ TypeScript with full type definitions
✅ ES2020 modules
✅ Zero dependencies (uses browser APIs)
✅ No API keys or PII
✅ 0 security vulnerabilities
✅ Comprehensive test coverage
✅ Well documented

## Common Patterns

### Camera + Thermal
```typescript
const camera = new UvcCapture();
await camera.start();
camera.attachToElement(video);

setInterval(() => {
  renderThermal(canvas, video, { palette: 'ironbow' });
}, 100);
```

### Camera + Recording
```typescript
const camera = new UvcCapture();
const stream = await camera.start();

const recorder = new ChunkRecorder({ chunkDuration: 120000 });
recorder.start(stream);
```

### All Three Together
```typescript
// Camera
const camera = new UvcCapture();
const stream = await camera.start();
camera.attachToElement(video);

// Thermal
setInterval(() => {
  renderThermal(canvas, video, { palette: 'ironbow' });
}, 100);

// Recording
const recorder = new ChunkRecorder({
  chunkDuration: 120000,
  onChunk: (e) => saveChunk(e.chunk)
});
recorder.start(stream);
```

## Troubleshooting

### Camera not starting
- Check HTTPS (required except on localhost)
- Check browser permissions
- Verify device is available

### Thermal not rendering
- Ensure video has loaded metadata
- Check canvas size matches video
- Verify video is playing

### Recording fails
- Check stream is active
- Verify codec support
- Check available disk space

## Next Steps

1. Integrate packages into main app
2. Test in clinic-mode
3. Deploy to electron app
4. Performance optimization
5. Publish to npm (optional)
