## 現在のタスク

**元タスクファイル:** `tasks/prd-inserted-tasks.md` line 41

> duplicateなどもあるとよいだろう。ただし、ゴールなどは、野良の通常の中間定理に変わるのが良いだろう (ゴールが複製されまくるのをユーザーができてしまうのはよくない）

### 周辺情報

- line 39-42: コンテキストメニュー経由でのノード削除は実装済み。クエストのゴールは消せない仕様。
- duplicate時、ゴールノードは通常の中間定理（unmarked）になるべき
- コンテキストメニューの既存実装を拡張する形で追加

### テスト計画

1. 純粋ロジック（copyPasteLogicまたは新ロジック）でduplicate関数をテスト
2. workspaceState.tsでduplicate状態管理をテスト
3. ProofWorkspace.tsxのコンテキストメニューにDuplicateを追加
4. ストーリーでインタラクションテスト
