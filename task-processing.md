## 実行中タスク

**ソース:** `tasks/play-function-enhancement.md` > PLAY-WS-01

**タスク:** `EmptyLukasiewicz` — 公理パレットからA1クリック→ノード追加→ノード存在確認

### コンテキスト

- play-function-enhancement.md の基本ワークスペース操作テスト最初のタスク
- FullFlow系 (PLAY-WS-19~22) は完了済み、基本操作テストはこれが最初

### テスト計画

- `WorkspacePageView.stories.tsx` の `EmptyLukasiewicz` ストーリーのplay関数を強化
- 現状: expect のみ（ノートブック名、Backボタン、testid の表示確認）
- 追加: `workspaceTestId="workspace"` を追加し、公理パレットからA1をクリック→ノード追加→ノード存在確認のインタラクション

### ストーリー計画

- 既存ストーリーの修正のみ、新規ストーリーなし
