# Example Usage of Aurelian Packages

This example demonstrates how to use all three packages together to create a security camera with thermal overlay and recording capabilities.

## Complete Example

```typescript
import { UvcCapture } from '@aurelian/capture';
import { renderThermal } from '@aurelian/thermal';
import { ChunkRecorder } from '@aurelian/recorder';

// HTML elements
const videoElement = document.querySelector('#camera-video') as HTMLVideoElement;
const thermalCanvas = document.querySelector('#thermal-canvas') as HTMLCanvasElement;
const startButton = document.querySelector('#start-btn') as HTMLButtonElement;
const stopButton = document.querySelector('#stop-btn') as HTMLButtonElement;
const recordButton = document.querySelector('#record-btn') as HTMLButtonElement;

let camera: UvcCapture;
let recorder: ChunkRecorder;
let thermalRenderInterval: number;

// Initialize camera
async function initializeCamera() {
  camera = new UvcCapture();
  
  // List available cameras
  const devices = await camera.enumerateDevices();
  console.log('Available cameras:', devices);
  
  // Start camera with optimal settings
  const stream = await camera.start({
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: { ideal: 'environment' },
    frameRate: { ideal: 30 }
  });
  
  // Attach to video element
  camera.attachToElement(videoElement);
  
  // Start thermal rendering
  startThermalRendering();
  
  console.log('Camera initialized');
  console.log('Settings:', camera.getSettings());
  console.log('Capabilities:', camera.getCapabilities());
}

// Start thermal overlay rendering
function startThermalRendering() {
  // Render thermal overlay at ~10 FPS
  thermalRenderInterval = window.setInterval(() => {
    if (camera.isActive() && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
      renderThermal(thermalCanvas, videoElement, {
        palette: 'ironbow', // or 'white-hot', 'black-hot', 'grayscale'
        opacity: 0.7
      });
    }
  }, 100);
  
  console.log('Thermal rendering started');
}

// Initialize recorder
function initializeRecorder() {
  recorder = new ChunkRecorder({
    chunkDuration: 120000, // 2 minutes
    videoBitsPerSecond: 2500000, // 2.5 Mbps
    onChunk: (event) => {
      console.log(`Chunk ${event.chunkIndex} complete:`, {
        size: `${(event.chunk.size / 1024 / 1024).toFixed(2)} MB`,
        timestamp: new Date(event.timestamp).toISOString()
      });
      
      // Save chunk to IndexedDB or upload to server
      saveChunk(event.chunk, event.chunkIndex);
    },
    onError: (error) => {
      console.error('Recording error:', error);
      alert(`Recording error: ${error.message}`);
    }
  });
  
  console.log('Recorder initialized');
}

// Start recording
function startRecording() {
  if (!camera.isActive()) {
    alert('Please start the camera first');
    return;
  }
  
  const stream = camera.getStream();
  if (!stream) {
    alert('No camera stream available');
    return;
  }
  
  initializeRecorder();
  recorder.start(stream);
  
  recordButton.textContent = 'Stop Recording';
  recordButton.classList.add('recording');
  
  console.log('Recording started');
}

// Stop recording
async function stopRecording() {
  if (!recorder || !recorder.isRecording()) {
    return;
  }
  
  try {
    const finalBlob = await recorder.stop();
    console.log('Recording stopped, final blob:', {
      size: `${(finalBlob.size / 1024 / 1024).toFixed(2)} MB`,
      type: finalBlob.type
    });
    
    // Save or download final recording
    downloadBlob(finalBlob, `recording-${Date.now()}.webm`);
    
    recordButton.textContent = 'Start Recording';
    recordButton.classList.remove('recording');
  } catch (error) {
    console.error('Failed to stop recording:', error);
  }
}

// Save chunk to IndexedDB
async function saveChunk(blob: Blob, index: number) {
  // Implementation using IndexedDB
  const db = await openDB();
  const tx = db.transaction('chunks', 'readwrite');
  await tx.objectStore('chunks').put({
    index,
    blob,
    timestamp: Date.now()
  });
  console.log(`Chunk ${index} saved to IndexedDB`);
}

// Download blob as file
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Event listeners
startButton.addEventListener('click', async () => {
  try {
    await initializeCamera();
    startButton.disabled = true;
    stopButton.disabled = false;
    recordButton.disabled = false;
  } catch (error) {
    console.error('Failed to start camera:', error);
    alert(`Camera error: ${error.message}`);
  }
});

stopButton.addEventListener('click', () => {
  if (recorder?.isRecording()) {
    stopRecording();
  }
  
  if (thermalRenderInterval) {
    clearInterval(thermalRenderInterval);
  }
  
  if (camera) {
    camera.stop();
  }
  
  startButton.disabled = false;
  stopButton.disabled = true;
  recordButton.disabled = true;
  
  console.log('Camera stopped');
});

recordButton.addEventListener('click', () => {
  if (recorder?.isRecording()) {
    stopRecording();
  } else {
    startRecording();
  }
});
```

## HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aurelian Camera Example</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .video-container {
      position: relative;
      width: 100%;
      max-width: 1280px;
      margin: 20px 0;
    }
    
    #camera-video {
      width: 100%;
      display: block;
    }
    
    #thermal-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    
    .controls {
      display: flex;
      gap: 10px;
      margin: 20px 0;
    }
    
    button {
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      border: none;
      border-radius: 4px;
      background: #007bff;
      color: white;
    }
    
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    button.recording {
      background: #dc3545;
      animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  </style>
</head>
<body>
  <h1>Aurelian Security Camera</h1>
  
  <div class="video-container">
    <video id="camera-video" autoplay playsinline muted></video>
    <canvas id="thermal-canvas"></canvas>
  </div>
  
  <div class="controls">
    <button id="start-btn">Start Camera</button>
    <button id="stop-btn" disabled>Stop Camera</button>
    <button id="record-btn" disabled>Start Recording</button>
  </div>
  
  <script type="module" src="./example.ts"></script>
</body>
</html>
```

## Key Features

1. **Camera Capture** (@aurelian/capture)
   - Device enumeration
   - Optimized camera settings
   - Frame capture capabilities
   
2. **Thermal Overlay** (@aurelian/thermal)
   - Real-time thermal rendering
   - Multiple palette options
   - Adjustable opacity
   
3. **Video Recording** (@aurelian/recorder)
   - Automatic 2-minute chunks
   - Codec detection
   - Chunk callbacks for incremental saving

## Running the Example

1. Build the packages:
```bash
npm -w packages/capture run build
npm -w packages/thermal run build
npm -w packages/recorder run build
```

2. Serve with a local dev server (HTTPS required for camera access):
```bash
npm run dev:https
```

3. Open in browser and click "Start Camera"

## Notes

- HTTPS is required for camera access (except localhost)
- Thermal rendering is currently canvas-based (can be upgraded to WebGL)
- Recording uses best available codec automatically
- Chunks are emitted every 2 minutes for efficient storage
