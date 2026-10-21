import { createWorker, PSM, type Worker } from "tesseract.js";

let workerPromise: Promise<Worker> | null = null;

async function initWorker(): Promise<Worker> {
  const worker = await createWorker("eng", 1, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract",
    langPath: "/tesseract/lang",
    logger: () => {},
  });

  await worker.setParameters({
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/- ",
    tessedit_pageseg_mode: PSM.SPARSE_TEXT,
  });

  return worker;
}

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = initWorker().catch((err) => {
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

/** Lädt den Worker vorab, damit der erste Scan nicht warten muss. */
export function warmUpOcr(): void {
  void getWorker().catch(() => {});
}

export async function recognizeCanvas(canvas: HTMLCanvasElement): Promise<string> {
  const worker = await getWorker();
  const { data } = await worker.recognize(canvas);
  return data.text;
}