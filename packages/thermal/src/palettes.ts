/**
 * Available thermal color palettes
 */
export type ThermalPalette = 'ironbow' | 'white-hot' | 'black-hot' | 'grayscale';

/**
 * RGB color tuple
 */
export type RGBColor = [number, number, number];

/**
 * Thermal palette color map (256 colors)
 */
export const PALETTES: Record<ThermalPalette, RGBColor[]> = {
  // Ironbow palette - traditional thermal imaging colors
  ironbow: generateIronbowPalette(),
  
  // White-hot - higher temperatures are whiter
  'white-hot': generateWhiteHotPalette(),
  
  // Black-hot - higher temperatures are blacker (inverted)
  'black-hot': generateBlackHotPalette(),
  
  // Grayscale - simple gray gradient
  grayscale: generateGrayscalePalette(),
};

/**
 * Generate ironbow palette (blue -> purple -> red -> orange -> yellow -> white)
 */
function generateIronbowPalette(): RGBColor[] {
  const palette: RGBColor[] = [];
  
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let r: number, g: number, b: number;
    
    if (t < 0.2) {
      // Blue to purple
      const local = t / 0.2;
      r = Math.round(local * 128);
      g = 0;
      b = 255;
    } else if (t < 0.4) {
      // Purple to red
      const local = (t - 0.2) / 0.2;
      r = Math.round(128 + local * 127);
      g = 0;
      b = Math.round(255 * (1 - local));
    } else if (t < 0.6) {
      // Red to orange
      const local = (t - 0.4) / 0.2;
      r = 255;
      g = Math.round(local * 165);
      b = 0;
    } else if (t < 0.8) {
      // Orange to yellow
      const local = (t - 0.6) / 0.2;
      r = 255;
      g = Math.round(165 + local * 90);
      b = 0;
    } else {
      // Yellow to white
      const local = (t - 0.8) / 0.2;
      r = 255;
      g = 255;
      b = Math.round(local * 255);
    }
    
    palette.push([r, g, b]);
  }
  
  return palette;
}

/**
 * Generate white-hot palette (black to white)
 */
function generateWhiteHotPalette(): RGBColor[] {
  const palette: RGBColor[] = [];
  
  for (let i = 0; i < 256; i++) {
    const value = i;
    palette.push([value, value, value]);
  }
  
  return palette;
}

/**
 * Generate black-hot palette (white to black)
 */
function generateBlackHotPalette(): RGBColor[] {
  const palette: RGBColor[] = [];
  
  for (let i = 0; i < 256; i++) {
    const value = 255 - i;
    palette.push([value, value, value]);
  }
  
  return palette;
}

/**
 * Generate grayscale palette
 */
function generateGrayscalePalette(): RGBColor[] {
  return generateWhiteHotPalette();
}
