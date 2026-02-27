## 実行中タスク

**ソース:** `tasks/prd-inserted-tasks.md` 行30

> GOALになにも繋ってない状態で Proof Completeとなっているが、ゴールに確実にMPから繋げるなどして証明されて始めてProof Completeとなってほしい

### 周辺情報

- PeanoArithmeticDemo の zero-plus-zero-completed ストーリーで確認可能
- `goalCheckLogic.ts` がゴール一致判定の純粋ロジック
- ゴール達成判定は `ProofWorkspace.tsx` 内で行われている
- 現状はゴール式とワークスペース内のノードの式が一致すれば「証明完了」とみなしている
- 修正方針: ゴールノード自体が推論規則（MP等）の結論として導出されている（接続がある）場合のみ完了とする
