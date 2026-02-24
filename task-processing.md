## 実行中タスク

**ソース:** `tasks/prd-inserted-tasks.md`

macOSのトラックパッドでの動きを拾うようにしてほしい (pan, 移動など)

### 周辺情報

- 現在の実装ではwheel イベントがすべてズームに割り当てられている
- macOSトラックパッドの2本指スクロールはwheel イベントとして発火するため、パンではなくズームになってしまう
- macOSのピンチ操作は `ctrlKey: true` の wheel イベントとして発火する（ブラウザのGestureEventはSafari独自）
- 対応方針: wheel イベントで `ctrlKey` を判定し、ピンチ（zoom）と2本指スクロール（pan）を分離
