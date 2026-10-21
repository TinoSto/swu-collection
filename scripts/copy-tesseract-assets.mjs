import fs from "node:fs";
import path from "node:path";

const targetDir = path.join(process.cwd(), "public", "tesseract");

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Kopiert Tesseract Worker, WASM und Sprachdaten lokal nach public/tesseract
const filesToCopy = [
  {
    src: nodeModulesPath("tesseract.js/dist/worker.min.js"),
    dest: "worker.min.js",
  },
  {
    src: nodeModulesPath("tesseract.js-core/tesseract-core.wasm.js"),
    dest: "tesseract-core.wasm.js",
  },
];

function nodeModulesPath(rel) {
  return path.join(process.cwd(), "node_modules", rel);
}

for (const file of filesToCopy) {
  if (fs.existsSync(file.src)) {
    fs.copyFileSync(file.src, path.join(targetDir, file.dest));
  }
}