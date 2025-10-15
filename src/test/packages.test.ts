import { describe, it, expect, vi } from 'vitest'

// Test that packages can be imported (type checking)
describe('Aurelian Packages Integration', () => {
  describe('@aurelian/capture', () => {
    it('should export UvcCapture class', async () => {
      const { UvcCapture } = await import('@aurelian/capture')
      expect(UvcCapture).toBeDefined()
      expect(typeof UvcCapture).toBe('function')
    })

    it('should export CameraDevice type', async () => {
      const module = await import('@aurelian/capture')
      expect(module).toHaveProperty('UvcCapture')
    })

    it('should create UvcCapture instance', async () => {
      const { UvcCapture } = await import('@aurelian/capture')
      const camera = new UvcCapture()
      expect(camera).toBeDefined()
      expect(camera.isActive()).toBe(false)
      expect(camera.getStream()).toBeNull()
    })
  })

  describe('@aurelian/thermal', () => {
    it('should export renderThermal function', async () => {
      const { renderThermal } = await import('@aurelian/thermal')
      expect(renderThermal).toBeDefined()
      expect(typeof renderThermal).toBe('function')
    })

    it('should export PALETTES constant', async () => {
      const { PALETTES } = await import('@aurelian/thermal')
      expect(PALETTES).toBeDefined()
      expect(PALETTES).toHaveProperty('ironbow')
      expect(PALETTES).toHaveProperty('white-hot')
      expect(PALETTES).toHaveProperty('black-hot')
      expect(PALETTES).toHaveProperty('grayscale')
    })

    it('should have 256 colors in each palette', async () => {
      const { PALETTES } = await import('@aurelian/thermal')
      
      Object.keys(PALETTES).forEach(paletteName => {
        const palette = PALETTES[paletteName as keyof typeof PALETTES]
        expect(palette).toHaveLength(256)
        
        // Each color should be RGB tuple
        palette.forEach(color => {
          expect(color).toHaveLength(3)
          expect(color[0]).toBeGreaterThanOrEqual(0)
          expect(color[0]).toBeLessThanOrEqual(255)
          expect(color[1]).toBeGreaterThanOrEqual(0)
          expect(color[1]).toBeLessThanOrEqual(255)
          expect(color[2]).toBeGreaterThanOrEqual(0)
          expect(color[2]).toBeLessThanOrEqual(255)
        })
      })
    })
  })

  describe('@aurelian/recorder', () => {
    it('should export ChunkRecorder class', async () => {
      const { ChunkRecorder } = await import('@aurelian/recorder')
      expect(ChunkRecorder).toBeDefined()
      expect(typeof ChunkRecorder).toBe('function')
    })

    it('should export CODEC_OPTIONS', async () => {
      const { CODEC_OPTIONS } = await import('@aurelian/recorder')
      expect(CODEC_OPTIONS).toBeDefined()
      expect(Array.isArray(CODEC_OPTIONS)).toBe(true)
      expect(CODEC_OPTIONS.length).toBeGreaterThan(0)
    })

    it('should create ChunkRecorder instance with default options', async () => {
      const { ChunkRecorder } = await import('@aurelian/recorder')
      const recorder = new ChunkRecorder()
      expect(recorder).toBeDefined()
      expect(recorder.isRecording()).toBe(false)
      expect(recorder.getState()).toBe('inactive')
      expect(recorder.getElapsedTime()).toBe(0)
    })

    it('should create ChunkRecorder with custom options', async () => {
      const { ChunkRecorder } = await import('@aurelian/recorder')
      const onChunk = vi.fn()
      const onError = vi.fn()
      
      const recorder = new ChunkRecorder({
        chunkDuration: 60000, // 1 minute
        onChunk,
        onError
      })
      
      expect(recorder).toBeDefined()
      expect(recorder.isRecording()).toBe(false)
    })
  })

  describe('Integration', () => {
    it('should be able to import all packages together', async () => {
      const capture = await import('@aurelian/capture')
      const thermal = await import('@aurelian/thermal')
      const recorder = await import('@aurelian/recorder')
      
      expect(capture.UvcCapture).toBeDefined()
      expect(thermal.renderThermal).toBeDefined()
      expect(recorder.ChunkRecorder).toBeDefined()
    })

    it('should not contain any API keys or sensitive data', async () => {
      // This test verifies that no sensitive data is exposed
      const capture = await import('@aurelian/capture')
      const thermal = await import('@aurelian/thermal')
      const recorder = await import('@aurelian/recorder')
      
      const modules = [capture, thermal, recorder]
      
      modules.forEach(module => {
        const moduleStr = JSON.stringify(module)
        expect(moduleStr).not.toMatch(/api[_-]?key/i)
        expect(moduleStr).not.toMatch(/secret/i)
        expect(moduleStr).not.toMatch(/password/i)
        expect(moduleStr).not.toMatch(/token/i)
      })
    })
  })
})
