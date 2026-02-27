## 現在のタスク

**出典:** `tasks/prd-inserted-tasks.md` Step 3

**タスク:** ProofNodeKind から "mp" / "gen" / "substitution" を削除

**サブタスク:**
- [ ] proofNodeUI.ts: ポート定義・スタイルのリファクタ
- [ ] nodeRoleLogic.ts: 分類ロジック更新
- [ ] dependencyLogic.ts: 依存追跡をInferenceEdge経由に変更
- [ ] テスト: 全exhaustive switchの更新

**背景:**
Step 2 で apply関数がハイブリッド方式（InferenceEdge + レガシー接続）に移行済み。
Step 3 では ProofNodeKind union から推論規則ノード種別を削除し、
推論規則はノードではなくエッジとして表現される新モデルに完全移行する。
