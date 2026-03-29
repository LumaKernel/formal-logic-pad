## 現在のタスク

**出典:** `tasks/quest-stories.md` - propositional-basics - prop-05

- [ ] prop-05: 含意の弱化 — Quest Complete ストーリー作成・確認

### コンテキスト

- prop-05: φ → (ψ → (χ → ψ)) を証明。K公理の2重適用。3ステップ。
- 模範解答: axiom(psi -> (chi -> psi)), axiom((psi -> (chi -> psi)) -> (phi -> (psi -> (chi -> psi)))), mp

### テスト計画

- WorkspacePageView.stories.tsx に QuestCompleteProp05 ストーリーを追加
- play関数でゴール達成・完了バナー・ノード存在を確認

### ストーリー計画

- QuestCompleteProp05: interactive play関数付き（prop-04パターン準拠）
