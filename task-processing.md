# 現在のタスク

**ソース**: CLAUDE.md の指示「カバレッジが100%でないファイルがあれば、ストーリー実装の前にまずカバレッジ改善を優先してください」

## タスク

`src/lib/logic-core/cutElimination.ts` のテストカバレッジ改善 (93.42% → 100%目標)

### 周辺情報

- 現在のカバレッジ: Stmts 93.42%, Branch 81.16%, Lines 100% (但しuncovered lines多数)
- Uncovered lines: 1370, 1456, 1511 周辺
- cutElimination.ts はカット除去アルゴリズムの純粋ロジック（二重帰納法）
- 既存テスト: 176テスト in cutElimination.test.ts
