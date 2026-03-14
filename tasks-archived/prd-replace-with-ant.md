# shadcn-ui → Ant Design 移行タスクリスト

## Phase 0: パッケージ削除・インフラ整理 ✅ 完了

- [x] shadcn-ui 関連パッケージを package.json から削除
- [x] `components.json` 削除、`src/components/ui/button.tsx` 削除
- [x] `src/lib/utils.ts` の cn() を clsx のみに変更
- [x] `postcss.config.mjs`, `.storybook/main.ts` から Tailwind 除去
- [x] `globals.css` から Tailwind ディレクティブ除去
- [x] typecheck・lint・test 通過確認

## Phase 1: Ant Design 導入・テーマ基盤 ✅ 完了

- [x] `antd` と `@ant-design/icons` をインストール
- [x] AntDesignThemeProvider 作成（ConfigProvider + darkAlgorithm 連携）
- [x] HubContent, WorkspaceContent, ReferenceViewerContent に統合
- [x] Storybook decorator に AntThemeWrapper 追加（light/dark/side-by-side対応）

## Phase 2: Tailwind ユーティリティクラスの置き換え ✅ 完了

全コンポーネント（28ファイル）のTailwindユーティリティクラスをReact CSSPropertiesインラインスタイルに変換。hover/focus擬似クラスはglobals.cssのCSS定義に移行。テストも更新済み。layout.tsx・Storybook・テストファイル内のclassNameはTailwindではなくCSS独自クラスのため変更不要。

## Phase 3: shadcn カラートークンの CSS 変数化 ✅ 完了

Phase 0/2で`@theme inline`ブロック除去済み。全コンポーネントは既に`var(--ui-*)`/`var(--color-*)`CSS変数を直接参照しており、追加作業不要。

## Phase 4: lucide-react → @ant-design/icons 移行 ✅ 完了

- [x] ThemeToggleのSun/Moon/Monitor → SunOutlined/MoonOutlined/DesktopOutlinedに置換
- [x] lucide-react, clsx パッケージ削除、未使用utils.ts削除

## Phase 5: 最終クリーンアップ ✅ 完了

- [x] globals.cssからshadcn関連参照なし確認済み
- [x] clsx削除済み（未使用）
- [x] 全品質チェック (typecheck, lint, test) パス — 272ファイル、10950テスト全通過
- [x] ブラウザ確認（Storybook: ThemeToggle, Hub）— スクリーンショット撮影済み
