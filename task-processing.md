## 現在のタスク

**出典:** `tasks/prd-theories.md` — リファレンス統合タスク

**タスク:** NotebookCreateForm に体系リファレンスポップオーバーを統合: 体系カード内に(?)マークを追加。プリセットIDからリファレンスエントリIDへのマッピング

**周辺情報:**
- AxiomPalette への統合パターンが先行実装済み（axiomReferenceMapping.ts + AxiomPalette.tsx）
- ReferencePopover コンポーネントは既に実装済み（src/lib/reference/ReferencePopover.tsx）
- NotebookCreateFormComponent は src/lib/notebook/NotebookCreateFormComponent.tsx
- notebookCreateLogic.ts にプリセット定義がある
- referenceContent.ts にリファレンスエントリがある
