## 実行中タスク

**出典:** prd-logic-pad-world.md (クエストモード拡充の一環として)

`createQuestNotebook` の `questVersion` パラメータの動作テスト追加、Funcsカバレッジがv8 artifactであることの確認・記録

### 背景

- 現在 Funcs 89.07%。調査の結果、公開APIは全てテスト済みで、Funcsの低さはv8カバレッジ集約のartifact
- `createQuestNotebook` の `questVersion` パラメータに関するテストが欠けている
- interpreterTypes.ts の Funcs 0% は型定義のみのファイルなので正常

### テスト計画

- `src/lib/notebook/notebookState.test.ts` に `questVersion` テストケースを追加
  - `questVersion` が正しく保存されること
  - `questVersion` なしの場合 undefined であること

### ストーリー計画

- UI変更なし
