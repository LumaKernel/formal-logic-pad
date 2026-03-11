# 実行中タスク

**出典:** `tasks/prd-my-tasks-improved.md`

> 目安ステップ数は自作だと感覚が難しいので、指定なしでもいいようにして、デフォルトでは指定なしにしよう。

## テスト計画

- `customQuestEditLogic.test.ts`: バリデーションテスト更新（空文字列が許可される、undefinedが正しく扱われる）
- `customQuestState.test.ts`: estimatedStepsがundefinedのカスタムクエスト作成・更新テスト
- `QuestCatalogComponent.test.ts` or stories: stepCountTextのundefined対応テスト

## ストーリー計画

- `CustomQuestListComponent.stories.tsx`: estimatedStepsなしのクエスト表示ストーリー確認

## 実装計画

1. `questDefinition.ts`: `estimatedSteps: number` → `estimatedSteps: number | undefined`
2. `customQuestEditLogic.ts`:
   - EditFormValuesのデフォルト値を`""` (空文字列)に変更
   - バリデーションで空文字列をエラーではなくundefinedとして許可
   - `questToEditFormValues`でundefined→`""`の変換
3. `customQuestState.ts`:
   - `CreateCustomQuestParams`の`estimatedSteps`をoptionalに
   - シリアライゼーション/デシリアライゼーションでundefined対応
4. `QuestCatalogComponent.tsx`: `stepCountText`でestimatedStepsがundefinedの場合の表示
5. `CustomQuestListComponent.tsx`: フォーム・表示のundefined対応
6. ビルトインクエストは常にestimatedStepsを持つので変更不要
