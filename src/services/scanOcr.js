export async function createScanWorker(onProgress) {
  const { createWorker } = await import('tesseract.js');
  const base = new URL(`${import.meta.env.BASE_URL}ocr/`, window.location.origin).href;
  return createWorker('eng', 1, {
    workerPath: `${base}runtime/worker.min.js`,
    corePath: `${base}runtime`,
    langPath: `${base}lang`,
    gzip: false,
    logger: message => onProgress(message.status, message.progress),
  });
}
