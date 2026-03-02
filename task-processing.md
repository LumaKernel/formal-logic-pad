## 現在のタスク

**ソース:** `tasks/prd-inserted-tasks.md`
**タスク:** ゴールの数式がレンダーされていない。基本すべてレンダーせよ。他にもあれば統一せよ

### 周辺情報

GoalPanel.tsx (line 185) で `item.formulaText` をプレーンテキストとして表示している。
`FormulaDisplay` コンポーネントを使って、パースされた数式をUnicode表示にする。

### テスト計画

- `GoalPanel.test.tsx`: FormulaDisplayで描画された場合、`role="math"` でテキストを検証するように更新
- `goalPanelLogic.test.ts`: `GoalPanelItem` に `formula` フィールドが追加されることの検証

### ストーリー計画

- ProofWorkspace.stories.tsx: 既存のWith Goal, Quest Modeストーリーでゴール式が描画されていることを確認
- 新規ストーリーは不要（既存ストーリーで確認可能）

### 実装計画

1. `goalPanelLogic.ts`: `GoalPanelItem` に `formula: Formula | undefined` を追加。`computeGoalPanelData` でパース結果を含める
2. `GoalPanel.tsx`: `FormulaDisplay` を使ってレンダリング。パースエラー時はフォールバックで `formulaText` を表示
3. テスト更新
