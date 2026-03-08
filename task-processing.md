## 実行タスク

from: `tasks/prd-logic-pad-world.md`

> クエストモード的な形で、基礎を学んだり、問題形式で進めることができる。

LK体系固有（古典論理のみ証明可能）クエスト4問追加（sc-23〜sc-26）:

- sc-23: LK: パースの法則 `((φ → ψ) → φ) → φ` (difficulty 3)
- sc-24: LK: 逆対偶 `(¬ψ → ¬φ) → (φ → ψ)` (difficulty 3)
- sc-25: LK: 含意の選言表現 `(φ → ψ) → (¬φ ∨ ψ)` (difficulty 3)
- sc-26: LK: 弱排中律 `¬φ ∨ ¬¬φ` (difficulty 2)

## テスト計画

- `src/lib/quest/builtinQuests.test.ts`: クエスト総数を 137 → 141 に更新
- `src/lib/quest/builtinModelAnswers.ts`: 4つの模範解答を追加（axiomステップ形式）
- 既存のbuiltinModelAnswers.test.tsが自動的に新クエストをテスト

## ストーリー計画

- UI変更なし（既存のクエストカタログUIに自動的に表示される）
- Storybook + Playwrightで表示確認
