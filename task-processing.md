from: prd-logic-pad-world.md (カバレッジ改善・インフラ修正)

## タスク

Vitest 4 の poolOptions 非推奨警告を修正し、ワーカータイムアウトを解消する

## テスト計画

- vitest.config.ts の pool 設定を Vitest 4 互換に修正
- `maxForks` → `maxWorkers` への移行
- `.local.` テストファイルを除外して安定性向上
- 全テスト実行でタイムアウトなし・カバレッジ改善を確認

## 結果

- poolOptions → maxWorkers に修正: 14件のワーカータイムアウトが解消
- テスト: 262 passed → 275 passed (タイムアウトしていた13ファイルが正常実行)
- カバレッジ: Stmts 98.6% → 99.98%, Branch 96.65% → 99.46%
