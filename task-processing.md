## タスク（from tasks/inserted-tasks.md）

- [ ] すべてのクエストのセクションに関するフルのストーリーが揃っていない気がする

### 調査結果

17カテゴリ中5カテゴリのみFullFlowストーリーあり。不足:

- predicate-basics, predicate-advanced（述語論理）
- equality-basics（等号）
- group-basics, group-proofs（群論）
- peano-basics, peano-arithmetic（ペアノ算術）
- propositional-intermediate, propositional-negation, propositional-advanced（命題論理の中級以上）

### 今回の実装

pred-01（述語論理基礎）のFullFlowストーリーを追加

### バグ修正

- `substitutionApplicationLogic.ts`: 代入適用後に `resolveFormulaSubstitution` を呼び出すように修正
  - A4公理の代入結果が `P(x)[x/x]` のように FormulaSubstitution ASTノードを含んだままだった
  - ゴール式 `(∀x.P(x)) → P(x)` と構造的に一致しないため、ゴール達成判定が失敗していた
  - `resolveFormulaSubstitution` で `P(x)[x/x]` → `P(x)` に解決することで修正
