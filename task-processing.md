## 現在のタスク

**ソース:** `tasks/quest-stories.md` prop-37

- [ ] prop-37: 含意式の弱化
  - [ ] Quest Complete ストーリー作成
  - [ ] 模範解答確認

### コンテキスト

- prop-37 は1ステップの証明（A1直接インスタンス）。CI安全
- `buildCompletedQuestWorkspace("prop-37")` で完了状態を構築

### テスト計画

- WorkspacePageView.stories.tsx に `QuestCompleteProp37` と `QuestCompleteProp37ModelAnswer` を追加

### ストーリー計画

- QuestCompleteProp37: 完了状態、play関数で検証
- QuestCompleteProp37ModelAnswer: 模範解答ベース静的確認
