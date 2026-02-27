## 現在のタスク

**出典:** `tasks/prd-inserted-tasks.md` Step 5

- [ ] Step 5: シリアライゼーション移行
  - [ ] workspaceExport.ts: InferenceEdge のJSON化
  - [ ] notebookSerialization.ts: 既存データからの移行パス
  - [ ] テスト: 旧フォーマットの読み込み互換性

### 周辺情報

- Step 1-4 で InferenceEdge がデータモデルに統合され、ProofNodeKind が 3種（axiom/derived/conclusion）に簡素化済み
- 接続線上に推論規則バッジ表示が完了済み
- workspaceExport.ts と notebookSerialization.ts が主な変更対象
