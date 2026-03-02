# 実行中タスク

**元ファイル:** `tasks/prd-inserted-tasks.md`

**タスク:** ビルトインのものはすべて網羅 — predicate 論理 6 問の模範解答を追加

## 周辺情報

- 模範解答全体進捗: 54/115問完了（PROP全34 + PEANO全12 + GROUP全8）
- 残り61問: predicate(6), nd(23), tab(10), at(7), sc(15)
- 今回: predicate 6問を追加

## テスト計画

- `src/lib/quest/builtinModelAnswers.test.ts` に predicate セクションのテストを追加
- 既存のテストパターン（模範解答がゴールを達成する / ワークスペース構築が成功する / 自動レイアウトが適用される）に従う

## ストーリー計画

- UI変更なし（模範解答データのみ）
