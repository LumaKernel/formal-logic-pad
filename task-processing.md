## タスク: SC否定ルール（negation-left, negation-right）の追加

**出典:** `tasks/prd-logic-pad-world.md` — クエストモード機能拡充の一環

### 背景

SCシステムに否定ルール（¬⇒ / ⇒¬）が未実装のため、否定を含むSCクエスト（sc-07〜10, sc-ce-05, sc-ce-07〜14 等）の模範解答がすべてプレースホルダー状態。
否定ルールを追加すれば、これらの模範解答の実装が可能になる。

### 実装内容

LKの標準的な否定規則:

- **negation-left (¬⇒)**: `Γ ⇒ Δ, φ` から `¬φ, Γ ⇒ Δ` を導く（前件の¬φを除去し、φを後件に追加）
- **negation-right (⇒¬)**: `φ, Γ ⇒ Δ` から `Γ ⇒ Δ, ¬φ` を導く（後件の¬φを除去し、φを前件に追加）

※LJでは negation-right の前提の後件は ¬φ のみ（maxSuccedentLength: 1 制約）

### テスト計画

1. `src/lib/proof-pad/scApplicationLogic.test.ts` — negation-left, negation-right のバリデーションテスト
2. `src/lib/logic-core/deductionSystem.test.ts` — ルールID追加の反映確認
3. `src/lib/logic-core/cutElimination.test.ts` — 否定を含む証明のカット除去テスト追加
4. 既存テストが壊れないことの確認

### ストーリー計画

- SC否定ルール自体はUI表示のみの変更（ScRulePaletteに追加される）
- ストーリーの更新は必要に応じて

### 変更予定ファイル

1. `src/lib/logic-core/deductionSystem.ts` — ScRuleId に "negation-left", "negation-right" 追加
2. `src/lib/proof-pad/scApplicationLogic.ts` — 否定ルールの適用ロジック実装
3. `src/lib/proof-pad/scApplicationLogic.test.ts` — テスト追加
4. `src/lib/logic-core/deductionSystem.test.ts` — テスト更新
5. 関連するUI/エッジラベル系（inferenceEdgeLabelLogic.ts等）の更新
