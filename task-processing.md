# タスク: A4公理のインスタンスが公理スキーマとして誤認識される問題の修正

出典: `tasks/prd-inserted-tasks.md`

> 0 + 0 = 0 (模範解答) において、 (all x. x + 0 = x) -> 0 + 0 = 0 が公理として認識されている

## 問題の根本原因

`matchAxiomA4` が `axiomMatchOk(new Map(), new Map())` を返すため、項代入情報（τ → t）が失われる。
`isTrivialAxiomSubstitution` が空マップをtrivialと判定し、A4のすべてのインスタンスが公理スキーマそのものとして識別される。

## 修正方針

1. `matchAxiomA4` が formulaSubstitution と termSubstitution を正しく返すようにする
   - `formulaSubstitution`: φ → body（束縛変数x内の本体）
   - `termSubstitution`: τ → t（推論された項代入、t ≠ x の場合）
   - t = x の場合は空マップ（trivial）

2. テスト修正:
   - `axiomNameLogic.test.ts`: A4インスタンス `∀x.(x=x) → a=a` の期待値を "NotIdentified" に変更
   - `inferenceRule.test.ts`: `matchAxiomA4` の返り値を検証するテスト追加
   - リグレッションテスト: `(all x. x + 0 = x) -> 0 + 0 = 0` が NotIdentified であることを確認

3. 模範解答への影響:
   - 模範解答バリデーション (`validateModelAnswer`) は `hasInstanceRootNodes` のみの場合 Valid と判定するので、テストは通る
   - UI上の公理名ラベルが非表示になるのが正しい動作

## テスト計画

- `src/lib/logic-core/inferenceRule.test.ts`: `matchAxiomA4` の代入マップ検証テスト追加
- `src/lib/proof-pad/axiomNameLogic.test.ts`: A4インスタンスのNotIdentified確認テスト修正
- リグレッションテスト: PA系の公理インスタンスがNotIdentifiedであることを確認

## ストーリー計画

- UI変更はなし（公理名ラベルの表示ロジックが変わるのみ）
- ブラウザでPA模範解答を確認し、A4インスタンスに公理名ラベルがないことを確認
