## 現在のタスク

カバレッジ改善（Branch カバレッジ向上）

**ソース:** カバレッジレポートから（Branchが低いファイルの特定と改善）

### 対象ファイル（Branch % が低い順）

1. `EdgeParameterPopover.tsx` - Branch 65.21%
2. `storageService.ts` - Branch 66.66%
3. `TruthTableComponent.tsx` - Branch 75.75%
4. `nodeRoleLogic.ts` - Branch 75%
5. `useNodeSearch.ts` - Branch 75%
6. `languageToggleLogic.ts` - Branch 75%
7. `themeToggleLogic.ts` - Branch 75%
8. `questCatalogListLogic.ts` - Branch 82.60%

### テスト計画

- 各ファイルの未カバー行を確認し、テストを追加・更新
- 純粋ロジック系ファイルから優先的に対処
- テストファイルは既存の `*.test.ts` / `*.test.tsx` に追記

### ストーリー計画

- UI変更なし（テスト追加のみ）
