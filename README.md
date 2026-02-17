# GB Dot Converter

HTML5で動く、画像をGB Studio互換4色固定パレットに変換する静的Webアプリです。

## セットアップ

```bash
npm install
npm run dev
```

> 代替として `python -m http.server` でも静的配信できます（ただしVite開発サーバー推奨）。

## 実装フェーズ（段階的）

### Phase 1: MVP
1. 画像アップロード（D&D + ファイル選択）
2. 中央トリミング + ズーム/パン
3. 出力サイズプリセット（160x144等）
4. 明るさ/コントラスト/ガンマ補正
5. Bayer 4x4ディザ + 4色固定減色
6. 原寸PNG / 最近傍拡大PNG保存

**動作確認（MVP）**
- 画像を読み込む
- サイズを `160x144` にして変換表示
- `GB Studio用PNG保存` を押し `gb4_160x144.png` が保存される
- `SNS向け拡大PNG保存` を押し `gb4_160x144_x4.png` が保存される

### Phase 2: 追加機能
1. Floyd–Steinbergディザ
2. ディザ強度（0でディザOFF相当）
3. 4096px超入力の内部縮小
4. 出力安全柵（4色以外が混ざったら再マップ）

**動作確認（追加機能）**
- ディザを `Floyd–Steinberg` に変更して変換結果が変わる
- ディザ強度を `0` にするとOFF相当になる
- 長辺4000px超画像を読み込むと縮小案内が表示される

## 主要ロジック

- `main.js`
  - `processImagePipeline()` が仕様順序（読込→crop→縮小→補正→ディザ→4色化→出力→拡大）を実行。
  - `nearestPaletteColor()` で固定4色への最近傍マッピング。
  - `ditherBayer()` と `ditherFloydSteinberg()` を実装。
  - `enforcePaletteSafety()` が最終安全柵として4色のみを保証。
  - プレビューと拡大PNG描画は `imageSmoothingEnabled = false` で最近傍。

## カスタマイズポイント

- パレット固定値: `main.js` の `GB_PALETTE_HEX`
- サイズプリセット: `index.html` の `#sizePreset` options
- ディザモードUI: `index.html` の `#ditherMode`
- スタイル変更: `style.css`
