# Scene: Switch With Fade Color (GB Studio 4.2)

GB Studio 4.2 向けに、イベントごとにフェード色（White/Black）を指定してシーン切り替えできるカスタムイベントを追加するプラグインです。

## 追加されるイベント

- **Scene: Switch With Fade Color**

### 項目

- 移動先シーン
- 移動先X座標
- 移動先Y座標
- プレイヤーの向き
- フェード色: `White` / `Black`
- フェード速度: `Default` / `Fast` / `Slow`

## 対応バージョン

- GB Studio **4.2.x**

## 導入方法

1. GB Studio プロジェクト直下に `plugins` フォルダを作成（なければ）。
2. この `scene-switch-with-fade-color` フォルダを、プロジェクトの `plugins` フォルダへコピー。
3. GB Studio を開き直す（またはプロジェクトを再読み込み）。
4. イベント追加メニューで **Scene: Switch With Fade Color** を使用。

最終的な配置例:

```text
YourProject/
  your_project.gbsproj
  plugins/
    scene-switch-with-fade-color/
      plugin.json
      README.md
      events/
        eventSceneSwitchWithFadeColor.js
```

## 実装メモ

このイベントは、GB Studio の既存 `Scene Switch` と同じ `sceneSwitchUsingScriptValues` を使い、
切り替え直前にエンジンフィールド `fade_style` を更新してフェード色を指定しています。

そのため、**シーン切り替え挙動自体は標準イベントに近い**です。

## 既存プロジェクトへの導入時の注意

- 既存イベントを直接置き換えず、必要箇所だけこのイベントに差し替える運用を推奨。
- フェード色は `fade_style`（エンジン設定）を切り替えて実現しているため、
  以降のシーン切り替えにも設定が引き継がれます。
- 色を明示したい切り替えは、このイベントを一貫して使うと安全です。

## Overlay を使った代替案（参考）

もしプロジェクト側の都合で `fade_style` を変えたくない場合は、次のような疑似フェード構成も可能です。

1. `Screen: Show Overlay` で `Black` または `White` を表示
2. （必要に応じて）`Overlay Move To` で演出
3. `Scene: Switch` でシーン切り替え
4. 遷移先シーンの `On Init` で `Hide Overlay`

この方法は「完全に標準フェードと同じ見え方」ではありませんが、
イベント単位で色を管理しやすい代替手段です。
