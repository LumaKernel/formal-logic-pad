## 実行中タスク

**出典:** `tasks/prd-inserted-tasks.md` 行3-4

**タスク:** FormulaDisplay ストーリーに phi[tau/x] (FormulaSubstitution) と phi[/x] (FreeVariableAbsence) の表示例を追加する

### 周辺情報

- FormulaDisplay.stories.tsx に現在8ストーリーあるが、substitution系のストーリーがない
- FormulaSubstitution / FreeVariableAbsence は formula.ts で定義済み
- formatUnicode.ts で `formula[term/variable]` 形式のレンダリング実装済み
- formulaHighlight.ts で substitution トークンのハイライト実装済み

### テスト計画

- FormulaDisplay.stories.tsx に新ストーリー追加（play関数付き）:
  - SubstitutionDisplay: phi[tau/x] の基本表示
  - FreeVariableAbsenceDisplay: phi[/x] の表示
  - SubstitutionWithHighlight: シンタックスハイライト付き substitution 表示
- 既存のユニットテストは formatUnicode.test.ts にあるはず。ストーリーのplay関数でUI表示を検証

### ストーリー計画

- FormulaDisplay.stories.tsx に3つのストーリーを追加
