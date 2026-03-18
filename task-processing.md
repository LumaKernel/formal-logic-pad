## 実行中タスク

**出典:** `tasks/prd-non-hilbert.md` > シーケント計算 (SC) > シーケントの視覚的分解表示の改善

### タスク内容

シーケント（例: `φ, ψ ⇒ χ`）の表示を改善する。現在は単なるプレーンテキスト表示だが、以下を実現する:

- 各論理式を `FormulaDisplay` でシンタックスハイライト付きレンダリング
- ⊢ セパレータを視覚的に強調（サイズ・色）
- 前件と後件の視覚的グルーピング

### テスト計画

- `sequentDisplayLogic.test.ts`: 純粋ロジック（Sequent → 表示データ変換）のテスト
- 既存の `scProofTreeRendererLogic.test.ts` の更新（ProofTreeDisplayNode に Sequent データ追加）

### ストーリー計画

- `SequentDisplay.stories.tsx`: SequentDisplay コンポーネントの各種バリエーション（空、単一式、複数式、前件のみ、後件のみ）
- 既存の `ScProofTreePanel.stories.tsx` でハイライト表示を確認
