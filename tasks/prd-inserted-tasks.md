# 差し込みタスク

- [x] shadcn-ui wayに以下を変えていって
  - [x] アップバーの言語選択やテーマ選択（LanguageToggle/ThemeToggle/ヘッダーをTailwindユーティリティに統一、Storybook Tailwind v4設定修正）
  - [x] アップバーのタイトルブランド（Sigmaアイコン追加、font-semibold/text-lg/select-none、text-primary アイコン色）
  - [x] トップページのタブ（タブバー・タブボタンのCSSProperties→Tailwindクラス変換。bg-card/border-ui-border/text-primary/text-muted-foreground使用）
  - [x] リファレンスの検索欄、各検索ボタン、検索結果のドキュメントカード（CSSProperties→Tailwindクラス変換、bg-card/border-ui-border/text-foreground/text-muted-foreground/bg-primary使用）
  - [x] 各タブのボタンやアイコンボタン(三点リーダーなど)（NotebookList/HubPageView/WorkspacePageView/QuestCatalog/CustomQuestList/ProofCollectionPanelのボタン・メニュー・削除確認・共有パネル変換完了）
  - [x] 各種フォーム(ノートやクエスト作成)（NotebookCreateForm: 16 CSSProperties→Tailwind, CustomQuestList: edit/create/importフォーム13 CSSProperties→Tailwind）
  - [x] パッド内の各種アクションをするための起点、ボタンなど（9ファイル: AxiomPalette, NdRulePalette, TabRulePalette, ScRulePalette, AtRulePalette, EdgeParameterPopover, CutEliminationStepper, GoalPanel, EditableProofNode）
- [x] かっこいいfaviconを作って置き換えて。アップバーのタイトルブランドもテーマにちなんだ形にかっこいいものに
- [ ] リファレンスの上のほうに、入門者はこちらから、これを学ぶならここから、のように章だてのガイドの起点となるものを並べよう。
- [ ] マークダウンの中でも Unicode の φ などが使われてる箇所があるが、すべてTeXに統一しよう。
