# theme モジュール

テーマ管理ライブラリ。ライト/ダーク/システムの3モード切り替え。

## 依存関係

- React のみ（外部ライブラリなし）

## 設計パターン

- `themeLogic.ts`: 純粋ロジック（型定義、resolveTheme、nextThemeMode）— DOM/Reactなし
- `useTheme.ts`: React hook — localStorage永続化、matchMedia監視、data-theme属性同期
- `ThemeProvider.tsx`: React Context provider — useThemeをContextで公開

## ファイル構成

- `themeLogic.ts`: 純粋な型・定数・関数
- `useTheme.ts`: hook + localStorage/matchMedia アダプター
- `ThemeProvider.tsx`: Context provider + 便利hook（useThemeContext, useResolvedTheme, useThemeMode）

## テスト

- `themeLogic.test.ts`: 純粋関数テスト（18テスト）
- `useTheme.test.tsx`: hook/コンポーネントテスト（20テスト） — matchMediaモック必要
- `ThemeDemo.stories.tsx`: Storybook ストーリー（インタラクションテスト）

## matchMediaモックパターン

テストでは `window.matchMedia` を vi.fn() でモックする。`addEventListener` に渡されたコールバックを収集し、`act()` 内で呼び出してシステム設定変更をシミュレートする。
