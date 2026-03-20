## タスク: 項ASTへのSubstitutionノード追加

ソース: `tasks/inserted-tasks.md` 行3

### 現状

- `FormulaSubstitution` は既存（`φ[τ/x]`）。パーサー/フォーマッター/各種ロジックで対応済み
- 項（Term）には `TermVariable`, `TermMetaVariable`, `Constant`, `FunctionApplication`, `BinaryOperation` の5種のみ
- `τ₀[τ₁/x]` のようなオブジェクト言語レベルの項置換を表す構文ノードが存在しない
- 13箇所の exhaustive switch を更新する必要がある

### テスト計画

- `term.test.ts` に `TermSubstitution` の基本テスト追加（ファクトリ、_tag、フィールド検証）
- `formatUnicode.test.ts` / `formatLaTeX.test.ts` にフォーマットテスト追加
- `parser.test.ts` にパーステスト追加（`x[y/z]`, `f(x)[g(y)/z]`, チェーン `t[a/x][b/y]`）
- `freeVariables.test.ts` に自由変数収集テスト追加
- `substitution.test.ts` にメタ変数代入のテスト追加
- `equality.test.ts` / `unification.test.ts` にテスト追加
- `serialization.test.ts` にシリアライゼーションテスト追加

### 実装計画

1. **`term.ts`**: `TermSubstitution` クラス追加（term, replacementTerm, variable）、Union更新、ファクトリ関数追加
2. **9ファイル13箇所の exhaustive switch 更新**:
   - `substitution.ts` (2箇所): メタ変数代入・変数代入で再帰
   - `termVariableMatching.ts` (2箇所): 束縛変数チェック・マッチング
   - `unification.ts` (1箇所): occursInTerm
   - `freeVariables.ts` (2箇所): freeVariablesInTerm, allVariableNamesInTerm
   - `metaVariable.ts` (1箇所): collectTermMetaVariables
   - `formulaHighlight.ts` (2箇所): termChildBP, tokenizeTermInner
   - `formatUnicode.ts` (2箇所): termChildBP, formatTermInner
   - `formatLaTeX.ts` (2箇所): termChildBP, formatTermInner
   - `inferenceRule.ts` (1箇所): matchTerm
3. **パーサー (`parser.ts`)**: `parseTerm` 後に `[τ/x]` postfix をパース
4. **フォーマッター**: Unicode/LaTeX で `t[s/x]` を出力
5. **簡約**: `resolveTermSubstitution` — `TermSubstitution` を評価して通常の Term に変換

### ストーリー計画

- なし（内部ロジック変更のみ）
