## タスク (from tasks/prd-inserted-tasks.md)

- [ ] bug: 論理式ノードが結局、ダブルクリックで編集開始できない

## 原因分析

`useDragItem` の `onPointerDown` が `setPointerCapture(e.pointerId)` を呼ぶことで、
後続のポインターイベントが CanvasItem の div にルーティングされる。
結果としてブラウザが生成する `dblclick` イベントのターゲットが CanvasItem div になり、
FormulaEditor の display ボタンの `onDoubleClick` ハンドラに到達しない。

## 修正計画

`useDragItem` で `setPointerCapture` を `onPointerDown` 時ではなく
`onPointerMove` 時（実際にドラッグが開始された時）に遅延させる。
こうすることで、ダブルクリック時は pointer capture が発生せず、
ブラウザの正常な dblclick イベント合成が維持される。

## テスト計画

- `src/lib/infinite-canvas/useDragItem.test.tsx` — setPointerCapture が pointermove で呼ばれることの確認
- `src/lib/proof-pad/ProofWorkspace.test.tsx` — dblclick で編集モードに入るリグレッションテスト確認
- 既存テストが引き続きパスすることの確認

## ストーリー計画

- UI変更なし（内部挙動修正のみ）
- ブラウザでの動作確認はPlaywright MCPで実施
