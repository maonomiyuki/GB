const GB_PALETTE_HEX = ["#071821", "#306850", "#86c06c", "#e0f8cf"];
const GB_PALETTE = GB_PALETTE_HEX.map(hexToRgb);
const MAX_INPUT_EDGE = 4096;
const DEBOUNCE_MS = 150;

const state = {
  imageBitmap: null,
  sourceCanvas: document.createElement("canvas"),
  outputCanvas: document.createElement("canvas"),
  previewMode: "after",
  processing: false,
  pending: false,
};

const el = {
  dropZone: document.getElementById("dropZone"),
  fileInput: document.getElementById("fileInput"),
  previewCanvas: document.getElementById("previewCanvas"),
  showBeforeBtn: document.getElementById("showBeforeBtn"),
  showAfterBtn: document.getElementById("showAfterBtn"),
  statusText: document.getElementById("statusText"),
  cropPreset: document.getElementById("cropPreset"),
  zoom: document.getElementById("zoom"),
  panX: document.getElementById("panX"),
  panY: document.getElementById("panY"),
  zoomValue: document.getElementById("zoomValue"),
  panXValue: document.getElementById("panXValue"),
  panYValue: document.getElementById("panYValue"),
  sizePreset: document.getElementById("sizePreset"),
  customMode: document.getElementById("customMode"),
  customWidth: document.getElementById("customWidth"),
  customHeight: document.getElementById("customHeight"),
  brightness: document.getElementById("brightness"),
  contrast: document.getElementById("contrast"),
  gamma: document.getElementById("gamma"),
  blur: document.getElementById("blur"),
  brightnessValue: document.getElementById("brightnessValue"),
  contrastValue: document.getElementById("contrastValue"),
  gammaValue: document.getElementById("gammaValue"),
  blurValue: document.getElementById("blurValue"),
  ditherMode: document.getElementById("ditherMode"),
  ditherStrength: document.getElementById("ditherStrength"),
  ditherStrengthValue: document.getElementById("ditherStrengthValue"),
  scalePreset: document.getElementById("scalePreset"),
  downloadRawBtn: document.getElementById("downloadRawBtn"),
  downloadScaledBtn: document.getElementById("downloadScaledBtn"),
};

const previewCtx = el.previewCanvas.getContext("2d", { willReadFrequently: true });
previewCtx.imageSmoothingEnabled = false;

init();

function init() {
  bindUploadHandlers();
  bindControls();
  renderPlaceHolder();
}

function bindUploadHandlers() {
  el.dropZone.addEventListener("click", () => el.fileInput.click());
  el.dropZone.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") el.fileInput.click();
  });
  el.fileInput.addEventListener("change", (ev) => {
    const file = ev.target.files?.[0];
    if (file) loadFile(file);
  });

  ["dragenter", "dragover"].forEach((type) => {
    el.dropZone.addEventListener(type, (ev) => {
      ev.preventDefault();
      el.dropZone.classList.add("drag-over");
    });
  });
  ["dragleave", "drop"].forEach((type) => {
    el.dropZone.addEventListener(type, (ev) => {
      ev.preventDefault();
      el.dropZone.classList.remove("drag-over");
    });
  });
  el.dropZone.addEventListener("drop", (ev) => {
    const file = ev.dataTransfer?.files?.[0];
    if (file) loadFile(file);
  });
}

function bindControls() {
  const debouncedProcess = debounce(processImagePipeline, DEBOUNCE_MS);
  const instant = [el.showBeforeBtn, el.showAfterBtn, el.downloadRawBtn, el.downloadScaledBtn];

  instant.forEach((node) => node.addEventListener("click", onActionButton));

  [
    el.cropPreset, el.zoom, el.panX, el.panY, el.sizePreset, el.customMode, el.customWidth, el.customHeight,
    el.brightness, el.contrast, el.gamma, el.blur, el.ditherMode, el.ditherStrength,
  ].forEach((input) => input.addEventListener("input", () => {
    updateReadouts();
    if (state.imageBitmap) debouncedProcess();
  }));

  el.sizePreset.addEventListener("change", () => {
    const [w, h] = parsePresetSize(el.sizePreset.value);
    if (w && h) {
      el.customWidth.value = w;
      el.customHeight.value = h;
    }
  });

  updateReadouts();
}

function onActionButton(ev) {
  if (ev.currentTarget === el.showBeforeBtn) {
    state.previewMode = "before";
    el.showBeforeBtn.classList.add("active");
    el.showAfterBtn.classList.remove("active");
    drawPreview();
  } else if (ev.currentTarget === el.showAfterBtn) {
    state.previewMode = "after";
    el.showAfterBtn.classList.add("active");
    el.showBeforeBtn.classList.remove("active");
    drawPreview();
  } else if (ev.currentTarget === el.downloadRawBtn) {
    downloadRaw();
  } else if (ev.currentTarget === el.downloadScaledBtn) {
    downloadScaled();
  }
}

async function loadFile(file) {
  if (!file.type.startsWith("image/")) {
    setStatus("非対応形式です。画像ファイルを選択してください。", true);
    return;
  }

  try {
    setStatus("読み込み中...");
    let bitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      bitmap = await loadImageFallback(file);
    }

    const downscaled = downscaleIfNeeded(bitmap, MAX_INPUT_EDGE);
    state.imageBitmap = downscaled;
    processImagePipeline();
  } catch (error) {
    console.error(error);
    setStatus("読み込みに失敗しました。別の画像を試してください。", true);
  }
}

function downscaleIfNeeded(bitmap, maxEdge) {
  const longest = Math.max(bitmap.width, bitmap.height);
  if (longest <= maxEdge) return bitmap;

  const ratio = maxEdge / longest;
  const w = Math.max(1, Math.round(bitmap.width * ratio));
  const h = Math.max(1, Math.round(bitmap.height * ratio));

  setStatus("画像が大きすぎるため内部で縮小します。");
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return c;
}

function processImagePipeline() {
  if (!state.imageBitmap || state.processing) {
    state.pending = true;
    return;
  }

  state.processing = true;
  setStatus("変換中...");

  requestAnimationFrame(() => {
    try {
      const [outW, outH] = getOutputSize();
      const cropRect = getCropRect(state.imageBitmap.width, state.imageBitmap.height, outW / outH);

      const workCanvas = document.createElement("canvas");
      workCanvas.width = outW;
      workCanvas.height = outH;
      const wctx = workCanvas.getContext("2d", { willReadFrequently: true });
      wctx.imageSmoothingEnabled = true;

      wctx.filter = `blur(${Number(el.blur.value).toFixed(2)}px)`;
      wctx.drawImage(
        state.imageBitmap,
        cropRect.x,
        cropRect.y,
        cropRect.w,
        cropRect.h,
        0,
        0,
        outW,
        outH
      );
      wctx.filter = "none";

      const imageData = wctx.getImageData(0, 0, outW, outH);
      applyAdjustments(imageData, Number(el.brightness.value), Number(el.contrast.value), Number(el.gamma.value));
      applyDitherAndQuantize(imageData, el.ditherMode.value, Number(el.ditherStrength.value) / 100);
      enforcePaletteSafety(imageData);
      wctx.putImageData(imageData, 0, 0);

      state.outputCanvas.width = outW;
      state.outputCanvas.height = outH;
      const octx = state.outputCanvas.getContext("2d");
      octx.imageSmoothingEnabled = false;
      octx.drawImage(workCanvas, 0, 0);

      setStatus(`変換完了 ${outW}x${outH}`);
      drawPreview();
    } catch (error) {
      console.error(error);
      setStatus("処理に失敗しました。画像サイズを下げて再試行してください。", true);
    } finally {
      state.processing = false;
      if (state.pending) {
        state.pending = false;
        processImagePipeline();
      }
    }
  });
}

function applyAdjustments(imageData, brightness, contrast, gamma) {
  const data = imageData.data;
  const b = brightness * 2.55;
  const c = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const invGamma = 1 / Math.max(0.0001, gamma);

  for (let i = 0; i < data.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) {
      let v = data[i + ch];
      v = c * (v - 128) + 128 + b;
      v = 255 * Math.pow(clamp(v, 0, 255) / 255, invGamma);
      data[i + ch] = clamp(v, 0, 255);
    }
  }
}

function applyDitherAndQuantize(imageData, mode, strength) {
  if (mode === "off" || strength <= 0) {
    quantizeImageData(imageData);
    return;
  }

  if (mode === "bayer") {
    ditherBayer(imageData, strength);
    quantizeImageData(imageData);
    return;
  }

  if (mode === "floyd") {
    ditherFloydSteinberg(imageData, strength);
    return;
  }

  quantizeImageData(imageData);
}

function ditherBayer(imageData, strength) {
  const matrix = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];
  const { data, width, height } = imageData;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const threshold = ((matrix[y % 4][x % 4] / 15) - 0.5) * 64 * strength;
      for (let c = 0; c < 3; c++) {
        data[i + c] = clamp(data[i + c] + threshold, 0, 255);
      }
    }
  }
}

function ditherFloydSteinberg(imageData, strength) {
  const { data, width, height } = imageData;
  const errR = new Float32Array(width * height);
  const errG = new Float32Array(width * height);
  const errB = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const i = idx * 4;
      const r = clamp(data[i] + errR[idx], 0, 255);
      const g = clamp(data[i + 1] + errG[idx], 0, 255);
      const b = clamp(data[i + 2] + errB[idx], 0, 255);
      const q = nearestPaletteColor(r, g, b);

      data[i] = q[0];
      data[i + 1] = q[1];
      data[i + 2] = q[2];

      const eR = (r - q[0]) * strength;
      const eG = (g - q[1]) * strength;
      const eB = (b - q[2]) * strength;

      diffuseError(errR, errG, errB, width, height, x, y, eR, eG, eB);
    }
  }
}

function diffuseError(errR, errG, errB, width, height, x, y, eR, eG, eB) {
  const spread = [
    [1, 0, 7 / 16],
    [-1, 1, 3 / 16],
    [0, 1, 5 / 16],
    [1, 1, 1 / 16],
  ];

  spread.forEach(([dx, dy, weight]) => {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || nx >= width || ny < 0 || ny >= height) return;
    const ni = ny * width + nx;
    errR[ni] += eR * weight;
    errG[ni] += eG * weight;
    errB[ni] += eB * weight;
  });
}

function quantizeImageData(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const q = nearestPaletteColor(data[i], data[i + 1], data[i + 2]);
    data[i] = q[0];
    data[i + 1] = q[1];
    data[i + 2] = q[2];
  }
}

function enforcePaletteSafety(imageData) {
  const allowed = new Set(GB_PALETTE.map((c) => `${c[0]},${c[1]},${c[2]}`));
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
    if (!allowed.has(key)) {
      const q = nearestPaletteColor(data[i], data[i + 1], data[i + 2]);
      data[i] = q[0];
      data[i + 1] = q[1];
      data[i + 2] = q[2];
    }
  }
}

function nearestPaletteColor(r, g, b) {
  let minD = Infinity;
  let best = GB_PALETTE[0];
  for (const p of GB_PALETTE) {
    const d = (r - p[0]) ** 2 + (g - p[1]) ** 2 + (b - p[2]) ** 2;
    if (d < minD) {
      minD = d;
      best = p;
    }
  }
  return best;
}

function drawPreview() {
  const source = state.previewMode === "before" ? makeBeforePreviewCanvas() : state.outputCanvas;
  if (!source || source.width === 0 || source.height === 0) {
    renderPlaceHolder();
    return;
  }

  const maxW = el.previewCanvas.clientWidth || 320;
  const scale = Math.max(1, Math.floor(maxW / source.width));
  el.previewCanvas.width = source.width * scale;
  el.previewCanvas.height = source.height * scale;

  previewCtx.imageSmoothingEnabled = false;
  previewCtx.clearRect(0, 0, el.previewCanvas.width, el.previewCanvas.height);
  previewCtx.drawImage(source, 0, 0, el.previewCanvas.width, el.previewCanvas.height);
}

function makeBeforePreviewCanvas() {
  if (!state.imageBitmap) return null;
  const [w, h] = getOutputSize();
  const temp = document.createElement("canvas");
  temp.width = w;
  temp.height = h;
  const ctx = temp.getContext("2d");
  const crop = getCropRect(state.imageBitmap.width, state.imageBitmap.height, w / h);
  ctx.drawImage(state.imageBitmap, crop.x, crop.y, crop.w, crop.h, 0, 0, w, h);
  return temp;
}

function downloadRaw() {
  if (!state.outputCanvas.width) return setStatus("先に画像を変換してください", true);
  const name = `gb4_${state.outputCanvas.width}x${state.outputCanvas.height}.png`;
  state.outputCanvas.toBlob((blob) => downloadBlob(blob, name), "image/png");
}

function downloadScaled() {
  if (!state.outputCanvas.width) return setStatus("先に画像を変換してください", true);
  const scale = Number(el.scalePreset.value);
  const c = document.createElement("canvas");
  c.width = state.outputCanvas.width * scale;
  c.height = state.outputCanvas.height * scale;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(state.outputCanvas, 0, 0, c.width, c.height);

  const name = `gb4_${state.outputCanvas.width}x${state.outputCanvas.height}_x${scale}.png`;
  c.toBlob((blob) => downloadBlob(blob, name), "image/png");
}

function downloadBlob(blob, name) {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function getOutputSize() {
  if (el.sizePreset.value !== "custom") return parsePresetSize(el.sizePreset.value);

  const mode = el.customMode.value;
  let w = clamp(Number(el.customWidth.value) || 160, 16, 1024);
  let h = clamp(Number(el.customHeight.value) || 144, 16, 1024);

  const ratio = getCropAspectRatio() || (state.imageBitmap ? state.imageBitmap.width / state.imageBitmap.height : 160 / 144);
  if (mode === "width") {
    h = Math.max(16, Math.round(w / ratio));
    el.customHeight.value = h;
  } else {
    w = Math.max(16, Math.round(h * ratio));
    el.customWidth.value = w;
  }

  return [w, h];
}

function parsePresetSize(value) {
  const m = value.match(/(\d+)x(\d+)/);
  if (!m) return [null, null];
  return [Number(m[1]), Number(m[2])];
}

function getCropAspectRatio() {
  const v = el.cropPreset.value;
  if (v === "free") return null;
  const [a, b] = v.split(":").map(Number);
  return a / b;
}

function getCropRect(srcW, srcH, fallbackAspect) {
  const zoom = Number(el.zoom.value);
  const panX = Number(el.panX.value) / 100;
  const panY = Number(el.panY.value) / 100;

  const aspect = getCropAspectRatio() || fallbackAspect || srcW / srcH;
  let cropW = srcW;
  let cropH = cropW / aspect;
  if (cropH > srcH) {
    cropH = srcH;
    cropW = cropH * aspect;
  }

  cropW /= zoom;
  cropH /= zoom;

  const centerX = srcW / 2 + panX * ((srcW - cropW) / 2);
  const centerY = srcH / 2 + panY * ((srcH - cropH) / 2);
  const x = clamp(centerX - cropW / 2, 0, srcW - cropW);
  const y = clamp(centerY - cropH / 2, 0, srcH - cropH);

  return { x, y, w: cropW, h: cropH };
}

function updateReadouts() {
  el.zoomValue.textContent = Number(el.zoom.value).toFixed(2);
  el.panXValue.textContent = el.panX.value;
  el.panYValue.textContent = el.panY.value;
  el.brightnessValue.textContent = el.brightness.value;
  el.contrastValue.textContent = el.contrast.value;
  el.gammaValue.textContent = Number(el.gamma.value).toFixed(2);
  el.blurValue.textContent = Number(el.blur.value).toFixed(2);
  el.ditherStrengthValue.textContent = el.ditherStrength.value;
}

function renderPlaceHolder() {
  el.previewCanvas.width = 320;
  el.previewCanvas.height = 288;
  previewCtx.fillStyle = "#071821";
  previewCtx.fillRect(0, 0, el.previewCanvas.width, el.previewCanvas.height);
  previewCtx.fillStyle = "#e0f8cf";
  previewCtx.font = "16px sans-serif";
  previewCtx.fillText("画像をアップロードしてください", 42, 150);
}

function setStatus(message, isError = false) {
  el.statusText.textContent = message;
  el.statusText.style.color = isError ? "#ffcccb" : "#86c06c";
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ];
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function loadImageFallback(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext("2d").drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(c);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
