## タスク (from tasks/prd-inserted-tasks.md)

- [-] visual bug: FormulaEditor multiline-auto-expand のエラーハイライトが真っ白で見えない

### 再現条件

- http://localhost:13006/?path=/story/formulainput-formulaexpandededitor--with-error
- FormulaExpandedEditor で不正な論理式（例: `→`）を入力するとエラーハイライトが白く見えない

### 原因

FormulaExpandedEditor.tsx のレイヤリング問題:

1. `highlightOverlayStyle` が `position: absolute` で `backgroundColor` なし（透明）
2. textarea がオーバーレイの**後**にDOMに配置され、`backgroundColor: "transparent"` になる
3. `mark` の `rgba(229, 62, 62, 0.2)` が白いモーダル背景上で非常に薄い
4. 根本原因: textareaが通常フロー → オーバーレイ(absolute)の上にスタックされ、textareaの背景が透明でもオーバーレイのハイライトが見えにくい

FormulaInput.tsx（正常に動作）との差異:

- FormulaInput: inputが `position: absolute` でオーバーレイの上に重なる。ハイライトコンテナは `position: relative` で自然フロー
- FormulaExpandedEditor: オーバーレイが `position: absolute`、textareaは通常フロー → z-indexの問題

### 修正方針

FormulaInput.tsx と同じレイヤリングパターンに揃える:

- textareaを `position: relative` + `zIndex: 1` にして明示的にオーバーレイの上に配置
- オーバーレイは `position: absolute` のまま（textareaの背後に入る）

### テスト計画

- FormulaExpandedEditor.test.tsx: 既存のエラーハイライトテストが正しく動作すること確認
- FormulaExpandedEditor.stories.tsx: WithError ストーリーの play 関数確認
- リグレッションテスト: エラーハイライトの `mark` 要素が DOM に存在し、正しいスタイルを持つことを確認

### ストーリー計画

- 既存 WithError ストーリーでのブラウザスクリーンショット検証
