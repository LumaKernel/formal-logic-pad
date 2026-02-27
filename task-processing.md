## 実行中タスク

**出典:** `tasks/prd-inserted-tasks.md` 2行目

> 代入については、元の式から代入する対象のメタ変数などを抜きだす純粋関数を用意して、その対象を入力すれば完了できるような仕組みにしてほしい。

### 周辺情報

- `collectUniqueFormulaMetaVariables` / `collectTermMetaVariablesInFormula` は既に `metaVariable.ts` に存在
- ただし Formula 内の TermMetaVariable のユニーク版がない
- `substitutionApplicationLogic.ts` に代入エントリのテンプレート自動生成関数を追加する
- 公理スキーマからメタ変数を抽出 → 空の代入エントリテンプレートを生成 → UIで値入力 → 代入適用

### 実装計画

1. `collectUniqueTermMetaVariablesInFormula` をメタ変数モジュールに追加
2. `extractSubstitutionTargets` 純粋関数を作成: Formula → { formulaMetaVars, termMetaVars }
3. `generateSubstitutionEntryTemplate` 純粋関数を作成: 抽出結果 → 空のSubstitutionEntries
4. UI統合: ProofWorkspace の代入ノード作成時に自動テンプレート生成
