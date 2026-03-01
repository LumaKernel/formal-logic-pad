## 現在のタスク

**出典:** `tasks/prd-advanced.md` B2

- [-] B2. **TAB の証明木構築UI** - シーケント右辺が常に空（Γ ⇒）という特徴を活かした専用UI。閉じた枝の視覚化 (bekki Ch.12 定義12.6)

### サブステップ (B2-3): TAB推論規則適用ロジック

B2-1 (DeductionSystem統合) ✅完了、B2-2 (規則パレットUI) ✅完了

次は **TAB推論規則の適用ロジック** を実装する:
- `tabApplicationLogic.ts`: 純粋バリデーション関数（3層パターンの第1層）
- `TabInferenceEdge` 型: InferenceEdge union の拡張
- `workspaceState.ts` 統合: 状態管理（3層パターンの第2層）
- `ProofWorkspace.tsx` 統合: UI操作ハンドラ（3層パターンの第3層）

### 周辺情報

- TABはツリー構造(TabProofNode)で、既存Hilbert/NDのフラットDAGとは根本的に異なる
- しかし InfiniteCanvas + ノード + エッジ のモデルは共通で使える
- TAB規則は14種、うち分岐3種(¬∧, ∨, →)
- 固有変数条件: ¬∀, ∃
- 代入項: ∀, ¬∃
