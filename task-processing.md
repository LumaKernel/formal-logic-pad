## 実行中タスク

**ソース:** `tasks/prd-replace.md`

### タスク

- 等価性の判定をより柔軟にする:
  - phi[../x][../y] と phi[../y][../x] は等価（独立した置換の交換律）
  - phi[../x][../y] と phi[..[/y]/x][../y] は等価（後続の置換がある場合の FreeVariableAbsence 冗長性）

### 問題分析

現在の `normalizeFormula` は `FormulaSubstitution` を `substituteTermVariableInFormula` で解決するが、
MetaVariable に対する置換は効果がないため、`φ[a/x]` が `φ` に正規化されてしまい情報が失われる。

### テスト計画

- `src/lib/logic-core/substitution.test.ts` に以下を追加:
  - MetaVariable 上の置換が保持されるテスト
  - 独立した置換の順序交換の等価性テスト
  - FreeVariableAbsence の冗長性除去テスト
  - 同一変数の複数置換マージテスト
- `src/lib/logic-core/equality.test.ts` に以下を追加:
  - `equivalentFormula` での置換交換律テスト

### ストーリー計画

UI 変更なし。純粋ロジック層のみ。

### 実装計画

1. `normalizeFormulaRec` を修正: MetaVariable ベースの場合は置換を保持
2. 置換チェーン正規化ロジックを追加:
   - チェーン収集（FormulaSubstitution + FreeVariableAbsence の列）
   - 後続の同変数 FormulaSubstitution がある FreeVariableAbsence を除去
   - 同時代入形式への変換（後の置換を先の項に伝搬）
   - 変数名でソート
   - 再構築
