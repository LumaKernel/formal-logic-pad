# shadcn-ui → Ant Design 移行タスクリスト

## Phase 0: パッケージ削除・インフラ整理

- [ ] shadcn-ui 関連パッケージを package.json から削除
  - `@radix-ui/react-slot` (button.tsx のみで使用)
  - `class-variance-authority` (button.tsx のみで使用)
  - `tailwind-merge` (utils.ts の cn() で使用)
  - `tailwindcss` (CSS フレームワーク本体)
  - `@tailwindcss/postcss` (PostCSS プラグイン)
- [ ] `components.json` (shadcn 設定ファイル) を削除
- [ ] `src/components/ui/button.tsx` を削除（インポートなし・未使用）
- [ ] `src/lib/utils.ts` の cn() を clsx のみに変更（`twMerge` 除去）
- [ ] `postcss.config.mjs` から `@tailwindcss/postcss` を除去（空 or 不要なら削除）
- [ ] `.storybook/main.ts` から Tailwind PostCSS 設定を除去
- [ ] `src/app/globals.css` から `@import "tailwindcss"` と `@theme inline` ブロック、`@custom-variant dark` を除去
- [ ] `npm install` で依存関係をクリーンアップ
- [ ] typecheck・lint・test が通ることを確認

## Phase 1: Ant Design 導入・テーマ基盤

- [ ] `antd` と `@ant-design/icons` をインストール
- [ ] Ant Design の ConfigProvider + theme を設定（Next.js App Router 対応）
- [ ] 既存 CSS 変数 (`--color-*`, `--font-*`) を Ant Design トークンシステムにマッピング
- [ ] ダークモード切替: ThemeProvider を Ant Design の `theme.algorithm` (darkAlgorithm) と連携
- [ ] Storybook に Ant Design テーマプロバイダーを設定

## Phase 2: Tailwind ユーティリティクラスの置き換え（41 ファイル・409 箇所）

Tailwind ユーティリティクラス（`flex`, `gap-*`, `text-sm`, `rounded-*` 等）を CSS-in-JS / plain CSS / Ant Design の Flex・Typography 等に置き換える。

### Hub・レイアウト (3 ファイル)

- [ ] `src/app/HubPageView.tsx` (45 className) — タブ・カード・レイアウト
- [ ] `src/app/workspace/[id]/WorkspacePageView.tsx` (18 className) — ワークスペースレイアウト
- [ ] `src/app/layout.tsx` (1 className) — ルートレイアウト

### Proof Pad (10 ファイル)

- [ ] `src/lib/proof-pad/GoalPanel.tsx` (38 className) — ゴールパネル
- [ ] `src/lib/proof-pad/CutEliminationStepper.tsx` (19 className) — カット除去ステッパー
- [ ] `src/lib/proof-pad/EditableProofNode.tsx` (15 className) — 証明ノード
- [ ] `src/lib/proof-pad/AtRulePalette.tsx` (9 className) — AT ルールパレット
- [ ] `src/lib/proof-pad/EdgeParameterPopover.tsx` (7 className) — エッジパラメータ
- [ ] `src/lib/proof-pad/TabRulePalette.tsx` (6 className) — TAB ルールパレット
- [ ] `src/lib/proof-pad/ScRulePalette.tsx` (6 className) — SC ルールパレット
- [ ] `src/lib/proof-pad/NdRulePalette.tsx` (5 className) — ND ルールパレット
- [ ] `src/lib/proof-pad/AxiomPalette.tsx` (4 className) — 公理パレット

### Quest・Notebook (4 ファイル)

- [ ] `src/lib/quest/CustomQuestListComponent.tsx` (90 className) — カスタムクエストリスト
- [ ] `src/lib/notebook/NotebookCreateFormComponent.tsx` (21 className) — ノートブック作成フォーム
- [ ] `src/lib/notebook/NotebookListComponent.tsx` (19 className) — ノートブックリスト
- [ ] `src/lib/quest/QuestCatalogComponent.tsx` (10 className) — クエストカタログ

### Reference (1 ファイル)

- [ ] `src/lib/reference/ReferenceBrowserComponent.tsx` (22 className) — リファレンスブラウザ

### Components (3 ファイル)

- [ ] `src/components/ScriptEditor/ScriptEditorComponent.tsx` (31 className) — スクリプトエディタ
- [ ] `src/components/ThemeToggle/ThemeToggle.tsx` (6 className) — テーマ切替（lucide-react → @ant-design/icons も検討）
- [ ] `src/components/LanguageToggle/LanguageToggle.tsx` (2 className) — 言語切替

### Formula Input (10 ファイル)

- [ ] `src/lib/formula-input/FormulaDisplay.tsx` (1 className)
- [ ] `src/lib/formula-input/FormulaEditor.tsx` (1 className)
- [ ] `src/lib/formula-input/FormulaInput.tsx` (1 className)
- [ ] `src/lib/formula-input/FormulaKaTeX.tsx` (1 className)
- [ ] `src/lib/formula-input/TermDisplay.tsx` (1 className)
- [ ] `src/lib/formula-input/TermEditor.tsx` (1 className)
- [ ] `src/lib/formula-input/TermInput.tsx` (1 className)
- [ ] `src/lib/formula-input/TermKaTeX.tsx` (1 className)
- [ ] `src/lib/truth-table/TruthTableComponent.tsx` (7 className)
- [ ] `src/lib/proof-collection/ProofCollectionPanel.tsx` (5 className)

### テストファイル内の className (5 ファイル)

- [ ] `src/lib/formula-input/FormulaDisplay.test.tsx` (1)
- [ ] `src/lib/formula-input/FormulaInput.test.tsx` (1)
- [ ] `src/lib/formula-input/FormulaKaTeX.test.tsx` (1)
- [ ] `src/lib/formula-input/TermDisplay.test.tsx` (1)
- [ ] `src/lib/formula-input/TermInput.test.tsx` (1)
- [ ] `src/lib/formula-input/TermKaTeX.test.tsx` (1)

### Storybook デモファイル (3 ファイル)

- [ ] `src/stories/Page.tsx` (3 className)
- [ ] `src/stories/Header.tsx` (2 className)
- [ ] `src/stories/Button.tsx` (1 className)
- [ ] `src/stories/button.css`, `src/stories/page.css`, `src/stories/header.css` — Tailwind 依存があれば修正
- [ ] `src/components/ThemeToggle/ThemeToggle.stories.tsx` (2 className)

## Phase 3: shadcn カラートークンの CSS 変数化

globals.css の `@theme inline` で定義していた shadcn トークン (`bg-primary`, `text-foreground` 等) を使っているファイルを、CSS 変数 (`var(--color-*)`) 参照に切り替える。

- [ ] shadcn トークン (`bg-primary`, `text-muted-foreground`, `border-ui-border` 等) の使用箇所を洗い出し
- [ ] 各ファイルで CSS 変数直接参照 or Ant Design トークン参照に置き換え

## Phase 4: lucide-react → @ant-design/icons 移行

- [ ] `src/components/ThemeToggle/ThemeToggle.tsx` — Sun, Moon, Monitor アイコンを Ant Design アイコンに置き換え
- [ ] `lucide-react` を package.json から削除

## Phase 5: 最終クリーンアップ

- [ ] globals.css から shadcn 関連コメント・不要セクションを整理
- [ ] `clsx` が不要になった場合は削除（Ant Design の className 合成で十分か確認）
- [ ] 全品質チェック (typecheck, lint, test, coverage) パス
- [ ] ブラウザ確認（ダークモード・ライトモード両方）
- [ ] Storybook 全ストーリー確認
