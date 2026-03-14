# 現在のタスク

**ソース:** tasks/prd-replace-with-ant.md — Phase 0: パッケージ削除・インフラ整理

## タスク

- [ ] Phase 0: shadcn-ui 関連パッケージ削除・インフラ整理
  - [ ] shadcn-ui 関連パッケージを package.json から削除
  - [ ] `components.json` 削除
  - [ ] `src/components/ui/button.tsx` 削除
  - [ ] `src/lib/utils.ts` の cn() を clsx のみに変更
  - [ ] `postcss.config.mjs` から Tailwind 除去
  - [ ] `.storybook/main.ts` から Tailwind 除去
  - [ ] `globals.css` から Tailwind directives 除去
  - [ ] `npm install` でクリーンアップ
  - [ ] typecheck・lint・test 通過確認

## テスト計画

- cn() を使っているファイル (LanguageToggle, ScriptEditor, TruthTable) のテストが通ること
- Storybook ビルドが通ること
- 既存テスト全パス

## ストーリー計画

- Tailwind/shadcn インフラ除去。UI の見た目変更は最小限に抑える
