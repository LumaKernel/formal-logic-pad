## カバレッジ改善: modelAnswer.ts ブランチカバレッジ向上

**タスク領域:** カバレッジ改善（タスクファイルなし — 自主的なカバレッジ改善）

**対象ファイル:** `src/lib/quest/modelAnswer.ts` (Branch 89.65%)

### 未カバーブランチ

1. **Line 77:** `isTrivialAxiomSubstitution` 内の `value.subscript !== undefined` の true 分岐（subscript付きMetaVariable）
2. **Lines 489-504:** `buildSubstitutionEntriesFromMaps` 内の `formula !== undefined` / `term !== undefined` の true 分岐

### テスト計画

- **テストファイル:** `src/lib/quest/modelAnswer.test.ts`
- Line 77: subscript付きMetaVariableを含む公理代入パターンのテスト追加
- Lines 489-504: `buildSubstitutionEntriesFromMaps` が実際に代入エントリを構築するパスのテスト追加

### ストーリー計画

- UI変更なし — ストーリー不要
