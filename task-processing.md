タスク: predicate-advanced カテゴリ追加 + Q-33, Q-34 クエスト実装
ソース: tasks/prd-logic-pad-world.md (クエストモード), dev/quest-problems/05-predicate-advanced.md

## 周辺情報

- Q-33: 全称量化子と含意の交換 `(all x. (P(x) -> Q(x))) -> ((all x. P(x)) -> (all x. Q(x)))` (Level 4, ~15 steps)
  - Q-26/Q-29 と同一の定理
- Q-34: 存在量化子の否定 `~(ex x. P(x)) -> all x. ~P(x)` (Level 4, ~18 steps)
  - 二重否定除去で証明可能

## テスト計画

- builtinQuests.test.ts: predicate-advanced カテゴリのクエスト数テスト追加
- builtinModelAnswers.test.ts: pred-adv-01, pred-adv-02 の模範解答テスト（自動生成で追加される）
- questDefinition.test.ts: カテゴリ数の更新

## ストーリー計画

- UI変更なし（既存のクエストカタログUIに自動的に表示される）
