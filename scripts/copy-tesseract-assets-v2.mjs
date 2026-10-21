import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targetDir = path.join(root, "public", "tesseract");
const langDir = path.join(targetDir, "lang");
fs.mkdirSync(langDir, { recursive: true });

const files = [
  ["tesseract.js/dist/worker.min.js", targetDir],
  ["tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js", targetDir],
  ["tesseract.js-core/tesseract-core-simd-lstm.wasm.js", targetDir],
  ["tesseract.js-core/tesseract-core-lstm.wasm.js", targetDir],
  ["@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", langDir],
];

for (const [rel, dir] of files) {
  const src = path.join(root, "node_modules", rel);
  if (!fs.existsSync(src)) {
    console.error(`Fehlt: ${src}`);
    process.exitCode = 1;
    continue;
  }
  fs.copyFileSync(src, path.join(dir, path.basename(rel)));
}