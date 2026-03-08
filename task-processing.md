## タスク

`tasks/prd-logic-pad-world.md` より: クエストモード拡充 - SC カット除去体験クエスト4問追加

sc-cut-eliminationカテゴリに新規4問追加（sc-ce-07〜sc-ce-10）:

- sc-ce-07: カットで選言の導入 `φ → (φ ∨ ψ)` (difficulty 2)
- sc-ce-08: カットと選言の可換性 `(φ ∨ ψ) → (ψ ∨ φ)` (difficulty 3)
- sc-ce-09: カットで含意から選言 `(φ → ψ) → (¬φ ∨ ψ)` (difficulty 3, LK)
- sc-ce-10: カットで対偶 `(φ → ψ) → (¬ψ → ¬φ)` (difficulty 3)

既存6問は含意・連言中心。選言・否定の組み合わせパターンを補完する。

## テスト計画

- `src/lib/quest/builtinQuests.test.ts`: クエスト数カウント更新 (167→171)
- `src/lib/quest/builtinModelAnswers.test.ts`: 新規4問の模範解答テスト自動追加（既存パターンに従う）
- カバレッジ影響: なし（データ追加のみ）

## ストーリー計画

- UI変更なし（データ追加のみ）
- ブラウザで新クエスト表示確認・スクリーンショット撮影
