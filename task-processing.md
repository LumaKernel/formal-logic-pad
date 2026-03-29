## 現在のタスク

**ソース:** `tasks/quest-stories.md` prop-38

- [ ] prop-38: A2の自己変数適用
  - [ ] Quest Complete ストーリー作成
  - [ ] 模範解答確認

### コンテキスト

- prop-38 は1ステップの証明（A2直接インスタンス）。CI安全
- `buildCompletedQuestWorkspace("prop-38")` で完了状態を構築

### テスト計画

- WorkspacePageView.stories.tsx に `QuestCompleteProp38` と `QuestCompleteProp38ModelAnswer` を追加

### ストーリー計画

- QuestCompleteProp38: 完了状態、play関数で検証
- QuestCompleteProp38ModelAnswer: 模範解答ベース静的確認
