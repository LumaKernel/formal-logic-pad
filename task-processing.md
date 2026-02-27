## 実行中タスク

**出典:** `tasks/prd-inserted-tasks.md` Step 1

> Step 1: WorkspaceState への InferenceEdge 統合（データモデル拡張）
>
> - WorkspaceState に inferenceEdges フィールドを追加（オプショナル、段階移行用）
> - revalidateInferenceConclusions を InferenceEdge ベースに移行
> - addNode/removeNode/addConnection/removeConnection で inferenceEdges も同期
> - テスト: 既存テストが全て通ることを確認しつつ新フィールドのテスト追加
