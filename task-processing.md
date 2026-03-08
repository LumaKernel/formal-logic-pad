## 実行中タスク

`tasks/prd-logic-pad-world.md` より — クエスト追加

### タスク内容

述語論理の上級クエストを2問追加する（pred-adv-05, pred-adv-06）。

- pred-adv-05: `(∃x.P(x)) → ¬(∀x.¬P(x))` — 存在から全称否定の否定
- pred-adv-06: `(∀x.P(x)) → (∃x.P(x))` — 全称から存在への含意（空でない領域の仮定を含む）

### テスト計画

- `builtinQuests.test.ts`: クエスト数を 147 → 149 に更新、ゴール式テキストのパーステスト
- `builtinModelAnswers.test.ts`: predicate-advanced ブロックに 2 問分のテストケース追加
- `questDefinition.test.ts`: カテゴリ数変更なし（predicate-advanced は既存）

### ストーリー計画

- UI 変更なし（データ追加のみ）。ストーリー追加不要。
