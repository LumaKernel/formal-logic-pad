## 現在のタスク

**ソース:** `tasks/prd-dark-mode.md` US-002

### US-002: CSS変数によるテーマトークンの整備

- [ ] `globals.css` の既存 `prefers-color-scheme` メディアクエリを `[data-theme="dark"]` セレクタに移行する
- [ ] CSS変数を定義（--color-bg-primary, --color-text-primary, etc.）
- [ ] `[data-theme="light"]` と `[data-theme="dark"]` の両方で値を定義
- [ ] WCAG AA基準（コントラスト比4.5:1以上）を両モードで満たす
- [ ] `page.module.css` の `prefers-color-scheme` メディアクエリも `[data-theme]` セレクタに移行
- [ ] 型チェック/lintが通る
