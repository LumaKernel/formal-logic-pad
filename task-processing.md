## タスク: ノートタイトル編集 + 自由帳として複製を三点リーダーに移動

**出典:** `tasks/prd-title-edit.md`

- [ ] ノート開いている状態でタイトルクリックをしたらタイトルを編集できるようにしよう
- [ ] 自由帳として複製、は、三点リーダーの中に入れよう

### 周辺情報

- タイトル表示: `WorkspacePageView.tsx` line 222 — `<span style={notebookNameStyle}>{props.notebookName}</span>`
- 名前変更の純粋ロジック: `notebookState.ts` `renameNotebook()`
- Hook: `useNotebookCollection.ts` `.rename(id, newName)`
- 既存のリネームUI: `NotebookListComponent.tsx` にインライン編集あり（validation込み）
- 「自由帳として複製」ボタン: `ProofWorkspace.tsx` lines 4178-4193
- 統合: `WorkspaceContent.tsx` にhandleDuplicateToFree

### テスト計画

- `WorkspacePageView.test.tsx` を新規作成（もしくは既存ストーリーを更新）:
  - タイトルクリックで編集モードに入る
  - Enter で確定、Escape でキャンセル
  - 空名前のバリデーションエラー
  - 三点メニューから「自由帳として複製」を実行できる
- 既存の `ProofWorkspace.stories.tsx` / `WorkspacePageView.stories.tsx` を更新

### ストーリー計画

- `WorkspacePageView.stories.tsx` に以下を追加/更新:
  - タイトル編集のインタラクションストーリー
  - 三点メニューのインタラクションストーリー
