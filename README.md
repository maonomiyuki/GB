# GB Dot Converter

HTML5で動く、画像をGB Studio互換4色固定パレットに変換する静的Webアプリです。

## セットアップ

```bash
npm install
npm run dev
```

> 代替として `python -m http.server` でも静的配信できます（ただしVite開発サーバー推奨）。

## 機能1: 変換（Converter）

- 画像アップロード（D&D + ファイル選択）
- 中央トリミング + ズーム/パン
- 出力サイズプリセット（160x144 / 128x112 / 240x216 / custom）
- 明るさ/コントラスト/ガンマ/ぼかし
- ディザ（OFF / Bayer 4x4 / Floyd–Steinberg）
- 4色固定パレット化（`#071821 #306850 #86c06c #e0f8cf`）
- 原寸PNG / 最近傍拡大PNG（2/3/4/6/8）

## 機能2: 最終PNG検証（Tile & Palette Validator）

「変換結果」ではなく、ドットアプリ等で手直し・手打ちした**最終書き出しPNG**を検証するためのタブです。

### 何を検証するか

1. **Palette Validator**
   - 使用色数 `Colors used: N / 4` を表示
   - `N > 4` の場合 `PALETTE_NG`
2. **Tile Validator**
   - 8x8タイルへ分割し、完全一致でユニークタイル数を集計
   - `Unique tiles: X / limit` を表示（デフォルト limit=192）
   - 超過時 `TILES_OVER`
3. **サイズ正規化**
   - 8の倍数でない入力サイズを、設定に応じて `Pad` または `Crop`
4. **透明処理**
   - `Replace with background` / `Treat as color0`（現状はどちらも背景色置換）

### 可視化

- ヒートマップ（freq=1を強調、頻出は薄く）
- 8pxグリッドオーバーレイ
- ユニークタイル一覧（freq低い順）
- 一覧クリックで該当タイルの出現箇所をハイライト

### ダウンロード

- **Download Tileset PNG**
  - 16列固定、8x8タイルを並べたタイルセット
- **Download Report JSON**
  - `tile-validator-v1` 形式で主要指標を保存
  - `tileKeyByPos` 等の巨大データは含めない

## 動作確認手順（段階的）

### Phase 1: 変換MVP
- 画像を読み込む
- サイズを `160x144` にして変換表示
- `gb4_160x144.png` / `gb4_160x144_x4.png` を保存

### Phase 2: 変換追加機能
- ディザを `Floyd–Steinberg` に変更して見た目が変わる
- ディザ強度を `0` にするとOFF相当
- 長辺4096px超画像で縮小案内が出る

### Phase 3: 最終PNG検証
- 検証タブにPNGをアップロード
- `src` と `analyzed` サイズ（8の倍数化後）を確認
- `Colors used` が4以下か確認
- `Unique tiles` がlimit(192)以下か確認
- タイル一覧クリックでハイライト表示を確認
- Tileset PNG / Report JSON を保存して中身を確認

## カスタマイズポイント

- 固定パレット: `main.js` の `GB_PALETTE_HEX`
- 変換サイズプリセット: `index.html` の `#sizePreset`
- 検証ロジック: `tileAnalyzer.js`
- スタイル: `style.css`
