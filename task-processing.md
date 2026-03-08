## 実行中タスク

**出典**: `tasks/prd-logic-pad-world.md` - クエストモード拡充

### タスク

タブロー法クエスト4問追加（連言結合律・選言結合律・吸収律・含意の選言表現）

### テスト計画

- `src/lib/quest/builtinQuests.test.ts`: クエスト数カウント 159→163 に更新
- `src/lib/quest/builtinModelAnswers.test.ts`: 模範解答テスト（自動検証）で新4問分追加される

### ストーリー計画

- UI変更なし（クエスト定義追加のみ）。ブラウザでQuestCatalogのtab-basicsカテゴリ表示確認

### 追加するクエスト

- tab-15: 連言の結合律 `((φ∧ψ)∧χ) → (φ∧(ψ∧χ))` - difficulty 2, order 15
- tab-16: 選言の結合律 `(φ∨(ψ∨χ)) → ((φ∨ψ)∨χ)` - difficulty 3, order 16
- tab-17: 吸収律 `(φ→ψ) → (φ→(φ∧ψ))` - difficulty 2, order 17
- tab-18: 含意の選言表現 `(φ→ψ) → (¬φ∨ψ)` - difficulty 2, order 18
