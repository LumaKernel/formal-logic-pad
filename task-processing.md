## 現在のタスク

**出典:** `tasks/reactflow-migration.md` - RF-002

> workspaceState ↔ React Flow 変換アダプター

**今回集中するタスク:** WorkspaceState → React Flow Node[]/Edge[] 変換関数と逆変換関数の作成

### テスト計画

`reactFlowAdapter.test.ts` で全変換パスを網羅:

- ノード変換（位置、データ、種別 → RF Node）
- エッジ変換（接続 → RF Edge、ラベル、色）
- 逆変換（NodeChange[] → 位置更新）
- Viewport 変換（ViewportState ↔ RF Viewport）
- 境界ケース（空ワークスペース、孤立ノード）

### ストーリー計画

UI変更なし。純粋ロジックのみ。
