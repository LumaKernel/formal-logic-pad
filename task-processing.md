## 実行中タスク

**ソース:** `tasks/prd-note-node.md`

> ノードの種類に、メモを追加。
> 編集はマークダウンによって可能。編集を開始するとマークダウンエディタがモーダルで開く
> 編集を終了すると反映される

### スコープ（このイテレーション）

メモノードの基本機能を実装する（マークダウン表示・編集）:

1. `ProofNodeKind` に `"note"` を追加
2. ノートノードのスタイル・ポート定義（ポートなし＝接続不可）
3. `nodeRoleLogic` でのノート分類
4. `workspaceExport.ts` のスキーマ更新
5. `EditableProofNode` でのマークダウン表示
6. `ProofWorkspace` でのノート追加UI（コマンドパレットorメニュー）
7. マークダウン編集モーダル

### テスト計画

- `proofNodeUI.test.ts`: "note" kind のスタイル・ポート・ラベルのテスト追加
- `nodeRoleLogic.test.ts`: "note" ノードの分類テスト
- `workspaceState.test.ts`: ノート追加・削除・位置更新のテスト
- `workspaceExport.test.ts`: ノートのエクスポート/インポート round-trip テスト
- `EditableProofNode.test.tsx`: ノートノードのレンダリングテスト

### ストーリー計画

- `EditableProofNode.stories.tsx`: ノートノード表示ストーリー
- `ProofWorkspace.stories.tsx`: ノート追加・編集ストーリー
