## 実行中タスク

カバレッジ改善: ProofWorkspace.tsx のBranch coverage改善（76.1% → 目標: 80%+）

**元タスク:** カバレッジ改善イテレーション（progress.txtのCodebase Patternsに基づく継続作業）

### テスト計画

- `src/lib/proof-pad/ProofWorkspace.test.tsx` に未カバーブランチのテストを追加
- ProofWorkspace.tsx の未カバー行を確認し、テスト可能なブランチを特定
- 到達不能な防御的コードには `v8 ignore` を追加

### ストーリー計画

- UI変更なし（テスト追加のみ）

### ベースラインカバレッジ

- ProofWorkspace.tsx: Stmts 90.09%, Branch 76.1%, Lines 91.25%
- 全体: Stmts 98.76%, Branch 93.3%, Lines 99.22%
