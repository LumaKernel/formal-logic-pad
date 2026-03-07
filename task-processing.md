## 実行中タスク

**出典:** `tasks/prd-scripted-proof-rewriting.md` US-005

### タスク

カット除去定理のテンプレートスクリプトを作成する。

### 周辺情報

- カット除去アルゴリズムは `src/lib/logic-core/cutElimination.ts` に実装済み（eliminateCutsWithSteps）
- ProofBridgeは現在formula-levelのみ（parseFormula, formatFormula, applyMP等）
- WorkspaceBridgeは現在Hilbertスタイルのみ（addNode, connectMP等）
- SCプルーフをスクリプトから操作するブリッジが未実装

### 方針

1. SC証明操作のブリッジ関数を追加（`cutEliminationBridge.ts`）:
   - `buildScProof(proofJson)` → 内部表現に変換
   - `eliminateCuts(proofJson)` → カット除去結果（ステップ付き）をJSON返却
   - `formatSequent(sequent)` → テキスト表示
   - `isCutFree(proofJson)` → boolean
   - `countCuts(proofJson)` → number
2. テンプレートスクリプトの作成（`src/lib/script-runner/templates/`）
3. テンプレート選択UIの基盤（US-006で完成するが、ロードの仕組みの基盤はUS-005で）

### テスト計画

- `src/lib/script-runner/cutEliminationBridge.test.ts`: ブリッジ関数のユニットテスト
  - SCプルーフのJSONデコード・バリデーション
  - eliminateCutsの呼び出しと結果の正しいJSON化
  - エラーケース（不正なJSON等）
- テンプレートスクリプトの実行テスト: スクリプトランナーでテンプレートを実行し、ステップが得られることを確認

### ストーリー計画

- ScriptEditorComponent.stories.tsxにテンプレート実行のストーリー追加
