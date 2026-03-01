# 実行中タスク

## タスク (from: tasks/prd-logic-pad-world.md)

`[ ] 大きなゴールのひとつはカット除去定理を遂行すること。実装をサポートしてもらいながら実際にカット除去定理まで学べたらいい`

### 周辺情報

- シーケント計算のプリセット（sc-lm, sc-lj, sc-lk）は既に `notebookCreateLogic.ts` に存在
- `CutEliminationStepper` コンポーネントは独立して実装済み（`cutEliminationStepperLogic.ts`）
- 現状のクエストシステムにはシーケント計算カテゴリが存在しない
- ProofWorkspace.tsx には sequent-calculus 用の規則パレットUIが未実装
- **このイテレーションのスコープ**: sc-basics カテゴリとシーケント計算基礎クエスト定義の追加（UIは別イテレーション）

### テスト計画

- `src/lib/quest/questDefinition.test.ts` — カテゴリ数の更新、sc-basics の findCategoryById テスト
- `src/lib/quest/builtinQuests.test.ts` — クエスト数の更新、sc-basics カテゴリのクエスト検証
- `src/lib/quest/questCatalogListLogic.test.ts` — カテゴリフィルタリングにsc-basicsが含まれることの確認（既存テスト）

### ストーリー計画

- UI変更なし（データ定義のみ）。ただし、QuestCatalogComponent.stories.tsx でクエスト一覧にsc-basicsカテゴリが表示されることを確認する。
