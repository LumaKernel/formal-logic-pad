## 現在のタスク

**ソース:** `tasks/quest-stories.md` prop-36

- [ ] prop-36: 自己弱化
  - [ ] Quest Complete ストーリー作成
  - [ ] 模範解答確認

### コンテキスト

- prop-36 は1ステップの証明（A1直接インスタンス）。CI安全
- `buildCompletedQuestWorkspace("prop-36")` で完了状態を構築

### テスト計画

- WorkspacePageView.stories.tsx に `QuestCompleteProp36` と `QuestCompleteProp36ModelAnswer` を追加

### ストーリー計画

- QuestCompleteProp36: 完了状態、play関数で検証
- QuestCompleteProp36ModelAnswer: 模範解答ベース静的確認
