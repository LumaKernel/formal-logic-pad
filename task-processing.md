## 現在のタスク

**出典:** `tasks/prd-analytic-tableau.md` AT-004

### AT-004: 分析的タブロー用クエスト

- [ ] `src/lib/quest/builtinQuests.ts` に分析的タブロークエスト5-10問を追加:
  - 基本: P ∨ ¬P の証明（排中律）
  - 含意: P → (Q → P) の証明
  - 二重否定: ¬¬P → P の証明
  - 分配律: P ∧ (Q ∨ R) ⊨ (P ∧ Q) ∨ (P ∧ R)
  - 対偶: (P → Q) → (¬Q → ¬P) の証明
  - De Morgan: ¬(P ∧ Q) ⊨ ¬P ∨ ¬Q
  - 量化子基本: ∀x.F(x) ⊨ ∃x.F(x)
- [ ] `src/lib/quest/builtinQuests.test.ts`: クエスト数更新
- [ ] 型チェック/lint/test が通る
