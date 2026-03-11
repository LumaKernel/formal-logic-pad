# カバレッジ改善タスク

ソース: カバレッジレポート分析（100%未満ファイル）

## 対象ファイル

- panelPositionLogic.ts: Branch 83.33% (lines 156, 267)
- TermDisplay.tsx: Branch 89.47% (lines 68-72)
- ProofWorkspace.tsx: Branch 96.2% (lines 1420-1442)
- EditableProofNode.tsx: Lines 97.43% (lines 334, 363)
- formula.ts: Stmts 98.07%

## テスト計画

- 各ファイルの未カバーブランチを特定
- テスト追加 or v8 ignore による対処
- 防御的コード（到達不能）は v8 ignore start/stop
- テストで到達可能なコードはテスト追加
