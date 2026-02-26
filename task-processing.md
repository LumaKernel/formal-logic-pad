## 実行中タスク

**ソース:** `tasks/prd-infinite-canvas-enhancements.md` - Tier 3.3 Level-of-Detail レンダリング

### タスク内容

- [ ] 低ズームレベルではノード内容を簡略表示（色付きブロックのみ等）
- [ ] axiom/derived/goal のステータスを色で区別

### 周辺情報

- Tier 3 の3.1(コマンドパレット)、3.2(ノード複製・コピペ)は完了済み
- 現在のProofWorkspace/EditableProofNodeの構造を活用
- proofNodeUI.ts にスタイル純粋ロジックが既にある
- nodeRoleLogic.ts にNodeRole/NodeClassificationが定義済み
