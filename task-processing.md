# 実行中タスク

**出典:** `tasks/prd-inserted-tasks.md` 1行目

> キャンバスでshiftしながらクリックで選択対象ノードの追加、削除になってほしい。また、ブラウザネイティブのセレクションが行われてしまうので、このイベントはキャンセルしてほしい。

## 周辺情報

- 選択ロジックは `multiSelection.ts` (純粋ロジック) → `useMarquee.ts` (React hook) → ProofWorkspace.tsx (UI) の3層
- CanvasItem.tsx がノードのクリックイベントを処理
- InfiniteCanvas.tsx が全体の座標・イベント管理

## テスト計画

- `multiSelection.test.ts` に Shift+クリックでの toggle selection テストを追加
- `InfiniteCanvas.test.tsx` にブラウザネイティブセレクション防止のテストを追加
- `ProofWorkspace.test.tsx` に Shift+クリックでのノード選択追加・削除のインタラクションテストを追加

## ストーリー計画

- `ProofWorkspace.stories.tsx` に Shift+Click Selection Toggle ストーリーを追加
  - play関数で: ノードA選択 → Shift+ノードBクリックで追加選択 → Shift+ノードAクリックで選択解除
