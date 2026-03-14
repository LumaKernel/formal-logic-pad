カバレッジ改善: 不純領域の除外設定追加 + 低ブランチカバレッジ改善

元ファイル: CLAUDE.md指示に基づくカバレッジ改善（100%を目指す）

## テスト計画

- AntDesignThemeProvider.tsx を vitest.config.ts の除外設定に追加（不純なフレームワーク統合コード）
- 低ブランチカバレッジファイルを調査し、テスト追加またはv8 ignore対応

## ベースライン

- All files: Stmts 99.59%, Branch 98.61%, Funcs 98.82%, Lines 99.59%
- AntDesignThemeProvider.tsx: 0% (不純領域 → 除外)
- ReferenceBrowserComponent.tsx: Branch 77.08%
- ReferenceFloatingWindow.tsx: Branch 69.56%
- ReferenceViewerPageView.tsx: Branch 77.77%
- referenceBrowserLogic.ts: Branch 75%
- CustomQuestListComponent.tsx: Stmts 88.05%, Branch 93.18%, Funcs 81.01%
