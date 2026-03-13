## 現在のタスク

**出典:** `tasks/prd-inserted-tasks.md` > shadcn-ui wayに変更 > アップバーのタイトルブランド

### 内容

HubPageView.tsx のヘッダーにあるタイトル「Formal Logic Pad」のブランド表示を shadcn-ui way に変換する。
現在は単純な `<span className="text-xl font-bold tracking-tight text-foreground">` で表示されている。

### テスト計画

- HubPageView.test.tsx / HubPageView.stories.tsx の既存テストが「Formal Logic Pad」テキストを検索しているため、テキスト自体は変更しない
- 既存テスト/ストーリーがそのまま通ることを確認
- スタイル変更のみなので新規テスト追加は不要

### ストーリー計画

- HubPageView.stories.tsx の既存ストーリーでブランド表示を確認
- 新規ストーリー追加は不要（既存の Empty Notebooks ストーリーで確認可能）
