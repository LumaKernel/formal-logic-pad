## 現在のタスク

**出典:** `tasks/prd-inserted-tasks.md`

**タスク:** アクセシビリティ基準がバラバラだから、shadcn-uiを入れよう（初期セットアップ）

**スコープ:** このイテレーションでは shadcn-ui の導入と初期セットアップのみ。既存コンポーネントの移行は後続イテレーション。

### 周辺情報

- 現在のUI: CSS Modules + CSS変数（globals.css）。UIライブラリなし、Tailwindなし
- Next.js 16, React 19, Storybook 10
- shadcn-ui は Tailwind CSS v4 が前提
- 既存のテーマシステム（data-theme属性 + CSS変数）との共存が必要

### テスト計画

- shadcn-ui導入はインフラ変更。既存テストがすべてパスすることを確認
- Tailwind導入後にtypecheck, lint, test, storybookが壊れないことを確認
- 新しいテストファイルの追加は不要（コンポーネント追加は後続タスク）

### ストーリー計画

- このイテレーションではUIコンポーネント追加なし。セットアップのみ
- 既存ストーリーが壊れないことを確認
