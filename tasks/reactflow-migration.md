# React Flow 移行ロードマップ

カスタム InfiniteCanvas (~29K LOC, ~55 ファイル) を `@xyflow/react` に完全移行する。
「ストラングラーフィグ」パターン: 並行稼働 → 段階的置換 → 旧コード削除。

## 機能マッピング

| 現行 (infinite-canvas)            | React Flow 対応                                                     |
| --------------------------------- | ------------------------------------------------------------------- |
| InfiniteCanvas + CanvasItem       | `<ReactFlow>` + custom node type                                    |
| PortConnection / Connection       | custom edge type                                                    |
| ConnectorPortComponent            | `<Handle>` コンポーネント                                           |
| ConnectionPreviewLine             | 組込み connection line (`connectionLineComponent`)                  |
| usePan / useZoom                  | 組込み (`panOnDrag`, `zoomOnScroll`, `zoomOnPinch`)                 |
| useMarquee (矩形選択)             | 組込み (`selectionOnDrag`, `SelectionMode`)                         |
| MinimapComponent                  | `<MiniMap>`                                                         |
| ZoomControlsComponent             | `<Controls>` またはカスタム                                         |
| Background grid                   | `<Background>`                                                      |
| Viewport culling                  | 組込み (React Flow が内部で仮想化)                                  |
| snap.ts / objectSnap.ts           | `snapToGrid` prop + カスタムロジック維持                            |
| alignment.ts                      | 純粋ロジック維持、React Flow の `onNodeDrag` でガイド描画           |
| connectionPath.ts                 | 純粋ロジック維持、custom edge 内で使用                              |
| connectionLabel.ts                | 純粋ロジック維持、custom edge 内で使用                              |
| contextMenu / nodeMenu / lineMenu | `onNodeContextMenu` / `onEdgeContextMenu` / `onPaneContextMenu`     |
| commandPalette / nodeSearch       | 純粋ロジック維持、React Flow 外のオーバーレイUI                     |
| keyboardShortcuts                 | 純粋ロジック維持、React Flow のキーボード props と統合              |
| edgeScrollLogic                   | カスタム実装維持 (React Flow に該当機能なし)                        |
| useDragItem / useDeferredSnap     | React Flow 組込みドラッグ + `onNodeDragStop` でスナップアニメ       |
| coordinate.ts (worldToScreen 等)  | `useReactFlow()` の `screenToFlowPosition` / `flowToScreenPosition` |
| workspaceImageExport.ts           | `toObject()` + カスタム SVG 生成                                    |

## 保持する純粋ロジック (移行不要、参照先のみ変更)

- `connectionPath.ts`, `connectionLabel.ts`
- `alignment.ts`, `snap.ts`, `objectSnap.ts`, `deferredSnap.ts`
- `edgeScrollLogic.ts`, `edgeScrollIndicatorLogic.ts`
- `keyboardShortcuts.ts`
- `contextMenu.ts`, `nodeMenu.ts`, `lineMenu.ts`
- `commandPalette.ts`, `nodeSearch.ts`
- `grid.ts` (Background で不要になる可能性あり)
- `minimap.ts` (MiniMap で不要になる可能性あり)

## 削除対象 (React Flow が代替)

- `InfiniteCanvas.tsx`, `CanvasItem.tsx`
- `Connection.tsx`, `PortConnection.tsx`, `ConnectionPreviewLine.tsx`
- `ConnectorPortComponent.tsx`
- `MinimapComponent.tsx`, `ZoomControlsComponent.tsx`
- `AlignmentGuidesComponent.tsx`, `EdgeScrollIndicator.tsx`
- `usePan.ts`, `useZoom.ts`, `useDragItem.ts`, `useMarquee.ts`
- `useConnectionPreview.ts`, `useEdgeScroll.ts`, `useDeferredSnap.ts`
- `useKeyboardShortcuts.ts`, `useContextMenu.ts`, `useCommandPalette.ts`, `useNodeSearch.ts`
- `useClampedMenuPosition.ts`
- `pan.ts`, `zoom.ts`, `zoomControls.ts`, `drag.ts`
- `coordinate.ts`, `viewportCulling.ts`
- `connector.ts` (Handle に移行)
- `connectionPreview.ts`
- `multiSelection.ts` (選択ロジックは React Flow 組込み)
- 関連テスト・ストーリーファイル

## タスク一覧

### Phase 0: セットアップ

- [x] **RF-001: @xyflow/react インストール + 基本動作確認** — v12.10.2、`proOptions={{ hideAttribution: true }}` で a11y 対応
  - `@xyflow/react` をインストール
  - 最小限の ReactFlow ストーリー (`ReactFlowBasic.stories.tsx`) を作成
  - play 関数でノード・エッジのレンダリングを検証
  - テスト計画: ストーリーの play 関数で基本レンダリング確認
  - ゴール: React Flow がプロジェクトで動作することの確認

### Phase 1: アダプター層の構築

- [ ] **RF-002: workspaceState ↔ React Flow 変換アダプター**
  - `src/lib/proof-pad/reactFlowAdapter.ts` を新規作成
  - `WorkspaceState` → React Flow `Node[]` / `Edge[]` 変換関数
  - React Flow `NodeChange[]` / `EdgeChange[]` → `WorkspaceState` 逆変換関数
  - `Point`, `Size`, `ViewportState` の型マッピング
  - テスト計画: `reactFlowAdapter.test.ts` で全変換パスを網羅テスト
    - ノード変換（位置、サイズ、データ、種別）
    - エッジ変換（接続元/先、ラベル、色、推論規則情報）
    - 逆変換（ドラッグ後の位置更新、選択状態変更）
    - 境界ケース（空ワークスペース、孤立ノード、自己参照エッジ）

- [ ] **RF-003: カスタム ProofNode コンポーネント**
  - `src/lib/proof-pad/ProofNodeRF.tsx` を新規作成
  - React Flow の `NodeProps` を受け取り、`EditableProofNode` をラップ
  - `<Handle>` コンポーネントで現行の ConnectorPort 相当のポートを定義
  - ダブルクリック編集、モード切替（表示/編集）を維持
  - テスト計画: `ProofNodeRF.test.tsx` + ストーリーで検証
    - Handle の位置が正しいか（top/bottom ポート）
    - 編集モード切替が動作するか
    - ノード分類（axiom/goal/derived）に応じたスタイル
  - ストーリー計画: `ProofNodeRF.stories.tsx` で各状態のストーリー

- [ ] **RF-004: カスタム ProofEdge コンポーネント**
  - `src/lib/proof-pad/ProofEdgeRF.tsx` を新規作成
  - React Flow の `EdgeProps` を受け取り、現行の `connectionPath.ts` ロジックでパス描画
  - `connectionLabel.ts` でラベル配置
  - 推論規則バッジ表示を維持
  - テスト計画: `ProofEdgeRF.test.tsx` で検証
    - パス計算が既存 connectionPath.ts と一致するか
    - ラベル位置が正しいか
    - エッジカラーがノード分類に応じて正しいか
  - ストーリー計画: `ProofEdgeRF.stories.tsx` でエッジ種別ごとのストーリー

### Phase 2: ProofWorkspace の中核移行

- [ ] **RF-005: ProofWorkspace の ReactFlow 置換（基本レンダリング）**
  - ProofWorkspace.tsx の `<InfiniteCanvas>` + `<CanvasItem>` を `<ReactFlow>` に置換
  - RF-002 のアダプターで workspaceState → nodes/edges 変換
  - `onNodesChange` / `onEdgesChange` で workspaceState を更新
  - pan/zoom は React Flow 組込み機能を使用
  - フォーミュラ編集（ダブルクリック）が動作することを確認
  - テスト計画: 既存の `ProofWorkspace.test.tsx` が全て通ること（リグレッション防止）
  - ストーリー計画: 既存ストーリーが同等に動作すること

- [ ] **RF-006: Handle ベースの接続作成**
  - 現行の `useConnectionPreview` + `ConnectionPreviewLine` を React Flow 組込みの接続ドラッグに置換
  - `isValidConnection` で接続バリデーション（ループ検出、型一致等）
  - `onConnect` で workspaceState に推論エッジ追加
  - `connectionLineComponent` でプレビュースタイルをカスタマイズ
  - テスト計画: 接続作成の E2E テスト（ストーリー play 関数）
    - 有効な接続が成功するか
    - 無効な接続（ループ等）が拒否されるか

- [ ] **RF-007: ノードドラッグ・スナップ・アラインメント**
  - React Flow の `snapToGrid` prop でグリッドスナップ
  - `onNodeDrag` でオブジェクトスナップ + アラインメントガイド描画
  - `onNodeDragStop` でスナップアニメーション（deferredSnap ロジック再利用）
  - マルチノードドラッグは React Flow の組込み選択+ドラッグで対応
  - テスト計画: スナップ・アラインメントの純粋ロジックテストは既存を維持。統合テストをストーリーで検証

### Phase 3: 機能パリティ達成

- [ ] **RF-008: コンテキストメニュー移行**
  - `onNodeContextMenu` / `onEdgeContextMenu` / `onPaneContextMenu` で既存メニューを表示
  - 既存の `contextMenu.ts`, `nodeMenu.ts`, `lineMenu.ts` 純粋ロジックを維持
  - `ContextMenuComponent` は infinite-canvas から独立させて共有コンポーネント化
  - テスト計画: 既存テストを維持 + ストーリーで右クリックメニュー動作確認

- [ ] **RF-009: コマンドパレット + ノード検索**
  - `commandPalette.ts`, `nodeSearch.ts` 純粋ロジックを維持
  - React Flow の `<Panel>` でオーバーレイ配置
  - キーボードトリガー (Cmd+K, Cmd+F) は RF-010 と連携
  - テスト計画: 純粋ロジックテストは既存維持。ストーリーでオーバーレイ表示・操作確認

- [ ] **RF-010: キーボードショートカット移行**
  - `keyboardShortcuts.ts` 純粋ロジックを維持
  - React Flow の `deleteKeyCode`, `selectionKeyCode`, `multiSelectionKeyCode` 等を設定
  - Arrow キーパン、Undo/Redo、Delete 等を React Flow のイベントと統合
  - テスト計画: 既存の keyboardShortcuts テストを維持。ストーリーで主要ショートカット動作確認

- [ ] **RF-011: ミニマップ・ズームコントロール・背景移行**
  - `<MiniMap>` で現行ミニマップ置換。カスタム nodeColor でノード分類色を反映
  - `<Controls>` またはカスタムズームコントロールで現行 ZoomControlsComponent 置換
  - `<Background variant={BackgroundVariant.Dots}>` で現行グリッド置換
  - テスト計画: ストーリーで視覚確認。純粋ロジックテスト (minimap.ts, zoomControls.ts) は置換後に削除
  - ストーリー計画: ミニマップ・コントロール付きの統合ストーリー

- [ ] **RF-012: コピペ・Undo/Redo・画像エクスポート移行**
  - `copyPasteLogic.ts` 純粋ロジックを維持、座標変換を React Flow API に切替
  - undo/redo は既存の `src/lib/history/` を維持（React Flow の状態と同期）
  - 画像エクスポート: `useReactFlow().toObject()` + 既存 SVG 生成ロジック
  - テスト計画: 既存テストを維持。エクスポートの出力一致を確認

- [ ] **RF-013: エッジスクロール移行**
  - React Flow には該当機能なし → カスタム実装を維持
  - `edgeScrollLogic.ts` 純粋ロジックを維持
  - React Flow の `onNodeDrag` イベントからエッジスクロールを発動
  - `useReactFlow().setViewport()` でビューポート移動
  - テスト計画: 既存の edgeScrollLogic テストを維持

### Phase 4: 周辺コンポーネント移行

- [ ] **RF-014: ScriptEditor の ContextMenu 依存を解消**
  - `ContextMenuComponent`, `useContextMenu` を infinite-canvas から独立した共有モジュールに移動
  - `src/components/ui/ContextMenu/` または `src/lib/context-menu/` に配置
  - ScriptEditor の import パスを更新
  - テスト計画: 既存テストの import パス更新のみ。動作は既存テストで保証

### Phase 5: クリーンアップ

- [ ] **RF-015: Storybook ストーリー全面更新**
  - 旧 infinite-canvas のデモストーリー削除
  - ProofWorkspace 系ストーリーを React Flow ベースに全面更新
  - 新ストーリーに play 関数を追加（インタラクションテスト）
  - テスト計画: 全ストーリーの play 関数が CI で通ること

- [ ] **RF-016: InfiniteCanvas 旧コード削除**
  - `src/lib/infinite-canvas/` から React Flow に移行済みのファイルを削除
  - 純粋ロジックファイルのうち、不要になったものを削除
  - 残すべき純粋ロジックファイルは適切なモジュールに移動
  - `index.ts` のエクスポートを最終整理
  - テスト計画: 全テスト・typecheck・lint が通ること。カバレッジが低下しないこと

- [ ] **RF-017: 最終検証 + ドキュメント更新**
  - 全機能の動作確認（ブラウザテスト）
  - カバレッジが移行前と同等以上であることを確認
  - CLAUDE.md のパターン更新（infinite-canvas → React Flow）
  - progress.txt に移行完了を記録

## リスクと注意点

1. **undo/redo 統合**: React Flow の `onNodesChange`/`onEdgesChange` は内部状態変更を通知する。既存の history ライブラリとの二重管理に注意。workspaceState 側で一元管理し、React Flow には制御コンポーネントとして使う
2. **カスタムノードのリレンダリング**: React Flow はノードデータ変更時に再レンダリングする。EditableProofNode の memo 化が重要
3. **ポート位置**: 現行の ConnectorPort (edge+position) → React Flow Handle (Position + id) へのマッピング。上下ポートが主要パターン
4. **座標系**: 現行の `worldToScreen`/`screenToWorld` → React Flow の `flowToScreenPosition`/`screenToFlowPosition` に置換。既存の純粋ロジックが座標を受け取る箇所の修正が必要
5. **Storybook テストタイムアウト**: React Flow の初期化は InfiniteCanvas より重い可能性あり。タイムアウトに注意
6. **CSS スタイル**: `@xyflow/react/dist/style.css` の読み込みが必要。既存テーマ（dark/light）との統合
