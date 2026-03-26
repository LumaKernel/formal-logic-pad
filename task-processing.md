## 実行タスク

**出典:** `tasks/inserted-tasks.md` - 「UI公理へのsubstでphi:=phi->phiとしたとき、[τ/x]は消えてはいけない」の残りサブタスク

**集中タスク:** Simplify Formula操作を用意する（Simplifyで繋がったノードが作られる）

### コンテキスト

- FormulaSubstitution（`φ[τ/x]`表記）は代入適用時に自動解決しなくなった
- ユーザーが明示的にSimplify操作を行うことでFormulaSubstitutionを解決する
- 既存の `normalizeFormula` は**in-place置換**（ノード自体のテキストを書き換え）
- 今回のSimplifyは**新しいノードを作成**し、SimplificationEdgeで接続する

### テスト計画

- `src/lib/proof-pad/simplifyFormulaLogic.test.ts`（新規）
  - FormulaSubstitution含む式の簡約成功
  - 変化なし（既に解決済み）でエラー
  - パース不可でエラー
  - 空文字列でエラー
- `src/lib/proof-pad/workspaceState.test.ts` に統合テスト追加
  - `applySimplifyFormula` で新ノード+SimplificationEdge作成を検証

### ストーリー計画

- 既存の ProofWorkspace.stories.tsx のストーリーで動作確認（新ストーリー不要の見込み）
- ブラウザでSimplify操作をスクリーンショット確認

### 実装計画

1. `simplifyFormulaLogic.ts` - 純粋ロジック（normalizeApplicationLogicと同構造）
2. `workspaceState.ts` - `applySimplifyFormula` 関数（新ノード作成+SimplificationEdge接続）
3. `menuActionDefinition.ts` - "simplify-formula" メニュー項目追加
4. `ProofWorkspace.tsx` - コンテキストメニューにSimplify Formula追加
5. `proofMessages.ts` - メッセージキー追加
