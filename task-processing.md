## 現在のタスク

**出典:** `tasks/prd-inserted-tasks.md` - shadcn-ui way変換シリーズ

- [ ] トップページのタブをshadcn-ui wayに変換する

### 周辺情報

- アップバーの言語選択・テーマ選択・タイトルブランドは完了済み
- 次はトップページ（HubPageView）のタブUIをshadcn-uiパターンに変換

### テスト計画

- 既存テスト: `src/app/HubPageView.stories.tsx` (24テスト) のplay関数で動作確認
- ロジック変更なし（スタイル変更のみ）のため新規テスト追加は不要
- 全既存テストがパスすることを確認

### ストーリー計画

- HubPageView.stories.tsx の既存ストーリーでUI確認
- Playwright MCPでスクリーンショット撮影して視覚確認
