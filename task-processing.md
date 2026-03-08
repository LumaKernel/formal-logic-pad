## タスク: ATクエスト追加（at-12〜at-15）

**出典:** `tasks/prd-logic-pad-world.md` — クエストモード拡充

### 追加する4問

- at-12: 含意のド・モルガン ¬(φ → ψ) → (φ ∧ ¬ψ) (difficulty 1) — α規則中心、3ステップ
- at-13: 二重否定導入 φ → ¬¬φ (difficulty 1) — α規則、3ステップ
- at-14: 含意と選言の変換 (φ → ψ) → (¬φ ∨ ψ) (difficulty 2) — β規則、5ステップ
- at-15: ピアースの法則 ((φ → ψ) → φ) → φ (difficulty 3) — 複合β規則、7ステップ

### テスト計画

- `src/lib/quest/builtinQuests.test.ts` — クエスト数 183→187 に更新
- `src/lib/quest/builtinModelAnswers.ts` — 4模範解答追加（axiomパターン）

### ストーリー計画

- UI変更なし。Playwright MCPでクエストカタログのスクリーンショット確認のみ
