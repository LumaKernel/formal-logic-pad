## 実行中タスク

**出典:** `tasks/prd-logic-pad-world.md` - クエストモード拡充

**タスク:** タブロー(tab)カテゴリに述語論理クエスト4問追加（tab-23〜tab-26）

### 周辺情報

- tab-01〜tab-18: 命題論理タブロー（22問中18問）
- tab-19〜tab-22: 述語論理タブロー（量化子∀/∃規則）
- tab-19: ∀除去 (difficulty 1), tab-20: ∃→¬∀¬ (difficulty 2), tab-21: ∀含意分配 (difficulty 2), tab-22: ∀連言分配 (difficulty 3)
- 述語論理のさらなるパターン: ∃選言分配、全称→存在、De Morgan量化子版、二重量化子交換

### テスト計画

- `src/lib/quest/builtinQuests.test.ts` — クエスト数を171→175に更新
- `src/lib/quest/builtinModelAnswers.test.ts` — 模範解答テストが自動的に新クエストを拾う
- 全テスト通過・カバレッジ維持を確認

### ストーリー計画

- UI変更なし（データ追加のみ）。スクリーンショットでカタログ表示を確認

### クエスト候補

- tab-23: 全称から存在 ¬(∀x.P(x) → ∃x.P(x)) (difficulty 1) — ∀規則+∃導入的操作
- tab-24: 存在連言分配 ¬(∃x.(P(x)∧Q(x)) → ∃x.P(x)) (difficulty 2) — ∃規則+∧分解
- tab-25: 全称量化子の交換 ¬(∀x.∀y.P(x,y) → ∀y.∀x.P(x,y)) (difficulty 2) — ¬∀+∀の組合せ
- tab-26: 存在選言分配 ¬((∃x.P(x) ∨ ∃x.Q(x)) → ∃x.(P(x) ∨ Q(x))) (difficulty 3) — ∃+∨分岐
