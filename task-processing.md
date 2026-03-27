## 実行中タスク

**出典:** `tasks/inserted-tasks.md`

- [-] const-map を v1.2.0に更新する。バグは解消されているので、return with return typeが適合する場所は置き換える。

### コンテキスト

- 現在 `@luma/const-map` は `^1.1.0`
- 使用箇所: `src/lib/script-runner/workspaceBridge.ts` の `scTagToRuleName` のみ
- v1.2.0 で `makeConstMapWithReturnType` のバグが修正されている
- 値が全て `string` なので `makeConstMapWithReturnType<string>()` に置き換え可能

### テスト計画

- 既存の `workspaceBridge.test.ts` がカバー済み。新規テスト不要
- CI で typecheck/lint/test 確認

### ストーリー計画

- UI変更なし。ストーリー変更不要
