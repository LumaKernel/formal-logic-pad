## タスク: Vercel で Storybook プロダクションビルドを配布

**出典:** `tasks/inserted-tasks.md` — 「vercelでビルドするときに、Next.js publicとして、どこかのサブディレクトリに、パス /storybook 配下に、ストーリーブックのプロダクションビルドを含めて配布されるようにしよう」

### 要件

- Next.js プロダクションビルド時に Storybook もビルドし、`/storybook` パスで配信
- Vercel デプロイで利用可能にする

### テスト計画

- ローカルでビルドして `/storybook/index.html` が生成されることを確認
- CI で build コマンドが成功することを確認

### ストーリー計画

- UI 変更なし
