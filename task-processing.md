## 実行中タスク

**出典:** `tasks/prd-non-hilbert.md` > 分析的タブロー (AT) > 証明木/反駁木の視覚的フロー表示

### テスト計画

- `atProofTreeRendererLogic.test.ts`: 純粋ロジックテスト
  - 単一ノード（ルートのみ、開枝）
  - α規則（1結論、2結論 — 同一枝上）
  - β規則（分岐 — 左右2枝）
  - γ規則（全称代入 — 1結論）
  - δ規則（固有変数 — 1結論）
  - closure（閉枝）
  - 完全な証明ツリー（全枝閉鎖）
  - ルート検出（findAtTreeRoots）
  - 統計計算（computeAtTreeStats）
  - 非ATエッジの無視

### ストーリー計画

- `AtProofTreePanel.stories.tsx`:
  - ClosureOnly: 単一closure
  - AlphaChain: α規則チェーン
  - BetaBranching: β分岐（片枝closed、片枝open）
  - CompleteProof: 完全証明（全枝閉鎖）
  - Empty: ATエッジなし
  - すべてplay関数付き

### 実装方針

TabProofTreePanelパターンに従い:

1. `atProofTreeRendererLogic.ts` — TAB版を基に、AT固有のエッジ構造に対応
   - α規則: resultNodeId + secondResultNodeId（同一枝上の1-2子ノード）
   - β規則: leftResultNodeId + rightResultNodeId（分岐）
   - γ/δ規則: resultNodeId（1子ノード）
   - closure: 子なし、closed状態
2. `AtProofTreePanel.tsx` — SignedFormulaDisplay統合で署名付き式をハイライト表示
3. `ProofWorkspace.tsx` — analytic-tableau体系で表示
