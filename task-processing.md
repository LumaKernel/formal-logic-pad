## タスク

prd-2026-03-10.md より:

> 自作としての複製をするとエラーもでるし
> Updating a style property during rerender (border) when a conflicting property is set (borderTop)

### 問題

`CustomQuestListComponent.tsx` で CSS `border` shorthand と `borderTop: "none"` を混在させている。
React rerenderで shorthand と longhand の競合が起きスタイリングバグの警告が出る。

### 影響箇所

1. `emptyStyle` (line ~240): `border` + `borderTop: "none"`
2. `questListStyle` (line ~102): `border` + `borderTop: "none"`

### 修正方針

`border` shorthand を使わず、必要な3辺を明示的に指定する:
- `borderRight`, `borderBottom`, `borderLeft` を個別指定
- `borderTop` は省略（デフォルト none）

### テスト計画

- 既存テスト (`CustomQuestListComponent.test.tsx`, `CustomQuestListComponent.stories.tsx`) が通ることを確認
- ブラウザでスクリーンショット確認

### ストーリー計画

- UI変更なし（スタイル修正のみで見た目は同一）。既存ストーリーで確認。
