## 現在のタスク

**ソース:** `tasks/prd-inserted-tasks.md` - shadcn-ui導入のサブタスク
> ダークモードや、色の使い方、切り替えなども基本的にフレームワークの仕組みにのせよう

### 背景

- shadcn-ui + Tailwind CSS v4 は `67bea98` で初期セットアップ済み
- Button コンポーネントのみ導入済み（`src/components/ui/button.tsx`）
- 既存テーマは `data-theme` 属性 + CSS変数で管理
- shadcn-ui の `--ui-*` トークンは `globals.css` に定義済み
- Tailwind v4 の `dark:` バリアントがまだ `data-theme="dark"` に対応していない

### テスト計画

- `src/components/ThemeToggle/ThemeToggle.test.tsx` を更新（CSS Modules→Tailwind classに合わせたテスト修正）
- `src/components/ThemeToggle/ThemeToggle.stories.tsx` を確認

### ストーリー計画

- ThemeToggle.stories.tsx の既存ストーリーが引き続き動作することを確認

### 実装計画

1. `globals.css` に `@custom-variant dark` を追加（`[data-theme="dark"]` セレクタ）
2. ThemeToggle を CSS Modules → Tailwind utility classes に移行
3. ThemeToggle.module.css を削除（.trashed にリネーム）
