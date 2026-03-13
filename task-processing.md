# タスク処理中

## 実行中タスク

From: `tasks/prd-inserted-tasks.md`

- [ ] コードがレンダーされていなさそう。バックティック？の囲みマークがそのまま出てきてしまっている。 http://localhost:13000/reference/guide-basic-operations など

### バグ修正

- InlineMarkdownコンポーネントがコードブロック (`code`) をパースしているが、バックティックのまま表示されている問題

### テスト計画

- InlineMarkdown.test.tsx に既存テストがあるか確認し、レンダリングのテストを追加

### ストーリー計画

- ブラウザで実際のレンダリング確認（スクリーンショット撮影）
