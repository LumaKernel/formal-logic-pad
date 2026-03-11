## 実行中タスク

**出典:** `tasks/prd-syntax-highlight.md`

> 論理式(スキーム)のレンダーについて、各領域のシンタックスハイライティングをしてあげよう。
> 項はこの色、項のメタ変数は、変数のメタ変数は、添字は、論理素子は、関数の実態(Sとか)は、を決めていく

### スコープ

FormulaDisplay（Unicode表示）のシンタックスハイライト機能を追加する。
KaTeX 版のハイライトは後続タスクとする。

### テスト計画

- `src/lib/logic-lang/formulaHighlight.test.ts` — 新規: 純粋関数 `tokenizeFormula` のユニットテスト
  - 各 AST ノードタイプが正しいトークン種別に分類されること
  - 括弧・スペースが正しい位置に入ること
  - 複合式でのネスト処理
- `src/lib/formula-input/FormulaDisplay.test.tsx` — 既存: `highlight={true}` 時のレンダリングテスト追加

### ストーリー計画

- `src/lib/formula-input/FormulaDisplay.stories.tsx` — 既存ストーリーに highlight バリアント追加

### 設計

1. **トークン型定義** (`formulaHighlight.ts`)
   - `FormulaTokenKind`: "connective" | "quantifier" | "variable" | "metaVariable" | "predicate" | "function" | "constant" | "subscript" | "equality" | "punctuation" | "negation" | "substitution"
   - `FormulaToken`: `{ text: string; kind: FormulaTokenKind }`
   - `tokenizeFormula(formula): FormulaToken[]` — AST → トークン配列（括弧・スペース含む）
   - `tokenizeTerm(term): FormulaToken[]` — 項用

2. **CSS変数** (`globals.css`)
   - `--color-syntax-connective`, `--color-syntax-quantifier`, `--color-syntax-variable`, etc.
   - ライト/ダーク両対応

3. **FormulaDisplay 拡張**
   - `highlight?: boolean` プロパティ追加
   - `highlight=true` 時: `tokenizeFormula` → `<span>` 配列レンダリング
   - `highlight=false`（デフォルト）: 既存の `formatFormula` → 単一テキスト
