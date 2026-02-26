## 実行中タスク

**ソース:** `tasks/prd-logic-selection.md`

- [ ] 公理系の選択肢として、Mendelson体系を追加する

### 周辺情報

- 現在は Łukasiewicz 体系 (A1: K公理, A2: S公理, A3: 対偶公理) のみが命題論理公理として定義
- Mendelson 体系は A1, A2 は同一で、A3 のみが異なる: (¬φ → ¬ψ) → ((¬φ → ψ) → φ) (背理法)
- `dev/logic-reference/07-axiom-systems-survey.md` に詳細な仕様あり
- `PropositionalAxiomId` 型の拡張、新公理テンプレート、新システム定義、プリセット追加が必要
- クエスト定義は後続タスクで追加予定（今回は体系追加のみ）
