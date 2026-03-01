## 現在のタスク

ProofWorkspace.tsx のカバレッジ改善（Stmts 80.79% → 目標 95%+, Branch 68.97% → 目標 90%+）

**根拠:** CLAUDE.md の指示「カバレッジが100%でないファイルがあれば、ストーリー実装の前にまずカバレッジ改善を優先」

**対象ファイル:** `src/lib/proof-pad/ProofWorkspace.tsx`

**方針:**
- Uncovered lines を特定し、テストで到達可能なパスを網羅
- UIコンポーネントのため、Testing Library によるインタラクションテストが中心
- 到達不能な防御的コードは `/* v8 ignore start/stop */` で除外
