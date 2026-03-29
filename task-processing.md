## 実行中タスク

**出典:** `tasks/inserted-tasks.md`

**タスク:** TAB用の表示コンポーネント（FormulaListDisplayなど）を追加し、レンダリングを改善

**コンテキスト:**

- タブローもシーケント計算と同様に、論理式単体ではなく、論理式の列を持つ
- SCノードはSequentDisplayで表示している
- TABノードは現在formulaTextをそのまま表示している（カンマ区切りテキスト）
- TABノードにはformulaTextsが既にある（splitByTopLevelCommaで自動ポピュレート）

**テスト計画:**

- FormulaListDisplay の純粋ロジック・UIテストを新規追加
- SignedFormulaDisplay等の既存パターンを参照

**ストーリー計画:**

- FormulaListDisplay のストーリーを追加（play関数付き）
- 既存のTABストーリーでの表示確認

**ベースラインカバレッジ:** Stmts 99.8%, Branch 99.1%, Funcs 90.62%, Lines 99.81%
