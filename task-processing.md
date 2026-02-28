# 実行中タスク

**出典:** `tasks/prd-inserted-tasks.md`

**タスク:** derivedというのも、コネクションの結果としてそのようにcomputedなものとして見れるというだけで、内部的にそれを管理する必要はない。ノードそのものは単なるformulaでしかなく。コネクションの状況でderivedになるだけだ、としよう。

**周辺コンテキスト:**
- 関連タスク: MP適用コネクション削除時の挙動修正、ゴールのサイドパネル化、ノードマージ機能
- 現在の`NodeRole`は"axiom"|"goal"、`NodeClassification`は"root-axiom"|"root-goal"|"root-unmarked"|"derived"
- `workspaceState.ts` にピュアロジック、`ProofWorkspace.tsx` にUI
- `nodeRoleLogic.ts` でノード分類の純粋ロジック
