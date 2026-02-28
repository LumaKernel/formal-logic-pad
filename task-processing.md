## 現在のタスク

**ソース:** `tasks/prd-effect-ts.md` ET-003

**タスク:** ET-003: unification の内部を `Effect.gen` で整理

**周辺情報:**

- 前提: ET-001完了済み（エラー型が `Data.TaggedError` ベース）
- `unifyFormulas` と内部ヘルパーを `Effect.gen` に変換
- `unifyFormulasSync` 互換ラッパーを提供
- テストは `Effect.runSync(Effect.either(...))` でラップ
- 呼び出し元（`inferenceRule.ts` 等）が壊れていないことを確認
