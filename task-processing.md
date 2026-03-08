## タスク

prd-logic-pad-world.md: クエストモード拡充 — AT述語論理の量化子クエスト4問追加（at-16〜at-19）

### 背景

- 現在AT 15問中、量化子γ/δ規則を使うクエストは at-07（∀x.P(x)→∃x.P(x)）の1問のみ
- γ規則（T∀, F∃）は任意項代入、δ規則（F∀, T∃）は固有変数導入
- 量化子規則の練習を増やす

### 追加クエスト案

- at-16: ∃x.P(x) → ¬∀x.¬P(x) (difficulty 2) — δ規則(T∃)+γ規則(F¬∀→T∀→γ)で閉枝
- at-17: ∀x.(P(x) → Q(x)) → (∀x.P(x) → ∀x.Q(x)) (difficulty 2) — γ規則×2 + F→分解
- at-18: ∀x.(P(x) ∧ Q(x)) → (∀x.P(x) ∧ ∀x.Q(x)) (difficulty 2) — γ規則 + F∧ β規則
- at-19: (∃x.P(x) ∨ ∃x.Q(x)) → ∃x.(P(x) ∨ Q(x)) (difficulty 3) — T∨β規則 + δ規則

### テスト計画

- src/lib/quest/builtinQuests.test.ts のクエスト数を 191→195 に更新
- builtinModelAnswers.test.ts の模範解答テスト: 4問の模範解答が自動テスト通過確認

### ストーリー計画

- UI変更なし（データ追加のみ）。ブラウザでクエストカタログ確認のみ
