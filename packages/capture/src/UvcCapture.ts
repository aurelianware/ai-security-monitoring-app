/**
 * Camera device information
 */
export interface CameraDevice {
  deviceId: string;
  label: string;
  groupId: string;
  kind: 'videoinput';
}

/**
 * Camera constraints for getUserMedia
 */
export interface CameraConstraints {
  width?: { ideal?: number; max?: number; min?: number };
  height?: { ideal?: number; max?: number; min?: number };
  facingMode?: { ideal?: 'user' | 'environment' };
  frameRate?: { ideal?: number; max?: number; min?: number };
  deviceId?: string;
}

/**
 * UVC Camera capture utility class
 */
export class UvcCapture {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  /**
   * Get list of available video input devices
   */
  async enumerateDevices(): Promise<CameraDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((device) => device.kind === 'videoinput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.substring(0, 8)}`,
          groupId: device.groupId,
          kind: 'videoinput' as const,
        }));
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      return [];
    }
  }

  /**
   * Start camera capture with specified constraints
   */
  async start(constraints: CameraConstraints = {}): Promise<MediaStream> {
    try {
      // Default constraints optimized for security monitoring
      const defaultConstraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: { ideal: 'environment' },
          frameRate: { ideal: 30, max: 60 },
          ...constraints,
        },
        audio: false,
      };

      this.stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
      return this.stream;
    } catch (error) {
      console.error('Failed to start camera:', error);
      throw new Error(`Camera access denied: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop the current camera stream
   */
  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  /**
   * Get the current active stream
   */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Attach stream to a video element
   */
  attachToElement(videoElement: HTMLVideoElement): void {
    if (!this.stream) {
      throw new Error('No active stream. Call start() first.');
    }
    this.videoElement = videoElement;
    videoElement.srcObject = this.stream;
  }

  /**
   * Capture a frame from the video stream as ImageData
   */
  captureFrame(canvas?: HTMLCanvasElement): ImageData | null {
    if (!this.videoElement) {
      console.error('No video element attached');
      return null;
    }

    const targetCanvas = canvas || document.createElement('canvas');
    targetCanvas.width = this.videoElement.videoWidth;
    targetCanvas.height = this.videoElement.videoHeight;

    const ctx = targetCanvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return null;
    }

    ctx.drawImage(this.videoElement, 0, 0, targetCanvas.width, targetCanvas.height);
    return ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
  }

  /**
   * Capture a frame as a blob
   */
  async captureFrameAsBlob(type: string = 'image/jpeg', quality: number = 0.8): Promise<Blob | null> {
    if (!this.videoElement) {
      console.error('No video element attached');
      return null;
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = this.videoElement!.videoWidth;
      canvas.height = this.videoElement!.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(this.videoElement!, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob), type, quality);
    });
  }

  /**
   * Check if camera is currently active
   */
  isActive(): boolean {
    return this.stream !== null && this.stream.active;
  }

  /**
   * Get video track settings
   */
  getSettings(): MediaTrackSettings | null {
    if (!this.stream) return null;
    const videoTrack = this.stream.getVideoTracks()[0];
    return videoTrack ? videoTrack.getSettings() : null;
  }

  /**
   * Get video track capabilities
   */
  getCapabilities(): MediaTrackCapabilities | null {
    if (!this.stream) return null;
    const videoTrack = this.stream.getVideoTracks()[0];
    return videoTrack && 'getCapabilities' in videoTrack 
      ? (videoTrack.getCapabilities as () => MediaTrackCapabilities)() 
      : null;
  }
}
