## 現在のタスク

**出典:** `tasks/quest-stories.md` L107-111

- [ ] prop-16: Modus Tollens — QuestComplete ストーリー作成・確認

### テスト計画

- 既存の `WorkspacePageView.stories.tsx` に `QuestCompleteProp16` + `QuestCompleteProp16ModelAnswer` ストーリーを追加
- 106ステップ証明のため `tags: ["!test"]` を使用（CI 15sタイムアウト対策）

### ストーリー計画

- `buildCompletedQuestWorkspace("prop-16")` を使用して完了状態のワークスペースを構築
- play関数なし（テスト除外）
