## タスク: 命題論理上級クエスト4問追加（propositional-advanced: 6問→10問）

出典: `tasks/prd-logic-pad-world.md` — クエストモード拡充

### 追加クエスト

- prop-33: 選言導入 (Disjunction Introduction) `φ → (φ ∨ ψ)` difficulty 5
- prop-34: 選言の可換性 (Commutativity of Disjunction) `(φ ∨ ψ) → (ψ ∨ φ)` difficulty 5
- prop-35: 連言の可換性 (Commutativity of Conjunction) `(φ ∧ ψ) → (ψ ∧ φ)` difficulty 5
- prop-36: ド・モルガンの逆 (De Morgan Converse) `(¬φ ∧ ¬ψ) → ¬(φ ∨ ψ)` difficulty 5

### テスト計画

- `src/lib/quest/builtinQuests.test.ts` のクエスト数を 231→235 に更新
- builtinModelAnswers.test.ts の自動テスト（各模範解答がゴールを達成するか）で自動カバー

### ストーリー計画

- UI変更なし（クエスト追加のみ）。HubPageView.stories.tsxは`builtinQuests.slice(0, 20)`で制限済みなので更新不要

### 変更ファイル

- `src/lib/quest/builtinQuests.ts` — 4クエスト定義追加
- `src/lib/quest/builtinModelAnswers.ts` — 4模範解答追加
- `src/lib/quest/builtinQuests.test.ts` — クエスト数更新
