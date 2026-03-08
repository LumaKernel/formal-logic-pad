## 実行中タスク

from: `tasks/prd-logic-pad-world.md` - クエストモード拡充

### タスク

SC体系の量化子クエスト4問追加（sc-27〜sc-30）

- sc-27: LJ: 全称消去 (∀⇒) - `∀x.P(x) → P(a)` (difficulty 1)
- sc-28: LJ: 存在導入 (⇒∃) - `P(a) → ∃x.P(x)` (difficulty 1)
- sc-29: LJ: 全称から存在 - `∀x.P(x) → ∃x.P(x)` (difficulty 2)
- sc-30: LJ: 全称量化子の交換 - `∀x.∀y.P(x,y) → ∀y.∀x.P(x,y)` (difficulty 3)

### テスト計画

- `builtinQuests.test.ts`: クエスト総数更新 (163→167)
- `builtinModelAnswers.test.ts`: 新4クエストの模範解答テストが自動追加される

### ストーリー計画

- UI変更なし（既存のQuestCatalogComponentで表示される）
- ブラウザでQuestCatalogストーリーのスクリーンショットを撮影して確認
