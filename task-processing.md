## 実行タスク

prd-logic-pad-world.md 周辺タスク（カバレッジ改善継続）

### タスク

switch→if-chain 変換で Branch カバレッジ向上（複数ファイル対象）

### テスト計画

- テスト追加なし（既存テストで全ケースカバー済み）
- 変換対象: Branchカバレッジが100%未達のファイルにあるswitch文でv8 artifactが原因のもの

### 対象ファイル候補

- `questCatalogListLogic.ts`: ratingLabel, ratingColor, ratingCssVars (Branch 86.95%)
- `parser.ts`: tokenToBinaryOperator等 (Branch 95.02%)
- `proofMessages.ts`: switch文 (Branch 95%)
- `scApplicationLogic.ts` / `tabApplicationLogic.ts`: 推論規則分岐
- ProofWorkspace.tsx内の防御的コードへのv8 ignore追加
