# History Library

汎用的なundo/redo History管理ライブラリ。React非依存の純粋ロジック + React hook。

## アーキテクチャ

- `history.ts`: 純粋関数のみ。`History<S>` 型とイミュータブルな操作関数
- `useHistory.ts`: React hook。内部で純粋関数を使用
- `index.ts`: パブリックエクスポート

## 設計ポイント

- `pushState` は新状態追加時にfuture（redo stack）をクリアする
- `replacePresent` はundo エントリを作らない「一時的な更新」用（ドラッグ中の位置更新など）
- `pushStateWithLimit` でメモリ制限付きの履歴管理が可能
- undo/redo が不可能な場合は同じオブジェクト参照を返す（参照等価性を保持）

## InfiniteCanvas との統合パターン

```typescript
const history = useHistory<CanvasState>(initialState);

// 通常の操作（undo可能）
const handleNodeAdd = (node: Node) => {
  history.push({ ...history.state, nodes: [...history.state.nodes, node] });
};

// ドラッグ中の一時更新（undo不可）
const handleDragMove = (nodeId: string, pos: Point) => {
  history.replace(updateNodePosition(history.state, nodeId, pos));
};

// ドラッグ完了（undo可能にする）
const handleDragEnd = (nodeId: string, pos: Point) => {
  history.push(updateNodePosition(history.state, nodeId, pos));
};
```
