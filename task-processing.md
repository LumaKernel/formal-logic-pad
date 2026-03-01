## タスク: カバレッジ改善 — normalForm.ts Branch 86.92% → 向上

**出典:** カバレッジレポートより（PRDタスクなし、差し込みタスクなし → カバレッジ改善を実施）

### テスト計画

1. `normalForm.test.ts` に以下を追加:
   - `toPredicateNNF` の Disjunction 直接テスト（`P(x) ∨ Q(x)` をトップレベルで）
   - `pushPredicateNegation` の未カバー分岐（¬(P↔Q)の述語版、¬∀/¬∃のネスト）
   - `isPNF` の while ループ条件分岐テスト
   - `pullQuantifiers` / `liftQuantifiersFromBinary` の追加分岐テスト

2. 防御的コードの `v8 ignore` 確認:
   - `languageToggleLogic.ts` / `themeToggleLogic.ts` → 既に v8 ignore 済み（対応不要）
   - `grid.ts` / `cutEliminationStepperLogic.ts` → 確認して必要なら追加

### ストーリー計画

- UI変更なし

### ベースラインカバレッジ

- Stmts 98.76%, Branch 93.26%, Funcs 89.65%, Lines 99.22%
- normalForm.ts: Stmts 100%, Branch 86.92%, Funcs 50%, Lines 100%
