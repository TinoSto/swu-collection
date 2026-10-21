import { createWorker, Worker } from "tesseract.js";

let workerPromise: Promise<Worker> | null = null;

async function initWorker(): Promise<Worker> {
  const worker = await createWorker("eng", 1, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract/tesseract-core.wasm.js",
    logger: () => {},
  });
  
  await worker.setParameters({
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/- ",
  });

  return worker;
}

export async function recognizeCanvas(canvas: HTMLCanvasElement): Promise<string> {
  if (!workerPromise) {
    workerPromise = initWorker();
  }

  const worker = await workerPromise;
  const { data } = await worker.recognize(canvas);
  return data.text;
}