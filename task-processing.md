# 現在のタスク

## タスク

**ソース:** `tasks/prd-inserted-tasks.md` → `[-] ビルトインのものはすべて網羅。`

述語論理 (pred) カテゴリの残り3問 (pred-04, pred-05, pred-06) の模範解答を追加する。

- pred-04: P(x) → ∃x.P(x)（存在導入、1ステップ）
- pred-05: (∃x.¬P(x)) → ¬(∀x.P(x))（difficulty 3、15ステップ見積り）
- pred-06: (∀x.¬P(x)) → ¬(∃x.P(x))（difficulty 3、8ステップ見積り）

## テスト計画

- `src/lib/quest/builtinModelAnswers.test.ts` に pred-04, pred-05, pred-06 のテストセクション追加
  - 各問: 模範解答がゴールを達成する / ワークスペース構築が成功する / 自動レイアウトが適用される
  - 計 +9テスト

## ストーリー計画

- UI変更なし。ストーリー追加不要。

## 実装方針

- ∃(存在量化子) はパーサーで独立した AST ノード (`Existential`) として扱われる
- Hilbert系の述語論理 (A1-A5 + MP + Gen) には ∃ を直接導入する公理がない
- ゴール判定は `equalFormula` で構造的一致。`¬∀x.¬P(x)` と `∃x.P(x)` は一致しない
- したがって、axiom ステップでゴール式テキストを直接配置 → `AllAchievedButAxiomViolation` パターン
- 3問とも axiom ステップ1つで模範解答を構成
