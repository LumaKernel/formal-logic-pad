## 現在のタスク

from: `tasks/inserted-tasks.md`

- [ ] コントラストなどのa11y要因の検査を自動テストに組込もう (Storybook)

### コンテキスト
- `@storybook/addon-a11y` v10.2.8 は既にインストール・設定済み
- `.storybook/vitest.setup.ts` に `a11yAddonAnnotations` インポート済み
- `.storybook/preview.ts` の `a11y: { test: "todo" }` を `"error"` に変更すればCI失敗化

### テスト計画
- `preview.ts` の `test: "todo"` → `"error"` に変更
- Storybook テストを実行し、a11y違反で落ちるストーリーを特定
- 違反を修正するか、既知問題は個別ストーリーで `parameters.a11y.test: "todo"` オーバーライド

### ストーリー計画
- 既存ストーリーのa11y違反修正が主。新規ストーリー追加なし