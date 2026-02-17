# GB Dot Converter

A static web app that runs in your browser and converts images into the 4-color Game Boy style palette for GB Studio.
ブラウザで動く静的Webアプリで、画像をGB Studio向けの4色ゲームボーイ風パレットに変換できます。

---

## English Guide (Beginner Friendly)

### 1) Quick start

```bash
npm install
npm run dev
```

Open the URL shown by Vite (usually `http://localhost:5173`).

### 2) Change language (EN / JA)

Use the language selector in the header:
- `日本語`
- `English`

Your choice is saved in the browser automatically.

### 3) Convert an image (Convert tab)

1. Drag and drop an image, or click the upload area.
2. (Optional) Adjust settings:
   - Crop / Resize
   - Brightness / Contrast / Gamma / Blur
   - Dither mode and strength
3. Check preview using **Before / After**.
4. Save output:
   - **Save PNG for GB Studio** (raw size)
   - **Save Upscaled PNG for SNS** (2x/3x/4x/6x/8x)

### 4) Validate final PNG (Final PNG Validation tab)

Use this for the **final PNG** you edited in pixel tools.

1. Upload PNG.
2. Check:
   - **Colors used** (should be 4 or less)
   - **Unique tiles / limit** (default limit: 192)
   - Source/analyzed size (normalized to multiples of 8)
3. Optional downloads:
   - **Download Tileset PNG**
   - **Download Report JSON**

### 5) Troubleshooting

- If image load fails, try PNG/JPG/WebP and smaller file sizes.
- Very large images are downscaled internally.
- If output is too noisy, reduce dither strength or use `OFF`.

---

## 日本語ガイド（初心者向け）

### 1) はじめ方

```bash
npm install
npm run dev
```

Viteが表示したURL（通常 `http://localhost:5173`）をブラウザで開いてください。

### 2) 言語切り替え（英語 / 日本語）

ヘッダーの言語セレクターで切り替えます。
- `日本語`
- `English`

選択した言語はブラウザに自動保存されます。

### 3) 画像を変換する（変換タブ）

1. 画像をドラッグ&ドロップ、またはクリックで選択。
2. 必要に応じて設定を調整：
   - トリミング / リサイズ
   - 明るさ / コントラスト / ガンマ / ぼかし
   - ディザ方式 / 強度
3. **変換前 / 変換後** で見た目を確認。
4. 保存：
   - **GB Studio用PNG保存**（原寸）
   - **SNS向け拡大PNG保存**（2x/3x/4x/6x/8x）

### 4) 最終PNGを検証する（最終PNG検証タブ）

ドットエディタで仕上げた **最終書き出しPNG** を確認する用途です。

1. PNGをアップロード。
2. 次を確認：
   - **Colors used**（4色以下か）
   - **Unique tiles / limit**（デフォルト上限 192）
   - Source / Analyzed サイズ（8の倍数に正規化）
3. 必要なら保存：
   - **タイルセットPNG保存**
   - **レポートJSON保存**

### 5) うまくいかないとき

- 読み込み失敗時は PNG/JPG/WebP を試し、画像サイズを小さくしてください。
- 大きすぎる画像は内部で自動縮小されます。
- ノイズが気になる場合はディザ強度を下げるか `OFF` にしてください。

---

## Main Features

- Image upload (drag & drop + file picker)
- Center crop + zoom/pan
- Output size presets (`160x144`, `128x112`, `240x216`, custom)
- Brightness / contrast / gamma / blur
- Dither (`OFF`, `Bayer 4x4`, `Floyd–Steinberg`)
- Fixed GB palette (`#071821 #306850 #86c06c #e0f8cf`)
- Final PNG validator (palette + tile count)

## Customization points

- Fixed palette: `main.js` (`GB_PALETTE_HEX`)
- Size presets: `index.html` (`#sizePreset`)
- Validator logic: `tileAnalyzer.js`
- Styles: `style.css`
