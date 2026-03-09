# タスク: マイコレクションを常駐ウィンドウ化（折り畳み可能）

**ソース:** `tasks/prd-inserted-tasks.md`

> - [ ] マイコレクションはメニューから開くものではなく、常駐ウィンドウとしてあってよいだろう。
>   - [ ] 折り畳むなどはできてよさそうだ

## 現状

- ProofCollectionPanel はメニュー（☰）→「マイコレクション」で開閉するポップアップ
- `collectionPanelOpen` boolean で条件付きレンダリング
- GoalPanel は常時表示＋折り畳み＋ドラッグ移動が既に実装済み

## 変更方針

GoalPanel と同様のパターンで、ProofCollectionPanel を常駐パネルに変更する:

1. **ProofCollectionPanel に折り畳み機能を追加**
   - GoalPanel と同じ `collapsed` 状態管理
   - 折り畳み時はタイトルバー（エントリ数表示）のみ表示
   - `onClose` prop を `onCollapse`/折り畳みトグルに変更

2. **ProofWorkspace の変更**
   - `collectionPanelOpen` を削除
   - `collectionEntries !== undefined` であれば常に ProofCollectionPanel を表示
   - メニューの「マイコレクション」ボタンを削除（常駐なので不要）
   - パネルドラッグ用の `usePanelDrag` を追加（GoalPanel, AxiomPalette と同パターン）
   - 他パネルの `otherPanels` にコレクションパネルの矩形を追加

3. **ProofCollectionPanel UI の変更**
   - `onClose` prop → 折り畳みトグルに変更（×ボタンで折り畳み）
   - ヘッダーにドラッグハンドル（`onDragHandlePointerDown` prop）追加
   - `position` prop 追加（GoalPanel と同じパターン）

## テスト計画

- **ProofCollectionPanel.test.tsx**: 折り畳み動作テスト追加（展開/折り畳みトグル、折り畳み時のエントリ数表示）
- **ProofWorkspace.test.tsx**: 常駐表示テスト（collectionEntries があれば表示される）、メニューからの開閉テスト削除/更新

## ストーリー計画

- **ProofCollectionPanel.stories.tsx**: 折り畳み状態のストーリー追加、ドラッグ動作確認
- **ProofWorkspace.stories.tsx**: コレクションパネル常駐表示の確認
