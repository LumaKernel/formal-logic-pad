## 現在のタスク

**出典:** `tasks/prd-inserted-tasks.md` 2行目

> セレクションしながら一個を移動したら、選択されてるすべてが同時に相対的な位置を保って平行に移動することを期待するのが通常だろう。ストーリーと機能追加を。

### テスト計画

1. **workspaceState.test.ts**: `updateMultipleNodePositions` 純粋関数のテスト
   - 選択ノード群の一括位置更新
   - 非選択ノードは変更なし
   - 空のMap → 状態変更なし

2. **ProofWorkspace.test.tsx**: マルチドラッグ統合テスト
   - 選択ノードをドラッグしたとき、他の選択ノードも移動すること (PointerEventシミュレーション)
   → ドラッグはPointerEventが必要でunitテストでは難しいので、ストーリー/ブラウザテストで検証

### ストーリー計画

- `ProofWorkspace.stories.tsx` に `MultiSelectionDrag` ストーリー追加
  - 複数ノードを配置し選択状態で1つをドラッグ → 全体が移動

### 実装計画

1. `workspaceState.ts`: `updateMultipleNodePositions(state, positions: ReadonlyMap<string, Point>)` 純粋関数を追加
2. `ProofWorkspace.tsx`: `handlePositionChange` を修正
   - ドラッグされたノードが `selectedNodeIds` に含まれ、かつ選択ノードが2つ以上の場合:
     - 旧位置と新位置のdeltaを計算
     - 他の選択ノードにもdeltaを適用
     - `updateMultipleNodePositions` で一括更新
   - それ以外: 従来通り `updateNodePosition` で単一更新
3. テスト・ストーリー追加
