# 実行中タスク

**出典:** `tasks/prd-my-tasks-improved.md`

> 新規作成フォームの「ゴール式（1行に1つ）」は、まず論理式の列を扱うコンポーネントを作成しよう
> - 別のところでも書いたように、論理式はクリックで編集して、render されるものを統一的に提供
> - 順の入れ替え、追加なども

## 周辺情報

- 現状は textarea に改行区切りでゴール式を入力している（CustomQuestListComponent.tsx L542-565）
- FormulaEditor がクリック→編集のパターンを実装済み
- customQuestEditLogic.ts に `parseGoalLines`/`goalsTextToDefinitions` が既存
- EditFormValues.goalsText は string（改行区切り）→ FormulaList コンポーネント導入で readonly string[] に変える

## テスト計画

1. **純粋ロジック**: `formulaListLogic.test.ts` — add/remove/reorder/validate 関数のテスト
2. **UI コンポーネント**: `FormulaListEditor.test.tsx` — add/remove/reorder 操作の UI テスト
3. **統合**: CustomQuestListComponent の既存テスト更新（textarea → FormulaListEditor）

## ストーリー計画

1. `FormulaListEditor.stories.tsx` — Default, AddRemove, Reorder, ValidationError, Empty のストーリー（play 関数付き）
2. CustomQuestListComponent.stories.tsx の既存ストーリー更新（必要に応じて）

## 実装計画

1. `src/lib/formula-input/formulaListLogic.ts` — 純粋ロジック（add, remove, reorder, validate）
2. `src/lib/formula-input/FormulaListEditor.tsx` — UI コンポーネント（FormulaEditor を各行で利用）
3. `src/lib/quest/customQuestEditLogic.ts` — goalsText: string → goals: readonly string[] への移行
4. `src/lib/quest/CustomQuestListComponent.tsx` — textarea → FormulaListEditor に置換
