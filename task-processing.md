## タスク

modelAnswer.ts のカバレッジ改善（27.53% → 100%目標）

ソース: カバレッジレポートより、`src/lib/quest/modelAnswer.ts` が Stmts 27.53%, Branch 50%, Funcs 30.76% と極端に低い。
原因: NDステップ（assumption, nd-implication-intro/elim, nd-conjunction-intro/elim, nd-disjunction-intro/elim, nd-efq, nd-dne, nd-universal-intro/elim, nd-existential-intro/elim）、
GenステップのコードパスがmodelAnswer.test.ts で直接テストされていない。builtinModelAnswers.test.ts がタイムアウトにより計測漏れ。

### テスト計画

- `src/lib/quest/modelAnswer.test.ts` にND系ステップの直接テストを追加
  - `assumption` + `nd-implication-intro`: nd-nm で φ→φ の証明（最小テスト）
  - `nd-implication-elim`: →E の適用テスト
  - `nd-conjunction-intro` / `nd-conjunction-elim-left` / `nd-conjunction-elim-right`: ∧操作
  - `nd-disjunction-intro-left` / `nd-disjunction-intro-right` / `nd-disjunction-elim`: ∨操作
  - `nd-efq`: EFQ テスト（nd-nj）
  - `nd-dne`: DNE テスト（nd-nk）
  - `nd-universal-intro` / `nd-universal-elim`: 量化子操作（nd-nm-pred）
  - `nd-existential-intro` / `nd-existential-elim`: 存在量化子操作
  - `gen` ステップ: Genの直接テスト
- v8 ignore 外のコードパスがすべてカバーされることを確認

### ストーリー計画

- UI変更なし。テスト追加のみ
