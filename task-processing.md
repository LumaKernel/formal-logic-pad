## 現在のタスク

**ND-003: ND用公理パレットの実装** (from `tasks/prd-extra-nd-workspace.md`)

- NDでは公理パレットの代わりに推論規則パレットが必要
- 仮定の導入UIの設計

### 周辺情報

- `getAvailableNdRules()` は既に `axiomPaletteLogic.ts` に実装・テスト済み
- `NdRulePaletteItem` 型も定義済み
- AxiomPalette.tsx をテンプレートにして NdRulePalette.tsx を作成
- ProofWorkspace.tsx で `deductionSystem.style` に基づいてパレットを切り替え
- ND規則はエッジ（ノードではない）なので、クリック時の動作はHilbertと異なる
  - ND-003では仮定の導入（ノード追加）+ 規則選択UIを提供
  - 規則適用の実際のバリデーションはND-004で対応
