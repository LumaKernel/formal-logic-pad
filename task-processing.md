## AT（分析的タブロー）クエスト4問追加

出典: prd-logic-pad-world.md「クエストモード的な形で、基礎を学んだり、問題形式で進めることができる」

### 追加クエスト

- at-08: 連言の交換律 (φ ∧ ψ) → (ψ ∧ φ) (difficulty 1)
- at-09: 選言の交換律 (φ ∨ ψ) → (ψ ∨ φ) (difficulty 2)
- at-10: 推移律 (φ → ψ) → ((ψ → χ) → (φ → χ)) (difficulty 2)
- at-11: ド・モルガン2 ¬(φ ∨ ψ) → (¬φ ∧ ¬ψ) (difficulty 2)

### テスト計画

- `builtinQuests.test.ts` のクエスト数カウント更新 (141→145)
- `builtinModelAnswers.ts` に模範解答4問追加
- 模範解答テスト（builtinModelAnswers.test.ts）で自動検証

### ストーリー計画

- UI変更なし（データ追加のみ）
