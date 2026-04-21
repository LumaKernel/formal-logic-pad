## 現在のタスク

**出典:** `tasks/reactflow-migration.md` - RF-003

> カスタム ProofNode コンポーネント

**今回集中するタスク:** React Flow の NodeProps を受け取り、Handle + EditableProofNode をレンダリングするカスタムノードコンポーネント

### テスト計画

- `proofNodeRFLogic.test.ts`: ConnectorPort → Handle props 変換の純粋ロジックテスト
- ストーリー: `ProofNodeRF.stories.tsx` で各ノード状態のストーリー + play 関数

### ストーリー計画

- Default: 公理ノード（root-axiom）
- Derived: 導出ノード
- Note: メモノード（ポートなし）
