## 実行中タスク

**ソース:** `tasks/prd-advanced.md` - B2. TABの証明木構築UI

### B2-4: TAB規則適用UI統合

TABパレットの規則クリック → ノード選択 → 規則適用のUIフローを実装する。

**完了済みサブタスク:**
- B2-1: TAB DeductionSystem統合 ✅
- B2-2: TAB規則パレットUI ✅
- B2-3: TAB推論規則適用ロジック ✅

**今回の実装内容:**
- TabRulePalette に `onRuleClick` コールバック追加
- ProofWorkspace に TabSelectionState ステートマシン追加
- TAB規則選択 → ノード選択 → 適用 のUIフロー
- バナー表示、エラーメッセージ表示
- 分岐規則（¬∧, ∨, →）の2前提ノード自動生成
- TAB用エッジバッジ対応

**ベースラインカバレッジ:** Stmts 98.12%, Branch 91.66%, Funcs 88.88%, Lines 99.04%
