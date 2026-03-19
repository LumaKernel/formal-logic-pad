## タスク

`tasks/inserted-tasks.md` より:

- [ ] minimapはそんなに遠くにはいけなくていいので、端によったときにグーっと広がる機能は必要ない。ノード全体が見える固定の視点+マージンというだけでいい

### 分析

現在の `MinimapComponent` は `expandBoundingBoxWithViewport` でビューポート位置をbounding boxに含めているため、遠くにパンするとminimap全体が広がる。これを廃止し、ノードのbounding boxのみ + 固定マージンで表示する。ビューポートインジケータはminimap外にはみ出す場合SVGのoverflow:hiddenでクリップされる（既にoverflow:hidden設定済み）。

### テスト計画

- `minimap.test.ts`: `expandBoundingBoxWithViewport` 関連テスト削除/更新、ノードのみのbounding boxで動作するテスト追加
- `MinimapComponent.test.tsx`: boundingBox計算がviewportに依存しないことを確認するテスト更新

### ストーリー計画

- `MinimapDemo.stories.tsx`: 既存ストーリーで動作確認。ビューポートが遠い位置にあるケースのストーリー追加も検討
