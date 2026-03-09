# 実行中タスク

## タスク元: tasks/prd-inserted-tasks.md

> 各種浮いているウィンドウは移動できるように。パッド内の端にはスナップするように。また、他のウィンドウもよけて自動調整した場所にスナップされるように。
> - まずは純粋関数から

## スコープ（今回のイテレーション）

今回は「まずは純粋関数から」の部分のみを実装する。
ウィンドウ位置管理・ドラッグ移動・エッジスナップ・ウィンドウ間回避の純粋ロジックを作成する。

### 設計

**型定義:**
- `PanelRect`: パネルの位置とサイズ `{ x, y, width, height }`
- `ContainerRect`: コンテナの幅と高さ `{ width, height }`
- `PanelId`: パネル識別子 (string)
- `SnapEdge`: スナップする辺 ("top" | "right" | "bottom" | "left")

**純粋関数:**
1. `clampToContainer(pos, panelSize, container, margin)` — パネル位置をコンテナ内に制約
2. `snapToEdges(pos, panelSize, container, threshold, margin)` — コンテナの端にスナップ
3. `findNonOverlappingPosition(panelId, pos, panelSize, otherPanels, container, margin)` — 他パネルと重ならない位置を探す
4. `computeDragPosition(dragStart, currentPointer, panelSize, container, otherPanels, options)` — ドラッグ中のパネル位置を計算（clamp + snap + avoid 統合）

### テスト計画

- ファイル: `src/lib/proof-pad/panelPositionLogic.test.ts`
- clampToContainer: コンテナ内/外/境界のケース
- snapToEdges: 各辺へのスナップ/非スナップ、複数辺同時スナップ
- findNonOverlappingPosition: 重なり回避、複数パネル回避
- computeDragPosition: 統合テスト

### ストーリー計画

- 純粋関数のみなのでUI変更なし。ストーリー追加不要。
- ただしブラウザテストは既存の画面で確認。
