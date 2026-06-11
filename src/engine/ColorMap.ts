export interface ColorStop {
  position: number;
  r: number;
  g: number;
  b: number;
}

export const HEAT_MAP_STOPS: ColorStop[] = [
  { position: 0.0, r: 30, g: 58, b: 138 },
  { position: 0.25, r: 8, g: 145, b: 178 },
  { position: 0.5, r: 234, g: 179, b: 8 },
  { position: 0.75, r: 249, g: 115, b: 22 },
  { position: 1.0, r: 239, g: 68, b: 68 },
];

export const HEAT_MAP_STOPS_RAINBOW: ColorStop[] = [
  { position: 0.0, r: 75, g: 0, b: 130 },
  { position: 0.2, r: 0, g: 0, b: 255 },
  { position: 0.4, r: 0, g: 255, b: 0 },
  { position: 0.6, r: 255, g: 255, b: 0 },
  { position: 0.8, r: 255, g: 127, b: 0 },
  { position: 1.0, r: 255, g: 0, b: 0 },
];

export function interpolateColor(
  value: number,
  minValue: number,
  maxValue: number,
  stops: ColorStop[] = HEAT_MAP_STOPS
): { r: number; g: number; b: number } {
  const normalized = Math.max(0, Math.min(1, (value - minValue) / (maxValue - minValue)));

  let lowerStop = stops[0];
  let upperStop = stops[stops.length - 1];

  for (let i = 0; i < stops.length - 1; i++) {
    if (normalized >= stops[i].position && normalized <= stops[i + 1].position) {
      lowerStop = stops[i];
      upperStop = stops[i + 1];
      break;
    }
  }

  const range = upperStop.position - lowerStop.position;
  const t = range === 0 ? 0 : (normalized - lowerStop.position) / range;

  return {
    r: Math.round(lowerStop.r + (upperStop.r - lowerStop.r) * t),
    g: Math.round(lowerStop.g + (upperStop.g - lowerStop.g) * t),
    b: Math.round(lowerStop.b + (upperStop.b - lowerStop.b) * t),
  };
}

export function temperatureToColor(
  temperature: number,
  minTemp: number = 0,
  maxTemp: number = 100,
  stops: ColorStop[] = HEAT_MAP_STOPS
): string {
  const { r, g, b } = interpolateColor(temperature, minTemp, maxTemp, stops);
  return `rgb(${r}, ${g}, ${b})`;
}

export function temperatureToRgba(
  temperature: number,
  minTemp: number = 0,
  maxTemp: number = 100,
  alpha: number = 1,
  stops: ColorStop[] = HEAT_MAP_STOPS
): string {
  const { r, g, b } = interpolateColor(temperature, minTemp, maxTemp, stops);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getColorBarCanvas(
  width: number,
  height: number,
  minTemp: number = 0,
  maxTemp: number = 100,
  stops: ColorStop[] = HEAT_MAP_STOPS
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  for (let x = 0; x < width; x++) {
    const t = x / width;
    const temp = minTemp + t * (maxTemp - minTemp);
    ctx.fillStyle = temperatureToColor(temp, minTemp, maxTemp, stops);
    ctx.fillRect(x, 0, 1, height);
  }

  return canvas;
}

export function drawColorBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  minTemp: number = 0,
  maxTemp: number = 100,
  horizontal: boolean = true,
  stops: ColorStop[] = HEAT_MAP_STOPS
): void {
  if (horizontal) {
    for (let i = 0; i < width; i++) {
      const t = i / width;
      const temp = minTemp + t * (maxTemp - minTemp);
      ctx.fillStyle = temperatureToColor(temp, minTemp, maxTemp, stops);
      ctx.fillRect(x + i, y, 1, height);
    }
  } else {
    for (let i = 0; i < height; i++) {
      const t = 1 - i / height;
      const temp = minTemp + t * (maxTemp - minTemp);
      ctx.fillStyle = temperatureToColor(temp, minTemp, maxTemp, stops);
      ctx.fillRect(x, y + i, width, 1);
    }
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
}
