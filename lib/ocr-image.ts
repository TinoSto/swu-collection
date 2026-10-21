export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrPass {
  label: string;
  canvas: HTMLCanvasElement;
}

export interface LoadedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
}

const TARGET_WIDTH = 1400;
const MAX_UPSCALE = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function containerRectToVideoRect(
  container: { width: number; height: number },
  video: { width: number; height: number },
  rect: Rect
): Rect {
  const scale = Math.max(container.width / video.width, container.height / video.height);
  const offsetX = (video.width * scale - container.width) / 2;
  const offsetY = (video.height * scale - container.height) / 2;
  const x = clamp((rect.x + offsetX) / scale, 0, video.width - 1);
  const y = clamp((rect.y + offsetY) / scale, 0, video.height - 1);
  const width = clamp(rect.width / scale, 1, video.width - x);
  const height = clamp(rect.height / scale, 1, video.height - y);
  return { x, y, width, height };
}

function renderPass(source: CanvasImageSource, region: Rect, invert: boolean): HTMLCanvasElement {
  const scale = Math.min(TARGET_WIDTH / region.width, MAX_UPSCALE);
  const width = Math.max(1, Math.round(region.width * scale));
  const height = Math.max(1, Math.round(region.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas wird nicht unterstützt.");

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, region.x, region.y, region.width, region.height, 0, 0, width, height);

  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const histogram = new Uint32Array(256);

  for (let i = 0; i < data.length; i += 4) {
    const luma = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = luma;
    histogram[luma]++;
  }

  const total = width * height;
  let low = 0;
  let accumulated = 0;
  for (; low < 255; low++) {
    accumulated += histogram[low];
    if (accumulated >= total * 0.02) break;
  }
  let high = 255;
  accumulated = 0;
  for (; high > 0; high--) {
    accumulated += histogram[high];
    if (accumulated >= total * 0.02) break;
  }
  const range = Math.max(high - low, 1);

  for (let i = 0; i < data.length; i += 4) {
    let value = clamp(((data[i] - low) * 255) / range, 0, 255);
    if (invert) value = 255 - value;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}

export function buildCameraPasses(video: HTMLVideoElement, region: Rect): OcrPass[] {
  return [
    { label: "Rahmen", canvas: renderPass(video, region, false) },
    { label: "Rahmen, invertiert", canvas: renderPass(video, region, true) },
  ];
}

export function buildUploadPasses(source: CanvasImageSource, width: number, height: number): OcrPass[] {
  const strip: Rect = { x: 0, y: height * 0.72, width, height: height * 0.28 };
  const half: Rect = { x: 0, y: height * 0.5, width, height: height * 0.5 };
  return [
    { label: "unterer Streifen", canvas: renderPass(source, strip, false) },
    { label: "unterer Streifen, invertiert", canvas: renderPass(source, strip, true) },
    { label: "untere Hälfte", canvas: renderPass(source, half, false) },
    { label: "untere Hälfte, invertiert", canvas: renderPass(source, half, true) },
  ];
}

export async function loadImageSource(file: Blob): Promise<LoadedImage> {
  if (typeof createImageBitmap === "function") {
    try {      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => bitmap.close(),
      };
    } catch {
      // Fallback
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      dispose: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}