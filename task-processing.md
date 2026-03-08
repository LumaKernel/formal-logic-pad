## 実行中タスク

**ソース:** `tasks/prd-logic-pad-world.md` - クエストモード充実

ND体系（自然演繹）のクエストを4問追加する。ド・モルガンの法則、分配律、二重否定除去（古典）など、NDの重要定理をカバー。

### 追加クエスト

- nd-24: ド・モルガン `¬(φ ∨ ψ) → (¬φ ∧ ¬ψ)` (NM, difficulty 2)
- nd-25: ド・モルガン逆 `(¬φ ∧ ¬ψ) → ¬(φ ∨ ψ)` (NM, difficulty 2)
- nd-26: ド・モルガン `¬(φ ∧ ψ) → (¬φ ∨ ¬ψ)` (NK, difficulty 3) - 古典論理必要
- nd-27: 分配律 `φ ∧ (ψ ∨ χ) → (φ ∧ ψ) ∨ (φ ∧ χ)` (NM, difficulty 2)

### テスト計画

- `src/lib/quest/builtinQuests.test.ts` のクエスト数を 171→175 に更新
- `src/lib/quest/builtinModelAnswers.ts` に4つの模範解答を追加
- 既存テスト (`builtinModelAnswers.test.ts`) が自動で新クエストを検出してテストする

### ストーリー計画

- UI変更なし（クエストデータ追加のみ）。HubPageView.stories.tsx はスライス使用で変更不要
