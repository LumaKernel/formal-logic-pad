## タスク

**出典:** `tasks/inserted-tasks.md` line 10

> JA設定でドキュメントページのbreadcrumbsの最初が home のまま

## テスト計画

- `referenceViewerLogic.test.ts` の日本語パンくずテスト（line 101-109）の期待値を `"Home"` → `"ホーム"` に更新
- `referenceViewerLogic.test.ts` の `buildViewerPageData` パンくずテスト（line 154-158）は英語テストなので変更不要

## ストーリー計画

- UI変更なし（ラベルテキストの修正のみ）。ブラウザで日本語設定のドキュメントページを確認
