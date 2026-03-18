# PRD: 非Hilbert体系のUI/UX完全性

## 残タスク

### シーケント計算 (SC)

- [x] シーケントの視覚的分解表示の改善 — SequentDisplay コンポーネント追加。FormulaDisplay でハイライト、⇒ セパレータ強調、ScProofTreePanel/EditableProofNode に統合

### タブロー法 (TAB)

- [x] 証明木/反駁木の視覚的フロー表示 — TabProofTreePanel コンポーネント追加。タブロースタイル上→下表示、分岐、閉枝×/開枝○マーカー、ProofWorkspace統合
- [x] 閉鎖枝の視覚的フィードバック — 上記で同時実装。BS/⊥公理で×マーカー（赤）、未閉鎖枝は○マーカー（緑）

### 分析的タブロー (AT)

- [x] 符号付き式の視覚的表示改善 — SignedFormulaDisplayコンポーネント追加。T=緑バッジ/F=赤バッジ + FormulaDisplayハイライト。EditableProofNode統合
- [x] 証明木/反駁木の視覚的フロー表示 — AtProofTreePanelコンポーネント追加。タブロースタイル上→下表示、α/β/γ/δ規則対応、β分岐、閉枝×/開枝○マーカー、SignedFormulaDisplay統合、ProofWorkspace統合
