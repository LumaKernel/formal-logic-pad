## 現在のタスク

**ソース:** `tasks/prd-dark-mode.md` > US-006

### US-006: InfiniteCanvasに基準線（メジャーグリッドライン）を追加

- [ ] ドットN個ごと（例: 5個おき）に薄い直線（縦横）を描画する
- [ ] 基準線の間隔（`majorGridEvery`）をpropsで設定可能（デフォルト: 5）
- [ ] 基準線の色（`gridLineColor`）をpropsで設定可能（デフォルトはCSS変数から取得）
- [ ] 基準線の太さ（`gridLineWidth`）をpropsで設定可能（デフォルト: 0.5px）
- [ ] ズームレベルに応じてドットと同様に基準線も拡縮する
- [ ] 基準線はドットより控えめな表示（低い不透明度やより薄い色）
- [ ] ダーク/ライト両モードで適切な色になる
- [ ] Storybookにストーリーを追加
- [ ] 型チェック/lintが通る
- [ ] Playwright MCPでスクリーンショットを撮影し `.screenshots/` に保存して確認
