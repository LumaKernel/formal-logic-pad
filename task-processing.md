## 実行中タスク

カバレッジ改善（Branch/Func coverage向上）

Source: カバレッジレポート分析（prd-inserted-tasks.md は空、カバレッジが100%でないため改善優先）

### ベースライン

- Stmts: 99.4%, Branch: 94.18%, Funcs: 89.75%, Lines: 100%
- 6846テスト全パス

### テスト計画

1. **ProofWorkspace.tsx Term substitution branch** (Lines 3697-3699, 3719)
   - 述語論理/等式論理システムで項メタ変数を持つ公理の代入テスト
   - "Term"ラベルと"S(0)"プレースホルダーの表示確認
   - テストファイル: `src/lib/proof-pad/ProofWorkspace.test.tsx`

2. **workspaceState.ts SC rule branches** (Lines 1125-1155)
   - SC規則適用でsingle-resultとbranching-resultのテスト追加
   - テストファイル: `src/lib/proof-pad/workspaceState.test.ts`

3. **workspaceState.ts removeSelectedNodes early return** (Line 1226)
   - 空セットでの早期返却テスト
   - テストファイル: `src/lib/proof-pad/workspaceState.test.ts`

4. **その他低Branchファイル**の確認・改善

### ストーリー計画

- UI変更なし（テスト追加のみ）
