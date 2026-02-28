# 現在のタスク

## ソース: `tasks/prd-inserted-tasks.md`

### タスク

> ゴールも、ゴールノードではなく、サイドパネルや一覧が提示されていて、それをキャンバスのどこかで、（使っていい公理だけで）証明されればゴールということにして、公理だとかゴールだとか言う内部ステートもやめよう。

### このイテレーションのスコープ

大きなリファクタリングなので段階的に進める。このイテレーションでは **Step 1: ゴールをノードから分離する純粋ロジック層の変更** を行う。

具体的には:

1. `WorkspaceState`に`goals`配列を追加（ノードとは独立したゴールデータ）
2. ゴール達成判定を「キャンバス上のどこかの証明済みノードの式がgoals配列のゴール式と一致するか」に変更
3. `NodeRole`から`"goal"`を削除し、roleフィールド自体を廃止
4. `NodeClassification`から`"root-goal"`を削除
5. クエストゴールも`goals`配列で管理するように変更
6. 既存テストの更新

### 周辺情報

- 現在のゴール管理: `WorkspaceNode.role === "goal"` + `protection === "quest-goal"` + `allowedAxiomIds`
- ゴール判定: `checkGoal()` が role="goal" ノードを探して incoming node の式と比較
- クエスト判定: `checkQuestGoalsWithAxioms()` が protection="quest-goal" ノードの式と公理制約をチェック
- UI: `EditableProofNode.tsx` のバッジでROOT→AXIOM→GOALサイクル
- 影響ファイル: nodeRoleLogic.ts, goalCheckLogic.ts, questCompletionLogic.ts, workspaceState.ts, proofNodeUI.ts, EditableProofNode.tsx, ProofWorkspace.tsx, questStartLogic.ts
