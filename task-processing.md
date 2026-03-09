## 実行中タスク

**出典:** `tasks/prd-logic-pad-world.md` — クエストモード拡充（predicate-advanced カテゴリ）

### タスク内容

述語論理上級クエスト4問追加（pred-adv-07〜pred-adv-10）

- pred-adv-07: 全称連言分配 (∀x.(P(x) ∧ Q(x))) → ((∀x.P(x)) ∧ (∀x.Q(x)))
- pred-adv-08: 存在選言分配 ((∃x.P(x)) ∨ (∃x.Q(x))) → (∃x.(P(x) ∨ Q(x)))
- pred-adv-09: 空前件の存在量化 (∃x.(P(x) → Q)) → ((∀x.P(x)) → Q) （x∉FV(Q)）
- pred-adv-10: 全称含意の連鎖（推移律の全称化）(∀x.(P(x) → Q(x))) → ((∀x.(Q(x) → R(x))) → (∀x.(P(x) → R(x))))

### テスト計画

- `src/lib/quest/builtinQuests.test.ts` — クエスト数の期待値を 219→223 に更新
- `src/lib/quest/builtinModelAnswers.test.ts` — 模範解答テストが自動的に新クエストを検出・検証

### ストーリー計画

- UI変更なし（クエストデータ追加のみ）。HubPageView.stories は slice(0,20) なので影響なし
