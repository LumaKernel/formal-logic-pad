## 実行中タスク

**出典:** `tasks/prd-logic-pad-world.md` - クエストモード的な形で、基礎を学んだり、問題形式で進めることができる

### SC量化子クエスト拡充（sc-31〜sc-34）

LJ/LK体系の量化子クエストを4問追加。∃⇒（存在除去）規則の練習と、LK固有の古典量化子等価性を含む。

#### 追加クエスト

1. **sc-31: LJ 存在除去 (∃⇒)** (difficulty 2)
   - ゴール: `exists x. (P(x) and Q(x)) -> exists x. P(x)`
   - 学習ポイント: ∃⇒規則で存在量化子を除去し、固有変数条件を満たす
   - 推定ステップ: 5

2. **sc-32: LJ 存在量化子の分配** (difficulty 3)
   - ゴール: `exists x. (P(x) or Q(x)) -> exists x. P(x) or exists x. Q(x)`
   - 学習ポイント: ∃⇒と∨⇒の組合せ、各分岐で⇒∃を適用
   - 推定ステップ: 8

3. **sc-33: LK 否定全称から存在否定** (difficulty 3)
   - ゴール: `not (all x. P(x)) -> exists x. not P(x)`
   - 学習ポイント: LK固有の右辺複数式を活用した古典量化子等価性
   - 推定ステップ: 6
   - 体系: sc-lk

4. **sc-34: LJ 全称と含意の分配** (difficulty 2)
   - ゴール: `all x. (P(x) -> Q(x)) -> (all x. P(x) -> all x. Q(x))`
   - 学習ポイント: ∀⇒と⇒∀の組合せ、含意の構造的分解
   - 推定ステップ: 6

### テスト計画

- `builtinQuests.test.ts`: クエスト数を 179 → 183 に更新
- 模範解答テストは自動生成（builtinModelAnswers.test.ts で全クエストの模範解答を検証）

### ストーリー計画

- UI変更なし（クエストデータ追加のみ）。既存のQuestCatalogComponent.stories.tsxで表示確認
- ブラウザでスクリーンショット確認
