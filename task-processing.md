# 実行中タスク

**出典:** `tasks/prd-inserted-tasks.md`

## タスク

- [-] 論理式ノードを追加してダブルクリックしても編集を開始できない。また、クリックして…と表示されるままになっている。クリックではなくダブルクリックだろう。
- [-] 論理式ノードに、「論理式を編集」的なコンテキストメニューもあってよいだろう。

## 調査結果

### プレースホルダーテキストの問題

- `proofMessages.ts` L377: `formulaEditorPlaceholder: "Click to edit formula..."`
- `ja.json` L132: `"formulaEditorPlaceholder": "クリックして論理式を入力..."`
- `EditableProofNode.tsx` L527: `placeholder={msg.formulaEditorPlaceholder}` — `editTrigger` を考慮せず固定
- `FormulaEditor.tsx` L116: デフォルト placeholder = `"クリックして論理式を入力..."` — こちらも固定
- aria-label (L264-265) は既に `editTrigger` に応じて「ダブルクリックして」に切り替えている

### ダブルクリック自体は動作する可能性が高い

- `FormulaEditor.tsx` L252-254: `onDoubleClick={editTrigger === "dblclick" ? handleDisplayClick : undefined}` — 正しく設定されている
- ただし、新規追加ノードの初期状態（空文字）でダブルクリックが実際に効くか確認が必要

## テスト計画

- `src/lib/proof-pad/proofMessages.test.ts`: 新キー `formulaEditorPlaceholderDblclick` の追加を反映
- `src/lib/proof-pad/EditableProofNode.test.tsx`: `editTrigger="dblclick"` のときプレースホルダーが「ダブルクリック」になることを確認するテスト追加
- `src/lib/formula-input/FormulaEditor.test.tsx`: 必要に応じてプレースホルダーテストを追加

## ストーリー計画

- 既存の ProofWorkspace ストーリーで動作確認
- コンテキストメニューの「論理式を編集」追加は UI 変更あり → ストーリーで確認

## 実装計画

1. `proofMessages.ts`: `formulaEditorPlaceholderDblclick` キーを追加
2. `EditableProofNode.tsx`: `editTrigger` に応じてプレースホルダーを切り替え
3. `en.json`, `ja.json`: 翻訳追加
4. `WorkspaceContent.tsx`: `useProofMessagesFromIntl` に追加
5. `proofMessages.test.ts`: 新キーのテスト
6. コンテキストメニューに「論理式を編集」項目を追加
