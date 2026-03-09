# 実行中タスク

**出典:** tasks/prd-inserted-tasks.md
**タスク:** MP適用などのモーダルの、論理式入力のところは、論理式入力のための共通UIを利用する。基本すべての箇所において、phi -> phi とかのままではなく、編集から離れたら render されるように共通化されるべき

## 調査結果

EdgeParameterPopoverの代入入力は既にFormulaInput/TermInputを使用済み。
残る問題箇所:

1. **AxiomPalette.tsx:169** - `axiom.unicodeDisplay` をプレーンテキストで表示。FormulaDisplayに置き換え
2. **EditableProofNode.tsx:268, 276** - 代入エントリのパース失敗時に `<span>{entry.formulaText}</span>` でraw text
3. **GoalPanel.tsx:220** - ゴール数式パース失敗時にraw text fallback

## テスト計画

- AxiomPalette.test.tsx: FormulaDisplay/FormulaKaTeX のレンダリングを確認するテスト更新
- EditableProofNode.test.tsx: 代入エントリ表示のテスト確認（既存テストの期待値更新）
- GoalPanel.test.tsx: ゴール表示のテスト確認（既存テストの期待値更新）

## ストーリー計画

- 既存のAxiomPaletteストーリーでKaTeX表示が確認できるか検証
- EditableProofNode既存ストーリーで代入表示確認
- GoalPanel既存ストーリーでゴール表示確認
- Playwright MCPでブラウザスクリーンショット撮影
