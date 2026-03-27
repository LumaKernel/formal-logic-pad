## 実行中タスク

**出典:** `tasks/play-function-enhancement.md` PLAY-WS-02

> `WithAxiomNodes` — ノードをダブルクリック→編集モード→式を変更→Tab→更新確認

### テスト計画

- WorkspacePageView.stories.tsx の `WithAxiomNodes` ストーリーに play 関数を追加
- ノードのダブルクリック→編集→式変更→Tab→更新確認のフルフロー
- テストファイル追加: なし（ストーリーの play 関数がインタラクションテスト）

### ストーリー計画

- `WithAxiomNodes` の play 関数を強化（既存ストーリーの修正のみ）
- `workspaceTestId` を追加（testId によるクエリ可能化）
