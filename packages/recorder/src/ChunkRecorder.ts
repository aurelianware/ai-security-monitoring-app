/**
 * Recording chunk event data
 */
export interface ChunkEvent {
  chunk: Blob;
  timestamp: number;
  chunkIndex: number;
}

/**
 * Recorder configuration options
 */
export interface RecorderOptions {
  mimeType?: string;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  chunkDuration?: number; // milliseconds
  onChunk?: (event: ChunkEvent) => void;
  onError?: (error: Error) => void;
}

/**
 * Supported codec options for MediaRecorder
 */
export const CODEC_OPTIONS = [
  { mimeType: 'video/webm;codecs=vp9' },
  { mimeType: 'video/webm;codecs=vp8' },
  { mimeType: 'video/webm' },
  { mimeType: 'video/mp4' },
];

/**
 * Chunked recorder wrapper for MediaRecorder
 * Automatically handles 2-minute segments and codec detection
 */
export class ChunkRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private chunkIndex: number = 0;
  private options: RecorderOptions;
  private chunkTimer: number | null = null;
  private startTime: number = 0;

  constructor(options: RecorderOptions = {}) {
    this.options = {
      chunkDuration: 120000, // 2 minutes default
      ...options,
    };
  }

  /**
   * Detect best supported codec
   */
  private detectCodec(): string {
    // If mimeType specified, try to use it
    if (this.options.mimeType) {
      if (MediaRecorder.isTypeSupported(this.options.mimeType)) {
        return this.options.mimeType;
      }
      console.warn(`Specified codec ${this.options.mimeType} not supported, falling back...`);
    }

    // Try codec options in order
    for (const option of CODEC_OPTIONS) {
      if (MediaRecorder.isTypeSupported(option.mimeType)) {
        console.log(`Using codec: ${option.mimeType}`);
        return option.mimeType;
      }
    }

    // Fallback to default
    console.warn('No preferred codec supported, using default');
    return '';
  }

  /**
   * Start recording from a MediaStream
   */
  start(stream: MediaStream): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      throw new Error('Recording already in progress');
    }

    const mimeType = this.detectCodec();
    const recorderOptions: MediaRecorderOptions = {};

    if (mimeType) {
      recorderOptions.mimeType = mimeType;
    }
    if (this.options.videoBitsPerSecond) {
      recorderOptions.videoBitsPerSecond = this.options.videoBitsPerSecond;
    }
    if (this.options.audioBitsPerSecond) {
      recorderOptions.audioBitsPerSecond = this.options.audioBitsPerSecond;
    }

    try {
      this.mediaRecorder = new MediaRecorder(stream, recorderOptions);
      this.chunks = [];
      this.chunkIndex = 0;
      this.startTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
          console.log(`Recording chunk: ${event.data.size} bytes`);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        const error = new Error(`MediaRecorder error: ${event}`);
        console.error(error);
        if (this.options.onError) {
          this.options.onError(error);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleChunkComplete();
      };

      // Start recording with data collection interval
      this.mediaRecorder.start(250); // Collect data every 250ms

      // Set up chunk timer for 2-minute segments
      if (this.options.chunkDuration) {
        this.chunkTimer = window.setTimeout(() => {
          this.rotateChunk();
        }, this.options.chunkDuration);
      }

      console.log(`Recording started with ${mimeType || 'default codec'}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to start recording:', err);
      if (this.options.onError) {
        this.options.onError(err);
      }
      throw err;
    }
  }

  /**
   * Stop recording
   */
  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      if (this.mediaRecorder.state === 'inactive') {
        resolve(this.createBlob());
        return;
      }

      // Clear chunk timer
      if (this.chunkTimer) {
        clearTimeout(this.chunkTimer);
        this.chunkTimer = null;
      }

      const handleStop = () => {
        const blob = this.createBlob();
        resolve(blob);
      };

      this.mediaRecorder.addEventListener('stop', handleStop, { once: true });
      this.mediaRecorder.stop();
    });
  }

  /**
   * Pause recording
   */
  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resume recording
   */
  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Rotate to a new chunk (for 2-minute segments)
   */
  private rotateChunk(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      return;
    }

    // Stop and restart to create a new chunk
    this.mediaRecorder.stop();
    
    // The onstop handler will call handleChunkComplete
    // Then we need to restart recording
    setTimeout(() => {
      if (this.mediaRecorder) {
        const stream = this.mediaRecorder.stream;
        this.start(stream);
      }
    }, 100);
  }

  /**
   * Handle chunk completion and notify callback
   */
  private handleChunkComplete(): void {
    if (this.chunks.length === 0) return;

    const blob = this.createBlob();
    const chunkEvent: ChunkEvent = {
      chunk: blob,
      timestamp: this.startTime,
      chunkIndex: this.chunkIndex++,
    };

    if (this.options.onChunk) {
      this.options.onChunk(chunkEvent);
    }

    // Reset chunks for next segment
    this.chunks = [];
  }

  /**
   * Create blob from current chunks
   */
  private createBlob(): Blob {
    const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
    return new Blob(this.chunks, { type: mimeType });
  }

  /**
   * Get current recording state
   */
  getState(): RecordingState {
    return this.mediaRecorder?.state || 'inactive';
  }

  /**
   * Check if recording is active
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  /**
   * Get elapsed recording time in milliseconds
   */
  getElapsedTime(): number {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime;
  }
}
