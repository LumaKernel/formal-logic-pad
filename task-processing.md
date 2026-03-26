# 現在のタスク

**出典:** `tasks/inserted-tasks.md`

## 対象タスク

- [ ] カット除去など一部のクエストは、デフォルトの状態を持てるようにしてもよいだろう。
  - 集中するサブタスク: QuestDefinition に initialState を追加し、createQuestWorkspace でノード・エッジを事前配置できるようにする

## コンテキスト

- `WorkspaceGoal.allowedRuleIds` は既に実装済み（サブタスク「ゴールの各論理式は使っていい規則を持つ」は完了）
- 現状 `createQuestWorkspace` は空のワークスペースを生成する（nodes: [], connections: [], inferenceEdges: []）
- カット除去クエストでは、カットを使った証明が初期状態として配置され、カットなしで再証明する形式が必要

## テスト計画

- `workspaceState.test.ts`: `createQuestWorkspace` に initialState を渡した場合のテスト
  - ノードが事前配置されること
  - InferenceEdgeが事前配置されること
  - コネクションが事前配置されること
  - nextNodeId が正しく設定されること
  - ゴールも正しく設定されること
- `questDefinition.test.ts` (既存): QuestDefinition 型の変更に伴うテスト（もし必要なら）

## ストーリー計画

- UI変更なし（データ層のみ）。ストーリー追加不要。

## 実装計画

1. `QuestInitialNode` / `QuestInitialState` 型を定義
2. `QuestDefinition` に `initialState?: QuestInitialState` を追加
3. `createQuestWorkspace` を拡張して initialState がある場合にノード・エッジ・コネクションを配置
4. テスト追加
5. `notebookState.ts` の `createNotebookFromQuest` で initialState を渡すように修正
