## タスク (from tasks/prd-myq.md)

- [ ] クエストの削除は確認ステップを踏んで

### テスト計画

- `CustomQuestListComponent.test.tsx`: 削除確認ダイアログのテスト追加
  - 削除ボタンクリックで確認オーバーレイが表示される
  - 確認ボタンクリックでonDeleteが呼ばれる
  - キャンセルボタンクリックでオーバーレイが閉じる
  - 確認前にonDeleteが呼ばれない

### ストーリー計画

- `CustomQuestListComponent.stories.tsx`: Delete Quest ストーリーを更新して確認フローを含める

### 周辺情報

- NotebookListComponent.tsx に確認オーバーレイパターンが存在 → 同じパターンを適用
- deleteConfirmOverlayStyle, deleteConfirmTextStyle 等のスタイルが参考になる
- 現在の削除ボタンは `onDelete(item.quest.id)` を直接呼んでいる
