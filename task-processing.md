## 現在のタスク

**出典:** `tasks/quest-stories.md` L102-106

- [ ] prop-15: 二重否定導入 (DNI) — QuestComplete ストーリー作成・確認

### テスト計画

- 既存の `WorkspacePageView.stories.tsx` に `QuestCompleteProp15` + `QuestCompleteProp15ModelAnswer` ストーリーを追加
- 37ステップ証明のため `tags: ["!test"]` を使用（CI 15sタイムアウト対策、prop-12と同様）

### ストーリー計画

- `buildCompletedQuestWorkspace("prop-15")` を使用して完了状態のワークスペースを構築
- play関数は軽量版（タイムアウト対策でテスト除外するが、手動確認用にplay関数は残す）
