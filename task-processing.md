## タスク

カバレッジ改善: normalForm.ts, nodeRoleLogic.ts, grid.ts 等のBranchカバレッジ改善

元: 継続的カバレッジ改善作業（prd-logic-pad-world.md 周辺の品質強化）

## テスト計画

- normalForm.ts: switch文→if-chain変換（v8 switch artifact対策）。Lines 144, 221, 536, 672。
  - distributeCNF, distributeDNF, pullQuantifiers: switch→if-chain
  - isPNF の while→if pattern (line 672)
- nodeRoleLogic.ts: Line 97 の `classification === "root-unmarked"` ブランチ確認
  - nodeRoleLogic.test.ts にテスト追加（"root-unmarked" ケース）
- grid.ts: Line 10 のデフォルト引数ブランチ
  - grid.test.ts にデフォルト引数テスト追加

## ストーリー計画

UI変更なし

## ベースラインカバレッジ

- Stmts: 99.11%
- Branch: 94.54%
- Funcs: 89.31%
- Lines: 99.85%
- normalForm.ts Branch: 87.58%
- nodeRoleLogic.ts Branch: 75%
- grid.ts Branch: 88.88%
