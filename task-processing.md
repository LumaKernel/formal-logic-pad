## タスク: propositional-basics クエスト4問追加 (prop-36〜prop-39)

**元ファイル:** `tasks/prd-logic-pad-world.md`

クエストモード拡充の一環として、propositional-basics カテゴリ（現在7問）に4問追加して11問にする。

### 追加クエスト

1. **prop-36**: `φ → (ψ → ψ)` — 恒等律の弱化版。difficulty 1
2. **prop-37**: `(φ → ψ) → (φ → (χ → ψ))` — 結論の弱化。difficulty 2
3. **prop-38**: `(φ → (ψ → χ)) → (φ → (ψ → (θ → χ)))` — 結論の深い弱化。difficulty 2
4. **prop-39**: `(φ → ψ) → ((φ → (ψ → χ)) → (φ → χ))` — A2の前提順交換。difficulty 2

### テスト計画

- `builtinQuests.test.ts`: クエスト数 223→227 に更新
- `builtinModelAnswers.test.ts`: 模範解答テスト（自動で追加分を検出）

### ストーリー計画

- UI変更なし（クエスト数増加のみ）。HubPageView.stories.tsx は slice(0,20) なので更新不要

### ベースライン

- Stmts: 99.95%, Branch: 100%, Lines: 100%, 8622 tests passed
