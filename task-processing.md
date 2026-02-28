## 現在のタスク

**出典:** `tasks/prd-advanced.md` — H2 → H1

### H2: 否定標準形 (NNF) への変換
- ¬ を原子命題の直前にのみ現れるよう変換。CNF/DNF の前段階

### H1: CNF (連言標準形) / DNF (選言標準形) への変換機能
- 命題論理式を CNF/DNF に変換するアルゴリズム

### 周辺情報
- 既存の evaluation.ts に命題論理の評価エンジンがある
- formula.ts にAST定義がある
- NNFはCNF/DNFの前段階なのでH2を先にやる
- 実装先: `src/lib/logic-core/normalForm.ts` (新規)
- テスト: `src/lib/logic-core/normalForm.test.ts` (新規)

### ベースライン
- Tests: 5252 passed (193 files)
- Coverage: Stmts 98.55%, Branch 92.72%, Funcs 90.09%, Lines 99.32%
