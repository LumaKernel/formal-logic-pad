# 実行中タスク

## タスク

**ソース:** `tasks/prd-inserted-tasks.md` 2行目

> 選択のときも縁に行ったときにスクロールされてほしい。まずは単独のストーリー、機能として実装して、アプリのほうにも展開しよう。

## 周辺情報

- エッジスクロールは `src/lib/infinite-canvas/edgeScrollLogic.ts`（純粋ロジック）+ `useEdgeScroll.ts`（hook）+ `EdgeScrollIndicator.tsx`（UI）の3層
- 現在はノードドラッグ時のみ `notifyDragMove` が呼ばれてエッジスクロールが動作
- マーキー選択（Shift+ドラッグ）は `useMarquee.ts` で実装されているが、エッジスクロールとは統合されていない
- ProofWorkspace.tsx では `useEdgeScroll` の `notifyDragMove` を `CanvasItem` の `onDragMove` にのみ渡している

## テスト計画

- `useEdgeScroll.test.tsx` に追加: マーキードラッグ中のエッジスクロール動作テスト（既存hookの拡張であればここ）
- 統合テストは `InfiniteCanvas.test.tsx` または既存のマーキーテストに追加
- 純粋ロジック部分は変更不要のはず（`edgeScrollLogic.ts` は汎用）

## ストーリー計画

- `EdgeScrollDemo.stories.tsx` に「マーキー選択中のエッジスクロール」ストーリーを追加
- または `MultiSelectionDemo.stories.tsx` にエッジスクロール統合ストーリーを追加

## 実装方針

1. `InfiniteCanvas` レベルで `onEmptyAreaPointerMove` （マーキードラッグ中）にも `notifyDragMove` を呼ぶように統合
2. もしくは `useMarquee` 内で直接 `useEdgeScroll` を利用
3. ProofWorkspace.tsx にも展開
