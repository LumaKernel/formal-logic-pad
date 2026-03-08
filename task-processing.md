## カバレッジ改善: 複数ファイルのBranchカバレッジ向上

元タスク: カバレッジ100%目標に向けた継続的改善（prd-logic-pad-world.md 関連ではなく、品質要件に基づく）

### ベースライン

- Statements: 99.61%, Branch: 96.65%, Functions: 89.24%, Lines: 99.86%

### 対象ファイルと改善計画

#### 純粋ロジック系（テスト追加で改善）

1. **grid.ts** (Branch 88.88%, line 10): デフォルト引数 → v8 ignore
2. **menuActionDefinition.ts** (Branch 91.66%, line 415): デフォルト引数 → v8 ignore
3. **proofCollectionState.ts** (Branch 91.17%, lines 335,502): role付きノードコピーテスト追加
4. **proofCollectionPanelLogic.ts** (Branch 94.44%, line 147): フォルダ非編集状態テスト追加
5. **atApplicationLogic.ts** (Branch 95.58%, lines 74,254-258): F:プレフィックス・δ規則テスト追加

#### UIコンポーネント系（テスト追加+v8 ignore）

6. **NdRulePalette.tsx** (Branch 90%): スペースキーテスト追加
7. **TabRulePalette.tsx** (Branch 91.66%): スペースキーテスト追加
8. **ScRulePalette.tsx** (Branch 91.66%): スペースキーテスト追加
9. **NotebookCreateFormComponent.tsx** (Branch 88.57%): スペースキー・testId未指定テスト追加、防御的コードv8 ignore
10. **CompletionPopup.tsx** (Branch 92%): 防御的コードv8 ignore
11. **FormulaInput.tsx** (Branch 93.42%): testId未指定テスト・v8 ignore
12. **TermInput.tsx** (Branch 92%): 同上
13. **ProofCollectionPanel.tsx** (Branch 93.91%): testId未指定テスト・v8 ignore

### テスト計画

- `grid.test.ts`: デフォルト引数省略テスト（不要、v8 ignoreで対応）
- `proofCollectionState.test.ts`: role付きノードのインポート・エクスポートテスト追加
- `proofCollectionPanelLogic.test.ts`: フォルダ非編集状態のテスト追加
- `atApplicationLogic.test.ts`: F:プレフィックス・δ規則テスト追加
- `NdRulePalette.test.tsx`: スペースキーテスト追加
- `TabRulePalette.test.tsx`: スペースキーテスト追加
- `ScRulePalette.test.tsx`: スペースキーテスト追加
- `NotebookCreateFormComponent.test.tsx`: スペースキー・testId未指定テスト追加
