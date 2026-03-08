## カバレッジ改善（第6回）

**出典:** ベースラインカバレッジ分析（Stmts 99.78%, Branch 98.56%）

### 対象

1. **ProofWorkspace.tsx** Lines 3969-3970: collectionEntries 定義時の「コレクションを開く」ボタンクリックテスト追加
2. **ProofWorkspace.tsx** Line 4251: `/* v8 ignore next */` を `/* v8 ignore start/stop */` に修正
3. **ProofWorkspace.tsx** Line 4705, 4889-4890: 他の uncovered lines のテスト追加可能か調査
4. **proofCollectionPanelLogic.ts** Branch: v8集約アーティファクト（単一テストでは100%）- 対策不要

### テスト計画

- `ProofWorkspace.test.tsx` にコレクションパネル開閉テスト追加
- `ProofWorkspace.test.tsx` に他の uncovered handler のテスト追加（可能な範囲）

### ストーリー計画

- UI変更なし
