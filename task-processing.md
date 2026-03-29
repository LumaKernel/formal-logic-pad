## 現在のタスク

**ソース:** `tasks/quest-stories.md` prop-39

- [ ] prop-39: 結論の弱化
  - [ ] Quest Complete ストーリー作成
  - [ ] 模範解答確認

### コンテキスト

- prop-39 は5ステップの証明。CI安全
- `buildCompletedQuestWorkspace("prop-39")` で完了状態を構築

### テスト計画

- WorkspacePageView.stories.tsx に `QuestCompleteProp39` と `QuestCompleteProp39ModelAnswer` を追加

### ストーリー計画

- QuestCompleteProp39: 完了状態、play関数で検証
- QuestCompleteProp39ModelAnswer: 模範解答ベース静的確認
