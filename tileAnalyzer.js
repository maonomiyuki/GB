const DEFAULT_BG = [224, 248, 207, 255];

export function normalizeToTileGrid(input, options = {}) {
  const {
    tileSize = 8,
    mode = "pad",
    backgroundRGBA = DEFAULT_BG,
    transparencyMode = "replace",
  } = options;

  const srcWidth = input.width;
  const srcHeight = input.height;

  let analyzedWidth;
  let analyzedHeight;
  if (mode === "crop") {
    analyzedWidth = Math.max(tileSize, Math.floor(srcWidth / tileSize) * tileSize);
    analyzedHeight = Math.max(tileSize, Math.floor(srcHeight / tileSize) * tileSize);
  } else {
    analyzedWidth = Math.ceil(srcWidth / tileSize) * tileSize;
    analyzedHeight = Math.ceil(srcHeight / tileSize) * tileSize;
  }

  const canvas = document.createElement("canvas");
  canvas.width = analyzedWidth;
  canvas.height = analyzedHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  ctx.fillStyle = rgbaToCss(backgroundRGBA);
  ctx.fillRect(0, 0, analyzedWidth, analyzedHeight);

  const drawW = Math.min(srcWidth, analyzedWidth);
  const drawH = Math.min(srcHeight, analyzedHeight);
  ctx.drawImage(input, 0, 0, drawW, drawH, 0, 0, drawW, drawH);

  const imageData = ctx.getImageData(0, 0, analyzedWidth, analyzedHeight);
  normalizeTransparency(imageData, backgroundRGBA, transparencyMode);
  ctx.putImageData(imageData, 0, 0);

  return {
    srcWidth,
    srcHeight,
    analyzedWidth,
    analyzedHeight,
    canvas,
    ctx,
    imageData,
  };
}

export function analyzeTiles(imageData, options = {}) {
  const tileSize = options.tileSize ?? 8;
  const tileLimit = options.tileLimit ?? 192;

  const analyzedWidth = imageData.width;
  const analyzedHeight = imageData.height;
  const tilesX = Math.floor(analyzedWidth / tileSize);
  const tilesY = Math.floor(analyzedHeight / tileSize);
  const totalTiles = tilesX * tilesY;

  const colorCounts = new Map();
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const key = `${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]}`;
    colorCounts.set(key, (colorCounts.get(key) ?? 0) + 1);
  }

  const topColors = [...colorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([key, count]) => ({ rgba: key.split(",").map(Number), count }));

  const freqByKeyMap = new Map();
  const tileKeyByPos = [];
  const positionsByKey = {};

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const key = buildTileKey(imageData, tx * tileSize, ty * tileSize, tileSize);
      tileKeyByPos.push(key);
      freqByKeyMap.set(key, (freqByKeyMap.get(key) ?? 0) + 1);
      if (!positionsByKey[key]) positionsByKey[key] = [];
      positionsByKey[key].push(ty * tilesX + tx);
    }
  }

  const freqByKey = Object.fromEntries(freqByKeyMap.entries());
  const uniqueTiles = freqByKeyMap.size;
  const rareUniqueTiles = [...freqByKeyMap.values()].filter((count) => count === 1).length;

  const paletteOk = colorCounts.size <= 4;
  const tilesOk = uniqueTiles <= tileLimit;
  const status = paletteOk && tilesOk ? "OK" : (!paletteOk && !tilesOk ? "BOTH" : (!paletteOk ? "PALETTE_NG" : "TILES_OVER"));

  return {
    srcWidth: analyzedWidth,
    srcHeight: analyzedHeight,
    analyzedWidth,
    analyzedHeight,
    tileSize,
    tilesX,
    tilesY,
    totalTiles,
    uniqueColors: colorCounts.size,
    uniqueTiles,
    rareUniqueTiles,
    paletteOk,
    tilesOk,
    tileLimit,
    status,
    tileKeyByPos,
    freqByKey,
    positionsByKey,
    topColors,
    imageData,
  };
}

export async function buildTilesetPng(analysisResult, options = {}) {
  const { cols = 16, sort = "freqAsc", tileSize = 8 } = options;
  const entries = Object.entries(analysisResult.freqByKey);
  entries.sort((a, b) => sort === "freqDesc" ? b[1] - a[1] : a[1] - b[1]);

  const rows = Math.max(1, Math.ceil(entries.length / cols));
  const canvas = document.createElement("canvas");
  canvas.width = cols * tileSize;
  canvas.height = rows * tileSize;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  entries.forEach(([key], idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    drawTileFromKey(ctx, key, col * tileSize, row * tileSize, tileSize);
  });

  const blob = await canvasToBlob(canvas, "image/png");
  return blob;
}

export function buildReportJson(analysisResult, meta) {
  const report = {
    version: "tile-validator-v1",
    timestamp: new Date().toISOString(),
    input: {
      fileName: meta.fileName,
      mimeType: meta.mimeType,
      srcWidth: meta.srcWidth,
      srcHeight: meta.srcHeight,
    },
    settings: meta.settings,
    results: {
      analyzedWidth: analysisResult.analyzedWidth,
      analyzedHeight: analysisResult.analyzedHeight,
      tilesX: analysisResult.tilesX,
      tilesY: analysisResult.tilesY,
      totalTiles: analysisResult.totalTiles,
      uniqueColors: analysisResult.uniqueColors,
      uniqueTiles: analysisResult.uniqueTiles,
      rareUniqueTiles: analysisResult.rareUniqueTiles,
      status: analysisResult.status,
    },
    topColors: analysisResult.topColors,
  };

  return new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
}

function normalizeTransparency(imageData, backgroundRGBA, transparencyMode) {
  const { data } = imageData;
  const [br, bg, bb] = backgroundRGBA;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 255) {
      if (transparencyMode === "replace" || transparencyMode === "color0") {
        data[i] = br;
        data[i + 1] = bg;
        data[i + 2] = bb;
      }
      data[i + 3] = 255;
    }
  }
}

function buildTileKey(imageData, x0, y0, tileSize) {
  const { data, width } = imageData;
  const arr = new Uint8Array(tileSize * tileSize * 4);
  let ptr = 0;

  for (let y = 0; y < tileSize; y++) {
    for (let x = 0; x < tileSize; x++) {
      const i = ((y0 + y) * width + (x0 + x)) * 4;
      arr[ptr++] = data[i];
      arr[ptr++] = data[i + 1];
      arr[ptr++] = data[i + 2];
      arr[ptr++] = data[i + 3];
    }
  }

  return uint8ToBase64(arr);
}

function drawTileFromKey(ctx, key, dx, dy, tileSize) {
  const bytes = base64ToUint8(key);
  const imageData = ctx.createImageData(tileSize, tileSize);
  imageData.data.set(bytes);
  ctx.putImageData(imageData, dx, dy);
}

function uint8ToBase64(arr) {
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin);
}

function base64ToUint8(base64) {
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function rgbaToCss(rgba) {
  return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3] / 255})`;
}

function canvasToBlob(canvas, type) {
  return new Promise((resolve) => canvas.toBlob(resolve, type));
}
