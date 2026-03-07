## 実行中タスク

カバレッジ改善: 純粋ロジックファイルの未カバーブランチを網羅

**出典:** CLAUDE.md のカバレッジ改善方針（100%カバレッジを目指す）

### テスト計画

1. `src/lib/quest/questNotebookIntegration.test.ts` - "AllAchieved" ブランチのテスト追加
2. `src/lib/quest/questUrlSharing.test.ts` - 不正UTF-8デコードのエッジケーステスト追加
3. `src/lib/quest/modelAnswer.ts` - v8 ignoreされたTABエラーパスは対象外（防御的コード）

### ストーリー計画

- UI変更なし（テスト追加のみ）

### ベースラインカバレッジ

- All files: Stmts 98.4%, Branch 92.84%, Funcs 88.27%, Lines 99.28%
- questNotebookIntegration.ts: Stmts 94.87%, Lines 96.29% (uncovered: line 138)
- questUrlSharing.ts: Stmts 96.07%, Lines 98.47% (uncovered: lines 190, 204)

### 備考

- QuestCatalogComponent.tsx (79.14%) の低カバレッジはV8カバレッジのStorybook aggregationの問題
  - 単体テスト実行では100%カバレッジ
  - 全テスト実行時のStorybookテストとのマージでカバレッジが下がる既知の問題
