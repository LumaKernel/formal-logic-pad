# 現在のタスク

**元ファイル:** `tasks/prd-inserted-tasks.md`
**タスク:** ビルトインのものはすべて網羅。→ group-basics (group-01〜group-06) + group-proofs (group-07〜group-08) の模範解答を追加する

## 周辺情報

- group-01〜group-06: 直接公理配置（1ステップ）
- group-07: G2L + A4∀消去 + MP（3ステップ）
- group-08: G3L + A4∀消去 + MP（3ステップ）
- peanoと同じパターンで実装可能

## テスト計画

- `builtinModelAnswers.test.ts` に group-01〜group-08 のテストが自動追加される（既存の `it.each` パターンで全模範解答をテスト済み）
- 新規テストファイル不要。`builtinModelAnswers` 配列に追加するだけで既存テストが網羅

## ストーリー計画

- UI変更なし。ストーリー追加不要。
