## 現在のタスク

**出典:** `tasks/prd-inserted-tasks.md`

- [-] shadcn-ui wayに以下を変えていって
  - [ ] アップバーの言語選択やテーマ選択

### 周辺情報

- LanguageToggle: `src/components/LanguageToggle/LanguageToggle.tsx` — 現在インラインCSS変数ベースのスタイル
- ThemeToggle: `src/components/ThemeToggle/ThemeToggle.tsx` — 既にshadcn CSS変数（bg-muted等）を部分的に使用
- Header: `src/app/HubPageView.tsx` L154-173, L562-591 — CSSPropertiesオブジェクトでスタイル定義
- shadcn-ui button: `src/components/ui/button.tsx` — 既にセットアップ済み
- globals.css: shadcn-ui テーマトークン（@theme inline）定義済み

### テスト計画

- 既存テスト（LanguageToggle.test.tsx, ThemeToggle.test.tsx, HubPageView.stories.tsx）が引き続きパスすることを確認
- スタイル変更のみのため新規テスト追加は不要

### ストーリー計画

- 既存ストーリー（LanguageToggle.stories.tsx, ThemeToggle.stories.tsx, HubPageView.stories.tsx）で視覚確認
- スクリーンショットでbefore/after比較
