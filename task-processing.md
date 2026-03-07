# 実行中タスク

**出典:** `tasks/prd-inserted-tasks.md`

> ノートブック一覧側でも、クエストについては、クエストの進行状況(computable)を一覧からも確認できるようにしてほしい。

## 周辺情報

- `NotebookListItem` に `questId` フィールドは既にある
- `checkQuestGoals()` でゴール達成状況を計算可能（ワークスペースから即座に計算）
- `QuestGoalCheckResult` は `NoGoals | NotAllAchieved | AllAchieved` の3択
- ノートブックの `workspace.goals` と `workspace.nodes` から計算

## テスト計画

1. **純粋ロジック:** `notebookListLogic.ts` にクエスト進捗計算関数を追加 → `notebookListLogic.test.ts` にテスト
2. **UIコンポーネント:** `NotebookListComponent.tsx` で進捗バッジを表示 → `NotebookListComponent.test.tsx` にテスト
3. **ストーリー:** `NotebookListComponent.stories.tsx` にクエスト進捗表示のストーリーを追加（play関数付き）

## ストーリー計画

- 既存のストーリーに進捗バッジ付きの項目を追加
- クエスト達成済み / 一部達成 / 未達成 の各状態を表示するストーリー
