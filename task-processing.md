## 実行中タスク

`tasks/inserted-tasks.md` より:

- [ ] 体系Sequent Calculusがクリックできない。解説ページの用意とクリックの対応を。

### コンテキスト

現在、Hilbert系と理論体系のみが `deductionSystemReferenceLogic.ts` でリファレンスエントリにマッピングされている。
ND/SC/TAB/AT系はマッピングがなく、システムバッジがクリック不可。

既存のガイドエントリ:
- `guide-intro-natural-deduction` — ND系(NM/NJ/NK)に対応
- `guide-intro-sequent-calculus` — SC系(LM/LJ/LK)に対応
- `guide-intro-tableau` — TAB系に対応
- AT系は `concept-analytic-tableau` がある

システム名:
- "Natural Deduction NM", "Natural Deduction NJ", "Natural Deduction NK"
- "Sequent Calculus LM", "Sequent Calculus LJ", "Sequent Calculus LK"
- "Tableau Calculus TAB", "Tableau Calculus TAB (Propositional)"
- "Analytic Tableau", "Analytic Tableau (Propositional)"

### テスト計画

- `deductionSystemReferenceLogic.test.ts`: 既存のND undefinedテストを更新、全10システム名のマッピングテスト追加

### ストーリー計画

- UI変更なし（クリックハンドラ・スタイルは既存）。ストーリー追加不要。
