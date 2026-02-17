import { normalizeToTileGrid, analyzeTiles, buildTilesetPng, buildReportJson } from "./tileAnalyzer.js";

const GB_PALETTE_HEX = ["#071821", "#306850", "#86c06c", "#e0f8cf"];
const GB_PALETTE = GB_PALETTE_HEX.map(hexToRgb);
const MAX_INPUT_EDGE = 4096;
const DEBOUNCE_MS = 150;

const I18N = {
  ja: {
    pageTitle: "GB Dot Converter",
    language: "言語",
    headerSubtitle: "写真/イラストをGB Studio互換の緑4色へ変換 + 最終PNG検証",
    tabNavAriaLabel: "機能タブ",
    tabConvert: "変換",
    tabValidate: "最終PNG検証",
    uploadImageAria: "画像をアップロード",
    dropImageStrong: "画像をドラッグ&ドロップ",
    dropFinalStrong: "最終書き出しPNGをドラッグ&ドロップ",
    orTapSelect: "またはタップして選択",
    showBefore: "変換前",
    showAfter: "変換後",
    settings: "設定",
    cropResize: "トリミング/リサイズ",
    cropAspect: "トリミング比率",
    free: "自由",
    frame160x144: "160x144枠",
    zoom: "ズーム",
    panX: "パンX",
    panY: "パンY",
    sizePreset: "出力サイズプリセット",
    custom: "任意",
    customMode: "任意指定モード",
    fixedWidth: "幅固定（縦横比維持）",
    fixedHeight: "高さ固定（縦横比維持）",
    customWidth: "任意 幅",
    customHeight: "任意 高さ",
    photoCorrection: "写真向け事前補正",
    brightness: "明るさ",
    contrast: "コントラスト",
    gamma: "ガンマ",
    blur: "ぼかし(px)",
    quantizeDither: "減色 / ディザ",
    dither: "ディザ",
    ditherStrength: "ディザ強度",
    pngOutput: "PNG出力",
    snsScale: "SNS拡大倍率",
    downloadRaw: "GB Studio用PNG保存",
    downloadScaled: "SNS向け拡大PNG保存",
    validateTitle: "最終PNG検証",
    uploadFinalPngAria: "最終PNGをアップロード",
    validatePurpose: "用途: GB Studio向け事前検証（色数・タイル数）",
    tileLimit: "タイル上限",
    multipleHandling: "8の倍数処理",
    pad: "Pad",
    crop: "Crop",
    transparencyHandling: "透明ピクセル処理",
    replaceWithBackground: "背景色で置換",
    treatAsColor0: "color0として扱う",
    resultSummary: "結果サマリー",
    notAnalyzed: "未解析",
    downloadTileset: "タイルセットPNG保存",
    downloadReport: "レポートJSON保存",
    previewOverlay: "プレビュー / オーバーレイ",
    uniqueTileList: "ユニークタイル一覧",
    statusUnsupported: "非対応形式です。画像ファイルを選択してください。",
    statusLoading: "読み込み中...",
    statusLoadFailed: "読み込みに失敗しました。別の画像を試してください。",
    statusDownscaled: "画像が大きすぎるため内部で縮小します。",
    statusProcessing: "変換中...",
    statusDone: "変換完了",
    statusProcessFailed: "処理に失敗しました。画像サイズを下げて再試行してください。",
    statusNeedConvert: "先に画像を変換してください",
    placeholder: "画像をアップロードしてください",
    analyzeFailed: "解析失敗",
    summaryStatus: "Status",
    summarySource: "Source",
    summaryAnalyzed: "Analyzed",
    summaryTotalTiles: "Total tiles",
    summaryColorsUsed: "Colors used",
    summaryUniqueTiles: "Unique tiles",
    summaryRareUniqueTiles: "Rare unique tiles",
    paletteNg: "Palette NG",
    tilesOver: "Tiles OVER",
    freq: "freq",
  },
  en: {
    pageTitle: "GB Dot Converter",
    language: "Language",
    headerSubtitle: "Convert photos/illustrations into GB Studio-compatible 4 green colors + final PNG validation",
    tabNavAriaLabel: "Feature tabs",
    tabConvert: "Convert",
    tabValidate: "Final PNG Validation",
    uploadImageAria: "Upload image",
    dropImageStrong: "Drag & drop an image",
    dropFinalStrong: "Drag & drop final exported PNG",
    orTapSelect: "or tap to choose",
    showBefore: "Before",
    showAfter: "After",
    settings: "Settings",
    cropResize: "Crop / Resize",
    cropAspect: "Crop aspect",
    free: "Free",
    frame160x144: "160x144 frame",
    zoom: "Zoom",
    panX: "Pan X",
    panY: "Pan Y",
    sizePreset: "Output size preset",
    custom: "Custom",
    customMode: "Custom mode",
    fixedWidth: "Fix width (keep aspect)",
    fixedHeight: "Fix height (keep aspect)",
    customWidth: "Custom width",
    customHeight: "Custom height",
    photoCorrection: "Photo pre-correction",
    brightness: "Brightness",
    contrast: "Contrast",
    gamma: "Gamma",
    blur: "Blur (px)",
    quantizeDither: "Quantize / Dither",
    dither: "Dither",
    ditherStrength: "Dither strength",
    pngOutput: "PNG Output",
    snsScale: "SNS upscale",
    downloadRaw: "Save PNG for GB Studio",
    downloadScaled: "Save Upscaled PNG for SNS",
    validateTitle: "Final PNG Validation",
    uploadFinalPngAria: "Upload final PNG",
    validatePurpose: "Usage: Pre-check for GB Studio (colors/tile count)",
    tileLimit: "Tile limit",
    multipleHandling: "Multiple-of-8 handling",
    pad: "Pad",
    crop: "Crop",
    transparencyHandling: "Transparent pixel handling",
    replaceWithBackground: "Replace with background",
    treatAsColor0: "Treat as color0",
    resultSummary: "Result Summary",
    notAnalyzed: "Not analyzed",
    downloadTileset: "Download Tileset PNG",
    downloadReport: "Download Report JSON",
    previewOverlay: "Preview / Overlay",
    uniqueTileList: "Unique Tile List",
    statusUnsupported: "Unsupported format. Please choose an image file.",
    statusLoading: "Loading...",
    statusLoadFailed: "Failed to load image. Please try another file.",
    statusDownscaled: "Image is too large and has been downscaled internally.",
    statusProcessing: "Processing...",
    statusDone: "Conversion complete",
    statusProcessFailed: "Processing failed. Please reduce image size and retry.",
    statusNeedConvert: "Please convert an image first.",
    placeholder: "Please upload an image",
    analyzeFailed: "Analysis failed",
    summaryStatus: "Status",
    summarySource: "Source",
    summaryAnalyzed: "Analyzed",
    summaryTotalTiles: "Total tiles",
    summaryColorsUsed: "Colors used",
    summaryUniqueTiles: "Unique tiles",
    summaryRareUniqueTiles: "Rare unique tiles",
    paletteNg: "Palette NG",
    tilesOver: "Tiles OVER",
    freq: "freq",
  },
};

const state = {
  imageBitmap: null,
  sourceCanvas: document.createElement("canvas"),
  outputCanvas: document.createElement("canvas"),
  previewMode: "after",
  processing: false,
  pending: false,
  language: localStorage.getItem("gbdc_lang") || "ja",
  lastStatusKey: "",
  validator: {
    file: null,
    normalized: null,
    analysis: null,
    selectedTileKey: null,
  },
};

const el = {
  tabConvertBtn: document.getElementById("tabConvertBtn"),
  tabValidateBtn: document.getElementById("tabValidateBtn"),
  languageSelect: document.getElementById("languageSelect"),
  convertTab: document.getElementById("convertTab"),
  validateTab: document.getElementById("validateTab"),
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
  validateDropZone: document.getElementById("validateDropZone"),
  validateFileInput: document.getElementById("validateFileInput"),
  tileLimit: document.getElementById("tileLimit"),
  multipleHandling: document.getElementById("multipleHandling"),
  transparencyHandling: document.getElementById("transparencyHandling"),
  validateSummary: document.getElementById("validateSummary"),
  validatePreviewCanvas: document.getElementById("validatePreviewCanvas"),
  validateOverlayCanvas: document.getElementById("validateOverlayCanvas"),
  tileList: document.getElementById("tileList"),
  downloadTilesetBtn: document.getElementById("downloadTilesetBtn"),
  downloadReportBtn: document.getElementById("downloadReportBtn"),
};

const previewCtx = el.previewCanvas.getContext("2d", { willReadFrequently: true });
previewCtx.imageSmoothingEnabled = false;
const validatePreviewCtx = el.validatePreviewCanvas.getContext("2d", { willReadFrequently: true });
const validateOverlayCtx = el.validateOverlayCanvas.getContext("2d", { willReadFrequently: true });
validatePreviewCtx.imageSmoothingEnabled = false;
validateOverlayCtx.imageSmoothingEnabled = false;

init();

function init() {
  bindTabs();
  bindUploadHandlers();
  bindControls();
  bindValidatorUI();
  bindI18n();
  setLanguage(state.language);
  renderPlaceHolder();
}

function t(key) {
  return I18N[state.language]?.[key] ?? I18N.ja[key] ?? key;
}

function bindI18n() {
  el.languageSelect.value = state.language;
  el.languageSelect.addEventListener("change", (ev) => setLanguage(ev.target.value));
}

function setLanguage(lang) {
  state.language = lang === "en" ? "en" : "ja";
  localStorage.setItem("gbdc_lang", state.language);
  document.documentElement.lang = state.language;
  document.title = t("pageTitle");
  applyI18nTexts();
  updateStatusByKey(state.lastStatusKey || "");
  if (!state.imageBitmap) renderPlaceHolder();
  if (state.validator.analysis) renderValidatorSummary();
  if (!state.validator.analysis) {
    const h3 = el.validateSummary.querySelector("h3");
    const p = el.validateSummary.querySelector("p");
    if (h3) h3.textContent = t("resultSummary");
    if (p) p.textContent = t("notAnalyzed");
  }
  renderTileList();
}

function applyI18nTexts() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
    const key = node.dataset.i18nAriaLabel;
    node.setAttribute("aria-label", t(key));
  });
}

function updateStatusByKey(key, isError = false, suffix = "") {
  if (!key) return;
  state.lastStatusKey = key;
  setStatus(`${t(key)}${suffix}`, isError);
}

function bindTabs() {
  el.tabConvertBtn.addEventListener("click", () => switchTab("convert"));
  el.tabValidateBtn.addEventListener("click", () => switchTab("validate"));
}

function switchTab(tab) {
  const isConvert = tab === "convert";
  el.tabConvertBtn.classList.toggle("active", isConvert);
  el.tabValidateBtn.classList.toggle("active", !isConvert);
  el.convertTab.classList.toggle("active", isConvert);
  el.validateTab.classList.toggle("active", !isConvert);
}

function bindValidatorUI() {
  el.validateDropZone.addEventListener("click", () => el.validateFileInput.click());
  el.validateDropZone.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") el.validateFileInput.click();
  });
  el.validateFileInput.addEventListener("change", (ev) => {
    const file = ev.target.files?.[0];
    if (file) handleValidateUpload(file);
  });

  ["dragenter", "dragover"].forEach((type) => {
    el.validateDropZone.addEventListener(type, (ev) => {
      ev.preventDefault();
      el.validateDropZone.classList.add("drag-over");
    });
  });
  ["dragleave", "drop"].forEach((type) => {
    el.validateDropZone.addEventListener(type, (ev) => {
      ev.preventDefault();
      el.validateDropZone.classList.remove("drag-over");
    });
  });
  el.validateDropZone.addEventListener("drop", (ev) => {
    const file = ev.dataTransfer?.files?.[0];
    if (file) handleValidateUpload(file);
  });

  [el.tileLimit, el.multipleHandling, el.transparencyHandling].forEach((node) => {
    node.addEventListener("input", () => {
      if (state.validator.file) handleValidateUpload(state.validator.file);
    });
  });

  el.downloadTilesetBtn.addEventListener("click", downloadTileset);
  el.downloadReportBtn.addEventListener("click", downloadReportJsonFile);
}

async function handleValidateUpload(file) {
  if (!file.type.startsWith("image/")) return;

  state.validator.file = file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const normalized = normalizeToTileGrid(bitmap, {
      tileSize: 8,
      mode: el.multipleHandling.value,
      backgroundRGBA: [224, 248, 207, 255],
      transparencyMode: el.transparencyHandling.value,
    });

    const analysis = analyzeTiles(normalized.imageData, {
      tileSize: 8,
      tileLimit: Number(el.tileLimit.value) || 192,
    });

    state.validator.normalized = normalized;
    state.validator.analysis = analysis;
    state.validator.selectedTileKey = null;

    drawValidatorPreview();
    drawValidatorOverlay();
    renderValidatorSummary();
    renderTileList();
  } catch (error) {
    console.error(error);
    el.validateSummary.innerHTML = `<h3>${t("resultSummary")}</h3><p>${t("analyzeFailed")}: ${file.name}</p>`;
  }
}

function drawValidatorPreview() {
  const normalized = state.validator.normalized;
  if (!normalized) return;
  const src = normalized.canvas;
  const displayScale = Math.max(1, Math.floor((el.validatePreviewCanvas.clientWidth || 320) / src.width));
  const w = src.width * displayScale;
  const h = src.height * displayScale;
  el.validatePreviewCanvas.width = w;
  el.validatePreviewCanvas.height = h;
  el.validateOverlayCanvas.width = w;
  el.validateOverlayCanvas.height = h;

  validatePreviewCtx.clearRect(0, 0, w, h);
  validatePreviewCtx.imageSmoothingEnabled = false;
  validatePreviewCtx.drawImage(src, 0, 0, w, h);
}

function drawValidatorOverlay() {
  const analysis = state.validator.analysis;
  if (!analysis) return;
  const w = el.validateOverlayCanvas.width;
  const h = el.validateOverlayCanvas.height;
  const tileW = w / analysis.tilesX;
  const tileH = h / analysis.tilesY;
  validateOverlayCtx.clearRect(0, 0, w, h);

  let maxFreq = 1;
  Object.values(analysis.freqByKey).forEach((v) => { maxFreq = Math.max(maxFreq, v); });

  for (let i = 0; i < analysis.tileKeyByPos.length; i++) {
    const key = analysis.tileKeyByPos[i];
    const freq = analysis.freqByKey[key];
    const strength = 1 - Math.log(freq + 1) / Math.log(maxFreq + 1);
    const x = (i % analysis.tilesX) * tileW;
    const y = Math.floor(i / analysis.tilesX) * tileH;
    validateOverlayCtx.fillStyle = `rgba(255, 80, 80, ${0.45 * strength})`;
    validateOverlayCtx.fillRect(x, y, tileW, tileH);
  }

  validateOverlayCtx.strokeStyle = "rgba(224,248,207,0.35)";
  validateOverlayCtx.lineWidth = 1;
  for (let x = 0; x <= analysis.tilesX; x++) {
    validateOverlayCtx.beginPath();
    validateOverlayCtx.moveTo(Math.round(x * tileW) + 0.5, 0);
    validateOverlayCtx.lineTo(Math.round(x * tileW) + 0.5, h);
    validateOverlayCtx.stroke();
  }
  for (let y = 0; y <= analysis.tilesY; y++) {
    validateOverlayCtx.beginPath();
    validateOverlayCtx.moveTo(0, Math.round(y * tileH) + 0.5);
    validateOverlayCtx.lineTo(w, Math.round(y * tileH) + 0.5);
    validateOverlayCtx.stroke();
  }

  if (state.validator.selectedTileKey) {
    const positions = analysis.positionsByKey[state.validator.selectedTileKey] || [];
    validateOverlayCtx.strokeStyle = "#00e4ff";
    validateOverlayCtx.lineWidth = 2;
    positions.forEach((idx) => {
      const x = (idx % analysis.tilesX) * tileW;
      const y = Math.floor(idx / analysis.tilesX) * tileH;
      validateOverlayCtx.strokeRect(x + 1, y + 1, tileW - 2, tileH - 2);
    });
  }
}

function renderValidatorSummary() {
  const analysis = state.validator.analysis;
  const normalized = state.validator.normalized;
  if (!analysis || !normalized) return;

  const rareRatio = analysis.uniqueTiles ? ((analysis.rareUniqueTiles / analysis.uniqueTiles) * 100).toFixed(1) : "0.0";
  el.validateSummary.innerHTML = `
    <h3>${t("resultSummary")}</h3>
    <p>${t("summaryStatus")}: <strong>${analysis.status}</strong></p>
    <p>${t("summarySource")}: ${normalized.srcWidth} x ${normalized.srcHeight}</p>
    <p>${t("summaryAnalyzed")}: ${analysis.analyzedWidth} x ${analysis.analyzedHeight}</p>
    <p>${t("summaryTotalTiles")}: ${analysis.totalTiles}</p>
    <p>${t("summaryColorsUsed")}: ${analysis.uniqueColors} / 4 ${analysis.paletteOk ? "(OK)" : `(${t("paletteNg")})`}</p>
    <p>${t("summaryUniqueTiles")}: ${analysis.uniqueTiles} / ${analysis.tileLimit} ${analysis.tilesOk ? "(OK)" : `(${t("tilesOver")})`}</p>
    <p>${t("summaryRareUniqueTiles")}: ${analysis.rareUniqueTiles} (${rareRatio}%)</p>
  `;
}

function renderTileList() {
  const analysis = state.validator.analysis;
  if (!analysis) return;
  el.tileList.innerHTML = "";
  const entries = Object.entries(analysis.freqByKey).sort((a, b) => a[1] - b[1]);

  entries.forEach(([key, freq]) => {
    const item = document.createElement("button");
    item.className = "tile-item";
    if (state.validator.selectedTileKey === key) item.classList.add("active");

    const c = document.createElement("canvas");
    c.width = 8;
    c.height = 8;
    c.getContext("2d").putImageData(imageDataFromTileKey(key, 8), 0, 0);

    const info = document.createElement("small");
    info.textContent = `${t("freq")}:${freq}`;
    item.append(c, info);
    item.addEventListener("click", () => {
      state.validator.selectedTileKey = key;
      renderTileList();
      drawValidatorOverlay();
    });
    el.tileList.appendChild(item);
  });
}

async function downloadTileset() {
  const analysis = state.validator.analysis;
  if (!analysis) return;
  const blob = await buildTilesetPng(analysis, { cols: 16, sort: "freqAsc", tileSize: 8 });
  downloadBlob(blob, `tileset_${analysis.uniqueTiles}tiles.png`);
}

function downloadReportJsonFile() {
  const analysis = state.validator.analysis;
  const normalized = state.validator.normalized;
  const file = state.validator.file;
  if (!analysis || !normalized || !file) return;
  const blob = buildReportJson(analysis, {
    fileName: file.name,
    mimeType: file.type,
    srcWidth: normalized.srcWidth,
    srcHeight: normalized.srcHeight,
    settings: {
      tileLimit: Number(el.tileLimit.value) || 192,
      padOrCrop: el.multipleHandling.value,
      transparencyMode: el.transparencyHandling.value,
    },
  });
  downloadBlob(blob, `tile_report_${Date.now()}.json`);
}

function imageDataFromTileKey(base64, tileSize) {
  const bin = atob(base64);
  const arr = new Uint8ClampedArray(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new ImageData(arr, tileSize, tileSize);
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
    updateStatusByKey("statusUnsupported", true);
    return;
  }

  try {
    updateStatusByKey("statusLoading");
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
    updateStatusByKey("statusLoadFailed", true);
  }
}

function downscaleIfNeeded(bitmap, maxEdge) {
  const longest = Math.max(bitmap.width, bitmap.height);
  if (longest <= maxEdge) return bitmap;

  const ratio = maxEdge / longest;
  const w = Math.max(1, Math.round(bitmap.width * ratio));
  const h = Math.max(1, Math.round(bitmap.height * ratio));

  updateStatusByKey("statusDownscaled");
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
  updateStatusByKey("statusProcessing");

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

      updateStatusByKey("statusDone", false, ` ${outW}x${outH}`);
      drawPreview();
    } catch (error) {
      console.error(error);
      updateStatusByKey("statusProcessFailed", true);
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
  if (!state.outputCanvas.width) return updateStatusByKey("statusNeedConvert", true);
  const name = `gb4_${state.outputCanvas.width}x${state.outputCanvas.height}.png`;
  state.outputCanvas.toBlob((blob) => downloadBlob(blob, name), "image/png");
}

function downloadScaled() {
  if (!state.outputCanvas.width) return updateStatusByKey("statusNeedConvert", true);
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
  previewCtx.fillText(t("placeholder"), 42, 150);
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
