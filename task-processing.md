## 現在のタスク

**出典:** `tasks/inserted-tasks.md` - Funcsカバレッジ改善

### 集中タスク

- [ ] **Funcsカバレッジ改善** - 89.88% → 目標: 向上させる

### 対象ファイル（Funcs%が低い純粋ロジックファイル優先）

- `src/lib/logic-core/freeVariables.ts` - 70% Funcs
- `src/lib/logic-core/substitution.ts` - 77.63% Funcs
- `src/lib/logic-core/unification.ts` - 76.74% Funcs
- `src/lib/proof-pad/edgeBadgeEditLogic.ts` - 74.07% Funcs
- `src/lib/formula-input/EmbeddedEditor.tsx` - 71.42% Funcs（UIコンポーネント）
- `src/components/ScriptEditor/ApiReferencePanel.tsx` - 75% Funcs（UIコンポーネント）

### テスト計画

- `freeVariables.test.ts` - 未カバー関数のテスト追加
- `substitution.test.ts` - 未カバー関数のテスト追加
- `unification.test.ts` - 未カバー関数のテスト追加
- `edgeBadgeEditLogic.test.ts` - 未カバー関数のテスト追加

### ストーリー計画

- UI変更なしのため、ストーリー追加は不要
