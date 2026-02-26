## 現在のタスク

**ソース:** `tasks/prd-infinite-canvas-enhancements.md` > Tier 3 > 3.5 エクスポート

- [ ] PNG/SVG 画像エクスポート

### 周辺情報

- JSON データエクスポートは既に完了済み（`workspaceExport.ts`）
- 3層分離パターン: 純粋ロジック(.ts) → React hook → UIコンポーネント(.tsx)
- ProofWorkspace.tsx にエクスポートUIがある
- InfiniteCanvas はSVGベースなので、SVGエクスポートは内部SVGの取得がベース
- PNGはSVGをCanvasに描画してからエクスポート
