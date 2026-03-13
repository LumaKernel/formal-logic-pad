## タスク

from: `tasks/prd-inserted-tasks.md`

- [ ] ゴール一覧は閉じても移動できるのに、マイコレクションはできない。もしかして同じ仕組みを使っていない？

### 周辺情報

- GoalPanel: collapsed 状態で `wasDraggedRef` を使ってドラッグとクリックを区別している
- ProofCollectionPanel: collapsed 状態で `wasDraggedRef` が渡されておらず、ドラッグ時もトグルが発動する

### テスト計画

- `ProofCollectionPanel.test.tsx` に collapsed 状態でのドラッグテストを追加
- 既存の GoalPanel のドラッグテストパターンを参考にする

### ストーリー計画

- 既存の ProofWorkspace ストーリーで collapsed パネルのドラッグ動作を確認

### バグ修正のリグレッションテスト

- collapsed 状態の ProofCollectionPanel でポインターダウン→移動→アップした際に、onToggle が呼ばれないことを確認するテスト
