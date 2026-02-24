## 実行中タスク

**出典:** `tasks/prd-formula-input-component.md` FI-001

> FI-001: Unicode論理式レンダラー — `<FormulaDisplay formula={ast} />` コンポーネントを作成

### 周辺情報

- `src/lib/formula-input/` ディレクトリに配置
- Logic Lang の `formatUnicode()` を使用してAST→Unicode変換
- 論理記号（→, ∧, ∨, ¬, ∀, ∃）と添字（₀₁₂...）を正しく表示
- フォントサイズ・色をpropsで調整可能
- Storybookストーリー + play関数でレンダリング結果を検証
