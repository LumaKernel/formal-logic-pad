## タスク（prd-inserted-tasks.md より）

- [ ] コンテキストメニューからの論理式ノード追加をしたときは、編集中の状態へ自動移行したほうがよい

## 周辺情報

- `handleCanvasMenuAddNode` (ProofWorkspace.tsx) が右クリックメニューの「ノード追加」ハンドラ
- `addNode()` (workspaceState.ts) は純粋関数でノードIDを `node-${nextNodeId}` で生成
- `editRequestNodeId` + `forceEditMode` の既存メカニズムで、ノードIDを設定すれば自動的に編集モードに入る
- 変更はProofWorkspace.tsx の `handleCanvasMenuAddNode` 内で `setEditRequestNodeId(newNodeId)` を呼ぶだけ

## テスト計画

- `src/lib/proof-pad/ProofWorkspace.test.tsx` に既存の「コンテキストメニューからノード追加」テストがあるか確認
- コンテキストメニューからノード追加後に編集モードに入ることを検証するテストを追加
- `workspaceState.ts` の `addNode` は純粋関数テスト済み、変更不要

## ストーリー計画

- `ProofWorkspace.stories.tsx` に「コンテキストメニュー→ノード追加→自動編集」のストーリーがあれば更新
- 既存ストーリーで十分カバーされていれば新規追加不要
