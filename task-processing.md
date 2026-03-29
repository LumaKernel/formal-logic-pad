## 実行中タスク

**出典:** `tasks/quest-stories.md` — propositional-basics セクション — prop-03

### タスク

- [ ] prop-03: 推移律の準備 — Quest Complete ストーリー作成 + 模範解答確認

### コンテキスト

- prop-03 は A1 の直接インスタンス（1ステップ）。公理を1つ配置するだけでゴール達成
- ゴール: `(phi -> psi) -> ((psi -> chi) -> (phi -> psi))`
- 許可公理: A1 のみ
- 模範解答: note + axiom の2ステップ

### テスト計画

- WorkspacePageView.stories.tsx に `QuestCompleteProp03` ストーリー（interactive + static）を追加
- play 関数でゴール達成（1/1, "Proved!"）を検証
- 既存の模範解答テスト（全模範解答チェック）で整合性は自動検証済み

### ストーリー計画

- `QuestCompleteProp03`: axiom のみのワークスペースで即ゴール達成を確認
- `QuestCompleteProp03ModelAnswer`: 模範解答全ステップでの確認（存在すれば）
