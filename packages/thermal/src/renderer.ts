import { PALETTES, ThermalPalette, RGBColor } from './palettes';

/**
 * Render options for thermal imaging
 */
export interface ThermalRenderOptions {
  palette?: ThermalPalette;
  minTemp?: number;
  maxTemp?: number;
  opacity?: number;
}

/**
 * Apply thermal palette to image data
 * @param imageData Source image data (grayscale values will be used)
 * @param palette Thermal palette to apply
 * @returns Modified image data with thermal colors
 */
export function applyThermalPalette(
  imageData: ImageData,
  palette: ThermalPalette = 'ironbow'
): ImageData {
  const paletteColors = PALETTES[palette];
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Convert RGB to grayscale (luminance)
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    
    // Map grayscale value to palette color
    const [r, g, b] = paletteColors[gray];
    
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    // Keep original alpha
  }

  return imageData;
}

/**
 * Render thermal overlay on canvas
 * @param canvas Target canvas element
 * @param sourceImage Source image or video element
 * @param options Rendering options
 */
export function renderThermal(
  canvas: HTMLCanvasElement,
  sourceImage: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  options: ThermalRenderOptions = {}
): void {
  const {
    palette = 'ironbow',
    opacity = 1.0,
  } = options;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Set canvas size to match source
  if (sourceImage instanceof HTMLVideoElement) {
    canvas.width = sourceImage.videoWidth;
    canvas.height = sourceImage.videoHeight;
  } else {
    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;
  }

  // Draw source image
  ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Apply thermal palette
  const thermalData = applyThermalPalette(imageData, palette);

  // Set opacity
  if (opacity < 1.0) {
    const data = thermalData.data;
    for (let i = 3; i < data.length; i += 4) {
      data[i] = Math.round(data[i] * opacity);
    }
  }

  // Put back to canvas
  ctx.putImageData(thermalData, 0, 0);
}

/**
 * Create a thermal color bar legend
 * @param canvas Canvas to render legend on
 * @param palette Palette to use
 * @param vertical If true, render vertical bar, otherwise horizontal
 */
export function renderColorBar(
  canvas: HTMLCanvasElement,
  palette: ThermalPalette = 'ironbow',
  vertical: boolean = true
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const paletteColors = PALETTES[palette];
  const width = canvas.width;
  const height = canvas.height;

  if (vertical) {
    // Render vertical color bar
    const barHeight = height / 256;
    for (let i = 0; i < 256; i++) {
      const [r, g, b] = paletteColors[255 - i]; // Reverse for top-to-bottom hot-to-cold
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(0, i * barHeight, width, barHeight);
    }
  } else {
    // Render horizontal color bar
    const barWidth = width / 256;
    for (let i = 0; i < 256; i++) {
      const [r, g, b] = paletteColors[i];
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(i * barWidth, 0, barWidth, height);
    }
  }
}
