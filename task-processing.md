## 実行中タスク

**出典:** `tasks/inserted-tasks.md` — 親タスク「タブローの内部構造・レンダリング・編集UI」の続き

**タスク:** TabProofTreePanel のレンダリングを FormulaListDisplay に移行（シンタックスハイライト対応）

**コンテキスト:**

- ScProofTreePanel は SequentDisplay を使用
- AtProofTreePanel は SignedFormulaDisplay を使用
- TabProofTreePanel は現在プレーンテキスト（node.sequentText）で表示 ← ここを修正
- TabTreeDisplayNode には formulaTexts が既に含まれている

### テスト計画

- `TabProofTreePanel.test.tsx`: FormulaListDisplay がレンダリングされることを確認するテスト追加

### ストーリー計画

- `TabProofTreePanel.stories.tsx`: 既存ストーリーで FormulaListDisplay のレンダリングを確認（ブラウザスクリーンショット）
