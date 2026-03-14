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
