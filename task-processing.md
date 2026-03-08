## タスク: ND自然演繹の上級クエスト4問追加（nd-28〜nd-31）

**ソース:** `tasks/prd-logic-pad-world.md` — クエストモード拡充

### 追加するクエスト

1. nd-28: 二重否定除去 `¬¬φ → φ` (NK, difficulty 2) — DNE規則の直接使用
2. nd-29: 対偶の逆 `(¬ψ → ¬φ) → (φ → ψ)` (NK, difficulty 3) — DNE必要
3. nd-30: ピアースの法則 `((φ → ψ) → φ) → φ` (NK, difficulty 3) — 古典論理の有名な定理
4. nd-31: ∨∧分配律の逆 `(φ∨ψ) ∧ (φ∨χ) → φ∨(ψ∧χ)` (NM, difficulty 3) — ∨Eを2回使用

### テスト計画

- `src/lib/quest/builtinQuests.test.ts` のクエスト数カウントを 175→179 に更新
- `src/lib/quest/builtinModelAnswers.ts` に4問の模範解答を追加
- 既存の `builtinModelAnswers.test.ts` が自動で新規クエストの模範解答をテスト

### ストーリー計画

- UI変更なし（クエストデータ追加のみ）
- ブラウザでクエスト一覧に新規4問が表示されることを確認
