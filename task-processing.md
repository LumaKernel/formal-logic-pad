## 実行中タスク

**元タスク:** `tasks/prd-logic-pad-world.md` - クエストモード拡充

### タスク内容

述語論理上級 (predicate-advanced) カテゴリに4問追加（pred-adv-11〜pred-adv-14）

### テスト計画

- `builtinQuests.test.ts`: クエスト数を 243→247 に更新
- `builtinModelAnswers.test.ts`: predicate-advanced セクションの模範解答テストが通ることを確認
- 既存テスト全体が通ることを確認

### ストーリー計画

- UI変更なし（新規クエスト追加のみ）
- HubPageView.stories.tsx は `builtinQuests.slice(0, 20)` のため影響なし

### 追加するクエスト案

1. **pred-adv-11**: 存在量化子の交換 `(∃x.∃y.P(x,y)) → (∃y.∃x.P(x,y))` — 全称の交換(pred-adv-05)の∃版
2. **pred-adv-12**: 全称の連言分配 `(∀x.(P(x) ∧ Q(x))) → ((∀x.P(x)) ∧ (∀x.Q(x)))` — ∀が∧に分配可能
3. **pred-adv-13**: 存在の選言分配 `(∃x.(P(x) ∨ Q(x))) → ((∃x.P(x)) ∨ (∃x.Q(x)))` — ∃が∨に分配可能
4. **pred-adv-14**: 空虚な全称化 `φ → (∀x.φ)` (x∉FV(φ)) — 自由変数を含まない式の全称化
