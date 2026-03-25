## 実行中タスク

**出典:** `tasks/inserted-tasks.md` - 「キャンバスのスクロール操作 (ドラッグ操作) が重たい。なんらかの余計な再描画を毎回待ってたりしないだろうか。」

### 調査計画

1. InfiniteCanvas のドラッグ/スクロール処理を読み、再描画トリガーを特定
2. React DevTools Profiler / Chrome Performance で再描画パターンを確認
3. 不要な再描画があればthrottle/debounce/useDeferredValue等で最適化

### テスト計画

- 既存の InfiniteCanvas テストが引き続きパスすることを確認
- パフォーマンス改善は主にブラウザで体感確認

### ストーリー計画

- UI変更なし。既存ストーリーでの動作確認のみ
