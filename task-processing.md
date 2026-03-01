## 実行中タスク

**出典:** CLAUDE.md カバレッジ要件 + ベースラインレポート（100%目標）

**タスク:** logic-core/logic-lang の純粋ロジックファイルのカバレッジ改善（100%目標）

対象ファイル（Stmts < 100%）:
- `src/lib/logic-core/unification.ts`: 97.33% → 100% (未カバー行: 124, 248-249)
- `src/lib/logic-lang/parser.ts`: 96.93% → 100% (未カバー行: 171, 617)
- `src/lib/logic-core/inferenceRule.ts`: 98.84% → 100% (未カバー行: 990-991, 1473-1474)
- `src/lib/logic-core/formula.ts`: 98.07% → 100%

### テスト計画

- `src/lib/logic-core/unification.test.ts` に未カバーパスのテスト追加
- `src/lib/logic-lang/parser.test.ts` に未カバーパスのテスト追加
- `src/lib/logic-core/inferenceRule.test.ts` に未カバーパスのテスト追加
- `src/lib/logic-core/formula.test.ts` に未カバーパスのテスト追加

### ストーリー計画

- UI変更なし（純粋ロジックのテスト追加のみ）

### デグレ対策

- 既存テストがすべてパスすることを確認
