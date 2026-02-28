## 実行中タスク

**出典:** `tasks/prd-extra-nd-workspace.md` — ND-006

- [-] **ND-006: E6 量化子NDクエストの実装**
  - ND-005完了後に着手
  - ∀I(Gen), ∀E(A4), ∃I, ∃Eの固有変数条件を学ぶクエスト群

### 周辺情報

- ND edge type は現在11種（命題論理のみ）: `inferenceEdge.ts` lines 78-256
- ND バリデーションは `ndApplicationLogic.ts` に46テスト
- 量化子ND規則は未実装（∀I, ∀E, ∃I, ∃E のエッジタイプ・バリデーションなし）
- Hilbert系では Gen, A4, A5 が `inferenceRule.ts` に実装済み
- 量化子NDクエスト (qNd15-) は未定義
- `naturalDeduction.ts` に ND 推論規則の core ロジックあり
- `free-for` チェックは `substitution.ts` に `isFreeFor()` として既存

### サブステップ

1. InferenceEdge に 4 つの量化子 ND エッジタイプを追加
2. ndApplicationLogic.ts に 4 規則のバリデーション実装
3. workspaceState.ts の revalidateInferenceConclusions に量化子 ND 対応
4. NdRulePalette に量化子規則ボタンを追加
5. 量化子 ND クエスト定義 (builtinQuests.ts)
6. テスト・品質チェック
