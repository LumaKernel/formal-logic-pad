## タスク（prd-2026-03-10.md から）

ウィンドウのドラッグは、スナップは手を離したあとにゆるやかにシュってスナップされるだけでいい。動かしてる途中にもスナップされると体験が悪い

- ここにスナップしそうだよ、というのがジワーっと弱く光るのはよさそう

### 周辺情報

- 現在のスナップシステム:
  - `snap.ts`: グリッドスナップ（`useDragItem` で `applySnap` が `onPointerMove` 中に適用）
  - `objectSnap.ts`: オブジェクトスナップ（計算純粋関数あるが UI 統合なし）
  - `AlignmentGuidesComponent.tsx`: ガイドライン表示コンポーネント（SVGオーバーレイ）
- 変更対象: `useDragItem.ts` のスナップ適用タイミング、`CanvasItem.tsx` のドロップ後アニメーション
- `ObjectSnapDemo.stories.tsx` でオブジェクトスナップを demo として利用

### テスト計画

1. **純粋ロジック（`deferredSnap.ts` 新規）:**
   - スナップ先位置の計算（既存のスナップ関数を再利用）
   - アニメーション用 easing 関数のテスト
   - `computeDeferredSnapTarget`: ドラッグ終了位置からスナップ先を計算
2. **`useDragItem.test.tsx` 既存テスト更新:**
   - ドラッグ中にスナップが適用されないことの確認
   - ドロップ後にスナップ先位置がコールバックで返ること
3. **`snap.test.ts` / `objectSnap.test.ts`:**
   - 既存テストは変更なし（純粋関数は変わらない）
4. **新規: `deferredSnap.test.ts`**
   - easing 関数の値テスト
   - スナッププレビューの計算テスト

### ストーリー計画

1. `ObjectSnapDemo.stories.tsx` を更新 → ドラッグ中はプレビューガイド、ドロップ後にアニメーションスナップ
2. `GridSnapDemo.stories.tsx` を更新 → 同様の deferred snap UX

### 実装方針

**3層分離の原則に従う:**

1. **純粋ロジック層 (`deferredSnap.ts`):**
   - `computeSnapPreview`: ドラッグ中の位置からスナップ先プレビューを計算（ガイドライン生成）
   - `easeOutCubic`: スムーズなスナップアニメーション用イージング
   - `interpolatePosition`: 2点間の線形補間

2. **Hook層 (`useDragItem.ts` 修正):**
   - `onPointerMove`: スナップを適用せず、生の位置を返す
   - 新しい `onDragEnd` コールバック: スナップ先位置を返す
   - `useDeferredSnap` 的なアニメーション hook: ドロップ後にスムーズに移動

3. **UI層 (`CanvasItem.tsx` 修正):**
   - ドラッグ中: プレビューガイドを薄く表示（親経由）
   - ドロップ後: CSS transition or rAF でスナップ先にアニメーション

**重要な設計判断:**
- グリッドスナップ と オブジェクトスナップ の両方でこの deferred パターンを適用
- `useDragItem` の `snapConfig` はドラッグ中のスナップを無効にし、ドロップ時にのみ適用
- アニメーションは `requestAnimationFrame` + easing で実装（CSS transitionだとドラッグ中の位置更新と干渉する可能性）
- スナッププレビュー（ガイドライン）は `computeObjectSnap` の結果からガイドだけを表示（位置は変えない）
