## 実行中タスク

**出典:** `tasks/inserted-tasks.md` - 「コレクションに保存、をしたら、コレクションウィンドウが開いて、対象の保存したばかりのものが詳細表示されている状態にせよ。」

### テスト計画

- `ProofCollectionPanel.test.tsx`: highlightedEntryId propのテスト追加（ハイライトスタイル適用、スクロール）
- `proofCollectionPanelLogic.test.ts`: ハイライト判定の純粋関数テスト（既存ファイルがあれば）
- `ProofWorkspace.test.tsx`: 既存の保存テストにパネル表示確認を追加

### ストーリー計画

- `ProofCollectionPanel.stories.tsx`: highlightedEntryIdありのストーリー追加

### 実装計画

1. `onSaveProofToCollection` の型を `(params) => void` → `(params) => ProofEntryId | undefined` に変更
2. `WorkspaceContent.tsx`: `addProofEntry` の戻り値をreturnする
3. `ProofWorkspace.tsx`: 保存後に
   a. コールバックの戻り値でIDを取得
   b. `collectionPanelHidden` を false に
   c. `highlightedCollectionEntryId` state を設定
4. `ProofCollectionPanel`: `highlightedEntryId` propを追加、対象エントリにハイライトスタイル適用 + スクロール
5. ハイライトは一定時間後に自動消去（3秒程度）
