# 現在のタスク

from: `tasks/prd-inserted-tasks.md`

> Step 0: InferenceEdge 型定義と変換ユーティリティ（既存ノードベース→エッジベース変換の純粋関数）

## 周辺情報

親タスク: `MPなどの推論規則系統は、ノードとして表われるのではなく、エッジ、ノード間の関係性として表現されるように再整理が必要だろう。`

## 方針

段階的移行の第一歩。既存のコードに一切の破壊的変更を加えず、新しい型定義と「既存データからの抽出関数」だけを追加する。

1. InferenceEdge 型（MPEdge / GenEdge / SubstitutionEdge）をworkspaceState.tsに定義
2. extractInferenceEdges: 既存のノード+接続からInferenceEdgeを抽出する純粋関数
3. テスト: extractInferenceEdgesの単体テスト

既存のWorkspaceState型やロジックには変更を加えない（additive only）。
