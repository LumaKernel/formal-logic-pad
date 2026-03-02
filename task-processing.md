# 現在のタスク

**出典:** `tasks/prd-inserted-tasks.md` — ビルトインのものはすべて網羅（模範解答）

## タスク

PEANO カテゴリ 12 問の模範解答を追加する（peano-01 〜 peano-12）

### 周辺情報

- peano-01〜06: 公理配置のみ（PA1〜PA6, E1 の完全一致）
- peano-07: `0 + 0 = 0` — PA3 + A4(x→0) + MP
- peano-08: `S(0) + 0 = S(0)` — PA3 + A4(x→S(0)) + MP
- peano-09: `0 * 0 = 0` — PA5 + A4(x→0) + MP
- peano-10: `~(S(0) = 0)` — PA1 + A4(x→0) + MP
- peano-11: `S(0) + S(0) = S(S(0))` — PA3, PA4, E3 の組み合わせ（最も複雑）
- peano-12: Robinson 算術 Q7 配置のみ
- 既存フレームワーク（axiom + mp ステップ）で全問対応可能

## テスト計画

- `src/lib/quest/builtinModelAnswers.test.ts` に peano セクションを追加
  - 各問の「模範解答がゴールを達成する」テスト
  - 各問の「ワークスペース構築が成功する」テスト
  - 各問の「自動レイアウトが適用される」テスト

## ストーリー計画

- UI 変更なし（データのみの追加）

## 実装手順

1. `builtinModelAnswers.ts` に PEANO 12 問の模範解答を追加
2. `builtinModelAnswers.test.ts` に PEANO テストセクションを追加
3. テスト実行・カバレッジ確認
