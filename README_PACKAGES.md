# Aurelian Packages

This repository contains shared packages for camera capture, thermal rendering, and video recording functionality. These packages are designed to be reusable across web, clinic-mode, and electron applications.

## Packages

### [@aurelian/capture](./packages/capture)

UVC camera utilities for getUserMedia, device enumeration, and frame access.

**Features:**
- Device enumeration
- Camera start/stop
- Frame capture (ImageData & Blob)
- Stream management
- Settings & capabilities inspection

**Install:**
```bash
npm install @aurelian/capture
```

**Quick Start:**
```typescript
import { UvcCapture } from '@aurelian/capture';

const camera = new UvcCapture();
const stream = await camera.start();
camera.attachToElement(videoElement);
const frame = camera.captureFrame();
```

### [@aurelian/thermal](./packages/thermal)

Thermal image rendering with color palettes.

**Features:**
- Multiple palettes (ironbow, white-hot, black-hot, grayscale)
- Canvas-based rendering
- Color bar legends
- Opacity control

**Install:**
```bash
npm install @aurelian/thermal
```

**Quick Start:**
```typescript
import { renderThermal } from '@aurelian/thermal';

renderThermal(canvas, videoElement, {
  palette: 'ironbow',
  opacity: 1.0
});
```

### [@aurelian/recorder](./packages/recorder)

Chunked MediaRecorder wrapper for 2-minute video segments.

**Features:**
- Automatic 2-minute chunks
- Codec detection & fallback
- Pause/resume support
- Chunk callbacks
- Error handling

**Install:**
```bash
npm install @aurelian/recorder
```

**Quick Start:**
```typescript
import { ChunkRecorder } from '@aurelian/recorder';

const recorder = new ChunkRecorder({
  chunkDuration: 120000, // 2 minutes
  onChunk: (event) => {
    // Handle chunk complete
    console.log('Chunk:', event.chunk.size);
  }
});

recorder.start(stream);
```

## Development

### Workspace Setup

This is a monorepo using npm workspaces. All packages are located in the `packages/` directory.

### Building Packages

Build all packages:
```bash
npm -w packages/capture run build
npm -w packages/thermal run build
npm -w packages/recorder run build
```

Build individual package:
```bash
npm -w packages/capture run build
```

Clean builds:
```bash
npm -w packages/capture run clean
npm -w packages/thermal run clean
npm -w packages/recorder run clean
```

### Project Structure

```
packages/
├── capture/           # Camera capture utilities
│   ├── src/
│   │   ├── UvcCapture.ts
│   │   └── index.ts
│   ├── dist/          # Built files
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── thermal/           # Thermal rendering
│   ├── src/
│   │   ├── palettes.ts
│   │   ├── renderer.ts
│   │   └── index.ts
│   ├── dist/          # Built files
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
└── recorder/          # Video recording
    ├── src/
    │   ├── ChunkRecorder.ts
    │   └── index.ts
    ├── dist/          # Built files
    ├── package.json
    ├── tsconfig.json
    └── README.md
```

## Usage in Applications

### Using Local Packages

If you're developing within this monorepo, packages are automatically linked via npm workspaces. Just import them normally:

```typescript
import { UvcCapture } from '@aurelian/capture';
import { renderThermal } from '@aurelian/thermal';
import { ChunkRecorder } from '@aurelian/recorder';
```

### Publishing

To publish packages to npm (when ready):

```bash
cd packages/capture
npm publish --access public

cd ../thermal
npm publish --access public

cd ../recorder
npm publish --access public
```

## Example: Complete Security Camera

```typescript
import { UvcCapture } from '@aurelian/capture';
import { renderThermal } from '@aurelian/thermal';
import { ChunkRecorder } from '@aurelian/recorder';

// Set up camera
const camera = new UvcCapture();
const devices = await camera.enumerateDevices();
const stream = await camera.start({
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30 }
});

// Attach to video element
const video = document.querySelector('video');
camera.attachToElement(video);

// Set up thermal rendering
const thermalCanvas = document.querySelector('#thermal');
setInterval(() => {
  renderThermal(thermalCanvas, video, {
    palette: 'ironbow',
    opacity: 0.8
  });
}, 100); // Update at ~10 FPS

// Set up recording with 2-minute chunks
const recorder = new ChunkRecorder({
  chunkDuration: 120000,
  onChunk: async (event) => {
    console.log(`Chunk ${event.chunkIndex}: ${event.chunk.size} bytes`);
    // Upload to server or save locally
    await uploadChunk(event.chunk, event.chunkIndex);
  }
});

recorder.start(stream);
```

## Technology Stack

- **TypeScript**: Strongly typed, compiled to ES2020
- **Canvas API**: For rendering operations
- **MediaStream API**: For camera capture
- **MediaRecorder API**: For video recording

## Browser Compatibility

These packages require modern browser features:
- MediaDevices API (getUserMedia)
- Canvas API (2D context)
- MediaRecorder API
- ES2020 features

Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14.1+

## Future Enhancements

- **WebGL rendering**: Upgrade thermal renderer to use WebGL for better performance
- **WebAssembly**: Add WASM modules for advanced image processing
- **WebCodecs API**: Use modern WebCodecs API when available
- **Worker support**: Run intensive operations in Web Workers
- **Stream transformations**: Add TransformStream support for real-time processing

## Security Considerations

- No API keys or credentials are included in these packages
- All data processing happens client-side
- No PII (Personally Identifiable Information) is collected
- Camera permissions are requested through standard browser APIs

## License

MIT

## Contributing

Contributions are welcome! Please ensure:
- TypeScript builds without errors
- No API keys or sensitive data in code
- Documentation is updated
- Code follows existing patterns
