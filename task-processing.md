# 実行中タスク

**ソース:** tasks/prd-inserted-tasks.md 行21

> 基本はrenderedが表示され、クリックで編集開始できるやつ (Nodeに使われてるダブルクリックのクリック版) を利用せよ。

## 対象箇所

ProofWorkspace.tsx の代入プロンプトバナー（line 4903付近）:

- `FormulaInput` → `FormulaEditor` に置換（クリックで編集開始、離れたらrendered表示）
- `TermInput` → `TermEditor` に同様に置換

EdgeParameterPopoverは既にFormulaEditor/TermEditorを使用済み（forceEditMode=trueで常時編集だが、ポップオーバーとしては適切）。

## テスト計画

- ProofWorkspace.test.tsx の代入プロンプト関連テストを確認・更新
  - FormulaInput→FormulaEditorへの変更でtestIdチェーンが変わる可能性
  - 既存テストがFormulaInput直接利用を前提としている場合は修正

## ストーリー計画

- ProofWorkspace.stories.tsx の代入関連ストーリーを確認
- 変更があればplay関数を更新
