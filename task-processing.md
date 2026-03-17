## 現在のタスク

**出典:** `tasks/prd-inserted-tasks.md` L52-56

> 置換した先として繋ぐ、というコンテキストメニューのアクションを用意しよう。
>
> - 置換した先として繋げるか、ということの判定を純粋に作成
> - 可能なアクション対象が光るように
> - ループを作ってしまうノードは選択できない

### テスト計画

- `src/lib/proof-pad/substitutionConnectionLogic.test.ts` — 置換接続の判定ロジックのユニットテスト
  - φ[τ/x] → 実際に置換した結果と等価なノードに繋げる
  - 等価でないノードには繋げない
  - ループ検出（DAGにならない接続は不可）
  - 既存のSimplificationEdgeパターンに倣う
- `src/lib/proof-pad/workspaceState.test.ts` — connectSubstitutionResult の統合テスト追加

### ストーリー計画

- `ProofWorkspace.stories.tsx` に置換接続のインタラクションストーリー追加
  - コンテキストメニューから「置換結果として接続…」→選択モード→クリックで接続

### 実装方針

SimplificationEdge のパターンに完全に倣う:

1. `substitutionConnectionLogic.ts` — 純粋判定ロジック（validateSubstitutionConnection, computeSubstitutionCompatibleNodeIds）
2. `workspaceState.ts` — connectSubstitutionResult 関数追加
3. `ProofWorkspace.tsx` — コンテキストメニュー + 選択モードUI
4. `inferenceEdge.ts` — SubstitutionResultEdge 型追加（必要であれば）
