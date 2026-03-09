## タスク: セレクションメニューの各アクションがwrapされることがあるが、それはないようにしたい

出典: `tasks/prd-inserted-tasks.md`

### 問題

`ProofWorkspace.tsx` のセレクションバナー（ノード選択時に表示される上部バナー）のアクションボタンが、画面幅が狭い場合にテキストが折り返されてしまう。

### 原因

- `selectionActionButtonStyle` に `whiteSpace: "nowrap"` がない
- `cancelButtonStyle` にも同様
- `mpSelectionBannerStyle`（ベーススタイル）にも `flexShrink: 0` がボタンに設定されていないため、flex収縮で改行が発生する

### 修正計画

1. `selectionActionButtonStyle` に `whiteSpace: "nowrap"` を追加
2. `cancelButtonStyle` にも `whiteSpace: "nowrap"` を追加
3. 同じ問題がある他のバナーのボタンスタイル（genVariableInputStyle等）も確認

### テスト計画

- 既存の `ProofWorkspace.test.tsx` のセレクションバナー関連テストが引き続きpassすることを確認
- 既存の Storybook ストーリー（`Shift Click Selection Toggle` 等）で視覚確認

### ストーリー計画

- 新規ストーリー不要。既存の `ProofWorkspace.stories.tsx` の `Shift Click Selection Toggle` ストーリーでブラウザ確認
