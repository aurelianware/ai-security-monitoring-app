# @aurelian/capture

UVC camera utilities for getUserMedia, device enumeration, and frame access.

## Installation

```bash
npm install @aurelian/capture
```

## Usage

```typescript
import { UvcCapture } from '@aurelian/capture';

// Create camera instance
const camera = new UvcCapture();

// Enumerate available cameras
const devices = await camera.enumerateDevices();
console.log('Available cameras:', devices);

// Start camera with constraints
const stream = await camera.start({
  width: { ideal: 1280 },
  height: { ideal: 720 },
  facingMode: { ideal: 'environment' },
  frameRate: { ideal: 30 }
});

// Attach to video element
const videoElement = document.querySelector('video');
camera.attachToElement(videoElement);

// Capture frames
const imageData = camera.captureFrame();
const blob = await camera.captureFrameAsBlob('image/jpeg', 0.8);

// Get camera settings
const settings = camera.getSettings();
const capabilities = camera.getCapabilities();

// Stop camera
camera.stop();
```

## API

### `UvcCapture`

Main class for camera capture operations.

#### Methods

- `enumerateDevices()`: Get list of available video input devices
- `start(constraints?)`: Start camera with optional constraints
- `stop()`: Stop the camera stream
- `attachToElement(videoElement)`: Attach stream to video element
- `captureFrame(canvas?)`: Capture current frame as ImageData
- `captureFrameAsBlob(type?, quality?)`: Capture frame as Blob
- `isActive()`: Check if camera is active
- `getSettings()`: Get current track settings
- `getCapabilities()`: Get track capabilities
- `getStream()`: Get the current MediaStream

## License

MIT
