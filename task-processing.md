## 実行タスク

**元ファイル:** `tasks/prd-replace.md`

- [ ] phi[../x] と 実際にxをなにかに統一的に置換したものは等価
- [ ] x[/x] はあくまでも、なににも変換(簡約)できないだけで、正当なものになる。

### 周辺情報

- `resolveFormulaSubstitution` は FormulaSubstitution を解決するが、FreeVariableAbsence は残す
- `equalFormula` は構造的等価性のみ（`P(x)[a/x]` と `P(a)` は等価と判定されない）
- 必要: 正規化ベースの等価性判定（FormulaSubstitution解決 + FreeVariableAbsence簡約）

### テスト計画

- `src/lib/logic-core/substitution.test.ts` に `normalizeFormula` テストを追加
  - FormulaSubstitution の解決（既存 resolveFormulaSubstitution と同等）
  - FreeVariableAbsence の簡約（変数が自由でない → 除去、自由 → 保持）
  - ネストしたケース
- `src/lib/logic-core/equality.test.ts` に `equivalentFormula` テストを追加
  - `P(x)[a/x]` ≡ `P(a)`
  - `φ[/x]` ≡ `φ`（xが自由でない場合）
  - `φ[/x]` ≢ `φ`（xが自由な場合、正規化後も異なる）

### ストーリー計画

- UI変更なし（純粋ロジック層のみ）
