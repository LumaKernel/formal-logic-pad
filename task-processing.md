## 現在のタスク

**出典:** `tasks/prd-extra-nd-workspace.md`

- [-] **ND-001: 現状のND起動ブロッカー調査** (調査完了)
- [-] **ND-005: questStartLogicのND対応** (実装中)

### このイテレーションのスコープ

1. questStartLogic.ts で ND 体系のクエスト起動を許可する（style !== "hilbert" ブロッカー解除）
2. workspaceState.ts の WorkspaceState が DeductionSystem を保持できるようにする
3. ProofWorkspace が ND 体系を受け取り、最低限クラッシュせずに表示できるようにする
4. ND 用の推論規則パレット（AxiomPalette を ND 規則で表示）
5. ND クエストが起動・表示されることをテストで確認

### 調査結果 (ND-001)

- **主ブロッカー:** questStartLogic.ts:58 `style !== "hilbert"` チェック
- **workspaceState.ts:** `system: LogicSystem` → DeductionSystem 対応が必要
- **axiomPaletteLogic.ts:** ND 規則一覧を返す関数が必要
- **ProofWorkspace.tsx:** system.generalization 等の Hilbert 前提ガード必要
- **naturalDeduction.ts/deductionSystem.ts:** ND ロジック自体は完成済み
