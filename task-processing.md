## 実行中タスク

**ソース:** `tasks/prd-dark-mode.md` > US-001

### US-001: テーマコンテキストとプロバイダーの作成

開発者として、アプリ全体のテーマ状態をReact Contextで管理し、どのコンポーネントからでもテーマを参照・変更できるようにしたい。

**受け入れ基準:**
- `src/lib/theme/` にテーマ管理ライブラリを作成
- `ThemeProvider` コンポーネントを作成し、`"light" | "dark" | "system"` の3モードを管理
- `useTheme()` hookを作成
- `"system"` 選択時は `matchMedia("(prefers-color-scheme: dark)")` を監視
- 選択モードをlocalStorageに保存
- ユニットテストで検証
- 型チェック/lintが通る

**ベースライン:** 84 files, 1767 tests, Stmts 99.2%, Lines 99.88%
