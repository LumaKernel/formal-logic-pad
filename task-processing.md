## 実行中タスク

**ソース:** `tasks/prd-inserted-tasks.md`

> ノード自体も、最初の公理などは編集できる対象になるので、編集できるようにしておこう。

### 周辺情報
- FI-008で FormulaEditor + CanvasItem の統合パターンは確立済み（FormulaNodeIntegration.stories.tsx）
- 現在の ProofTree.stories.tsx は読み取り専用のデモ（文字列をそのまま表示）
- 必要なこと: 再利用可能な ProofNode コンポーネントを作成し、FormulaEditor を使って編集可能にする
- ProofNode は logic-core の ProofNode 型（AxiomNode, ModusPonensNode, GeneralizationNode）と連携
- prd-formal-logic-pad.md の Phase 3 (US-019〜022) の前準備として、編集可能ノードコンポーネントを整備
