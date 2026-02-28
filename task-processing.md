## 現在のタスク

**ソース:** `tasks/prd-effect-ts.md` - ET-010

**タスク:** ET-010: quest のゴールチェック検証を Effect パイプラインに

**対象ファイル:**
- `src/lib/quest/questCompletionLogic.ts` — `checkQuestGoals()`, `checkQuestGoalsWithAxioms()`
- `src/lib/quest/questCompletionLogic.test.ts`

**変換方針:**
- 複数ゴールの検証を `Effect.all` で並列実行
- 公理制約チェックを `Effect.gen` で逐次実行（前のチェック結果に依存）
- エラー蓄積が必要な場合は `Effect.all({ mode: "either" })` を使用

**手順:**
1. `checkQuestGoals` を `Effect.gen` に変換
2. `checkQuestGoalsWithAxioms` を `Effect.gen` に変換
3. 互換性ラッパー（Sync版）を提供
4. テスト更新、通過確認
