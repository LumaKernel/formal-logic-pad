## タスク（from tasks/inserted-tasks.md）

- [ ] カットの基本: 推移律 のクエストの模範解答 - ⇒ が Unexpected Characterで怒られてる

### 背景

FormulaEditorのdisplayモードで、sequentテキスト（⇒含む）はformulaパーサーが失敗するため、
実際のテキストではなくプレースホルダーが表示される。
allowSequentText有効時にsequentテキストを正しく表示する必要がある。

### 方針

EditableProofNodeで、`useSequentEditor=true` かつ `isSequentText(formulaText)` の場合、
FormulaEditorではなくSequentDisplayを使用して表示し、ダブルクリックで編集モードに入れるようにする。

### テスト計画

- FormulaEditor.test.tsx: allowSequentText有効時のsequentテキスト表示テスト
- EditableProofNode.test.tsx: useSequentEditor有効時のsequentテキスト表示テスト

### ストーリー計画

- 既存のSCモデル回答ストーリーが正しく表示されることで検証
