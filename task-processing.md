# 現在のタスク

**出典:** `tasks/prd-inserted-tasks.md`

- ビルトインクエスト模範解答の網羅（propositional-advanced カテゴリ残り7問）
  - prop-20: 排中律 ¬φ ∨ φ
  - prop-22: 連言の導入 φ → (ψ → (φ ∧ ψ))
  - prop-23: 連言の除去(左) (φ ∧ ψ) → φ
  - prop-24: De Morgan の法則 ¬(φ ∨ ψ) → (¬φ ∧ ¬ψ)
  - prop-30: 矛盾律 ¬(φ ∧ ¬φ)
  - prop-31: 連言の右除去 (φ ∧ ψ) → ψ
  - prop-32: 選言除去 (φ ∨ ψ) → ((φ → χ) → ((ψ → χ) → χ))

## テスト計画

- `builtinModelAnswers.test.ts` に `propositional-advanced` カテゴリのテストセクションを追加
  - ゴール達成テスト (`validateModelAnswer`)
  - ワークスペース構築テスト (`buildModelAnswerWorkspace`)
  - 自動レイアウトテスト
  - 高難度問題なのでタイムアウトを十分に設定（30_000ms以上）

## ストーリー計画

- UI変更なし（純粋ロジックのみ）

## 実装方針

- 連言 `∧` と選言 `∨` の定義展開が必要:
  - α ∧ β ≡ ¬(α → ¬β)
  - α ∨ β ≡ ¬α → β
- 既存の証明（prop-15 DNI, prop-17 DNE, prop-25 三重否定等）を部品として再利用
- 各証明をまず手動で構成し、テストで検証
