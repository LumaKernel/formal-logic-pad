# 現在のタスク

## タスク (from: tasks/prd-scripted-proof-rewriting.md)

カット除去の実装クエストノートを実現できるように、ゴールは、使用できる規則についても規定できるようにすることで、デフォルトでカットありの証明を(そこそこの大きさのもので)提示しつつ、それのカット無し版への変換をゴールとして取り組めるようにできるだろう。

## 周辺情報

- 現状、ゴールには `allowedAxiomIds` で公理の制限は可能だが、推論規則（MP, Gen, Subst, ND各種, SC各種, TAB各種, AT各種）の制限はできない
- `InferenceEdge` の `_tag` が推論規則の識別子として機能している
- 公理制限の実装パターン（`dependencyLogic.ts` の `getNodeAxiomIds` → `questCompletionLogic.ts` の `computeViolatingAxiomIds`）を推論規則にも適用する

## テスト計画

- `dependencyLogic.test.ts`: `getNodeInferenceRuleIds` 関数のテスト追加（Hilbert/ND/SC/TAB/AT各系で使用される規則IDの収集を検証）
- `questCompletionLogic.test.ts`: `allowedRuleIds` による規則制限チェックのテスト追加（`AllAchievedButRuleViolation` 結果の検証）

## ストーリー計画

- UI変更なし（純粋ロジック層の拡張のみ）。UIでの規則制限表示は将来タスク。

## 実装計画

1. `inferenceEdge.ts` に `InferenceRuleId` 型を定義（全 `_tag` 値のunion）
2. `dependencyLogic.ts` に `getNodeInferenceRuleIds` 関数を追加（`getNodeAxiomIds` と同様のパターンで、ノードの証明チェーンで使用されている推論規則IDを収集）
3. `workspaceState.ts` の `QuestGoalDefinition` と `WorkspaceGoal` に `allowedRuleIds?: readonly InferenceRuleId[]` を追加
4. `createQuestWorkspace` で `allowedRuleIds` を転送
5. `questCompletionLogic.ts` に規則制限チェックを追加:
   - `GoalAxiomCheckResult` を `GoalCheckResult` に拡張して `usedRuleIds` / `violatingRuleIds` を含む
   - `AllAchievedButRuleViolation` 結果を追加（または既存の `AllAchievedButAxiomViolation` を汎用化）
   - `computeViolatingRuleIds` 関数を追加
6. テスト追加
7. `index.ts` のエクスポート更新
