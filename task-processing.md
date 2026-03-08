# 実行中タスク

**出典:** `tasks/prd-logic-pad-world.md` — クエストモード拡充

## タスク

LJ体系（直観主義シーケント計算）クエストをさらに4問追加（sc-19〜sc-22）

### 追加するクエスト

- sc-19: LJ 選言導入（φ → (φ ∨ ψ)）— difficulty 1
- sc-20: LJ カリー化（((φ ∧ ψ) → χ) → (φ → (ψ → χ))）— difficulty 2
- sc-21: LJ 逆カリー化（(φ → (ψ → χ)) → ((φ ∧ ψ) → χ)）— difficulty 2
- sc-22: LJ 含意と連言の分配（(φ → (ψ ∧ χ)) → ((φ → ψ) ∧ (φ → χ))）— difficulty 3

## テスト計画

- `builtinQuests.test.ts`: クエスト数カウント 133 → 137 に更新
- `builtinModelAnswers.test.ts`: 既存テストが新クエストを自動検出（模範解答registry含む）
- 新規テストファイル追加は不要（既存の包括テストでカバー）

## ストーリー計画

- UI変更なし（データ追加のみ）
- Storybook Hub > Quests Tab で表示確認（ブラウザテスト）
