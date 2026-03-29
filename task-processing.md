# 実行中タスク

**ソース:** `tasks/inserted-tasks.md`

## タスク

- [-] 各ゴールは使っていい公理と共に定義される（allowedAxiomIds の設定）
  - pred-adv-11 で「関係のない公理が使われているがprovedになる」バグの修正

## コンテキスト

- `QuestGoalDefinition.allowedAxiomIds` は型レベルで既に存在
- `questCompletionLogic.ts` の `computeViolatingAxiomIds` で違反検出ロジックも完備
- UI表示（GoalPanel）も実装済み
- **問題:** `builtinQuests.ts` で一つも `allowedAxiomIds` が設定されていない
- pred-adv-11 の模範解答は A1, A2, A5 を使用（A3, A4, CONJ-DEF, DISJ-DEF は不要）

## テスト計画

- `questCompletionLogic.test.ts` に pred-adv-11 の allowedAxiomIds 違反検出テストを追加
- 既存のストーリー `QuestCompletePredAdv11ModelAnswer` で正常系が動作することを確認

## ストーリー計画

- 既存ストーリーの動作確認のみ（新規ストーリー不要）

## 方針

1. すべてのヒルベルト流クエストについて、模範解答で使用される公理を特定し `allowedAxiomIds` を設定する
2. 他の流派（ND/SC/TAB/AT）については、既存の `allowedRuleIds`/`disallowedScRuleIds` で同様の制御が可能だが、今回はヒルベルト流のみ対象
3. まず pred-adv-11 を修正し、パターンを確立してから他のクエストに展開
