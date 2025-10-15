# @aurelian/thermal

Thermal image rendering with color palettes (ironbow, white-hot, black-hot, grayscale).

## Installation

```bash
npm install @aurelian/thermal
```

## Usage

```typescript
import { renderThermal, PALETTES } from '@aurelian/thermal';

// Get canvas and video elements
const canvas = document.querySelector('canvas');
const video = document.querySelector('video');

// Render with ironbow palette (default)
renderThermal(canvas, video, {
  palette: 'ironbow',
  opacity: 1.0
});

// Available palettes
console.log(Object.keys(PALETTES)); // ['ironbow', 'white-hot', 'black-hot', 'grayscale']

// Render color bar legend
import { renderColorBar } from '@aurelian/thermal';
const legendCanvas = document.querySelector('#legend');
renderColorBar(legendCanvas, 'ironbow', true); // vertical bar
```

## API

### `renderThermal(canvas, sourceImage, options?)`

Render thermal overlay on canvas.

**Parameters:**
- `canvas`: Target canvas element
- `sourceImage`: Source image, video, or canvas element
- `options`: Optional rendering options
  - `palette`: 'ironbow' | 'white-hot' | 'black-hot' | 'grayscale' (default: 'ironbow')
  - `opacity`: 0-1 (default: 1.0)

### `applyThermalPalette(imageData, palette)`

Apply thermal palette to ImageData.

**Parameters:**
- `imageData`: Source ImageData
- `palette`: Thermal palette to apply

**Returns:** Modified ImageData with thermal colors

### `renderColorBar(canvas, palette?, vertical?)`

Create a thermal color bar legend.

**Parameters:**
- `canvas`: Canvas to render legend on
- `palette`: Palette to use (default: 'ironbow')
- `vertical`: If true, render vertical bar (default: true)

## Palettes

- **ironbow**: Traditional thermal imaging colors (blue → purple → red → orange → yellow → white)
- **white-hot**: Higher temperatures are whiter (black to white gradient)
- **black-hot**: Higher temperatures are blacker (white to black gradient)
- **grayscale**: Simple gray gradient

## License

MIT
