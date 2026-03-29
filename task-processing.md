## 実行中タスク

**出典:** `tasks/inserted-tasks.md`

**タスク:** 消費者側がformulaTextsを直接参照するように移行（formulaTextの再パースを避ける）

**コンテキスト:**
タブローもシーケント計算と同様に、論理式の列を持つ。SCでは `sequentTexts` を消費者が直接参照するパターンが確立済み。TABでも `formulaTexts` を消費者が直接参照するように移行する。

### 移行対象箇所

1. **`tabProofTreeRendererLogic.ts` line 133, 136**: `node.formulaText` を使って `nodeTexts` マップを構築 → `formulaTexts` から導出
2. **`ProofWorkspace.tsx` line 2347**: TAB規則適用時に `formulaTexts` をパラメータに直接渡す（現在は `applyTabRuleAndConnect` 内部で再取得）
3. **`workspaceState.ts` `applyTabRuleAndConnect`**: caller が `formulaTexts` を渡すようになったら内部enrichmentを簡素化

### テスト計画

- `tabProofTreeRendererLogic.test.ts`: 既存テストが `formulaTexts` ベースの導出を検証するか確認。必要に応じてテスト追加
- `ProofWorkspace.test.ts`: TAB規則適用の既存テストでカバー

### ストーリー計画

- UI変更なし（内部リファクタリング）。ストーリー変更不要
