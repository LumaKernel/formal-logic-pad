## 現在のタスク

**ソース**: `tasks/prd-extra-nd-workspace.md`

- [ ] **ND-004: ND用バリデーションロジック**
  - 各ND規則の適用バリデーション（`naturalDeduction.ts` のロジックをUI層に接続）
  - 仮定のdischarge管理

### 周辺情報
- `naturalDeduction.ts` に `validateNdProof` は既に実装済み
- ワークスペースレベルでの接続が未実装: `revalidateInferenceConclusions()` で `isHilbertInferenceEdge` ガードにより ND エッジはスキップされている
- Hilbert の MP/Gen/Substitution パターン（`mpApplicationLogic.ts` 等）に準拠して `ndApplicationLogic.ts` を新設する
- 11種の ND エッジ型すべてに対してバリデーション関数を実装
- Effect.ts パターン（内部 Effect → 公開 Either）を使用
