# 実行中タスク

**元ファイル:** `tasks/prd-advanced.md`

## C2. カット除去のステップバイステップ可視化

証明図中のカット規則を段階的に除去していくステッパーUI。階数 (rank) と深さ (depth) による二重帰納法の過程を視覚化。

### 周辺情報

- カット除去の純粋ロジック(`cutElimination.ts`)は完了済み
- `eliminateCutsWithSteps` APIが使用可能（ステップごとのproof状態、depth、rank情報付き）
- `CutEliminationStep`型: `{ description, proof, depth, rank }`
- ProofWorkspaceにはまだカット除去UI統合なし
- 今回のスコープ: カット除去ステッパーの純粋ロジック + UIコンポーネント
