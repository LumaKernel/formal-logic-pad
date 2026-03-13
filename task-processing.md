## タスク

- 既存のコンポーネントをそれぞれできるかぎり移行しよう（from: tasks/prd-inserted-tasks.md）

### 対象

CSS Modules を使っている4ファイルを Tailwind に移行する:

1. `src/components/LanguageToggle/LanguageToggle.module.css` → Tailwind
2. `src/lib/truth-table/TruthTableComponent.module.css` → Tailwind
3. `src/components/ScriptEditor/ScriptEditorComponent.module.css` → Tailwind
4. `src/app/page.module.css` → Tailwind

### テスト計画

- 既存テストがすべてパスすることを確認（スタイル変更のみなので新規テスト追加は不要）
- ブラウザでスクリーンショット確認

### ストーリー計画

- 既存ストーリーの表示確認（LanguageToggle, TruthTable, ScriptEditor, Page）
- 新規ストーリー追加は不要（既存ストーリーで十分カバー）
