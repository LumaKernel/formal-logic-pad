## 実行中タスク

**出典:** `tasks/inserted-tasks.md` - v8 ignore集約サブタスク

> `.../_unsafe` のようなフォルダに v8 ignore をすべき対象を集約する。
> このフォルダ自体はその近い関心の場所にローカルに作ってよい。が、なるべく数が少なくなるように、そして、ignoreしてしかるべきところがはっきりするように切り分ける。

### 今回の対象

`_unsafe` ユーティリティモジュール作成＋初期適用

### テスト計画

- `src/lib/_unsafe/unsafeLookup.test.ts` を新規作成
  - unsafeMapGet: 正常取得、undefined時throw
  - unsafeAssertDefined: 正常パスthrough、undefined/null時throw
- 既存テストがパスすることを確認

### ストーリー計画

- UI変更なし。ストーリー不要。

### 実装計画

1. `src/lib/_unsafe/unsafeLookup.ts` に以下を作成:
   - `unsafeMapGet<K, V>(map, key, context?)` — Map.get + undefined throw
   - `unsafeAssertDefined<T>(value, context?)` — null/undefined throw
2. vitest.config.ts に `src/lib/_unsafe/**` をcoverage除外追加
3. 適用先（初回）:
   - `referenceViewerLogic.ts` — 4箇所のdefensive v8 ignore
   - `goalPanelLogic.ts` — 1箇所のdefensive v8 ignore
