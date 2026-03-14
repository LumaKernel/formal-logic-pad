## 実行中タスク

**出典**: `tasks/prd-completeness.md`

> まずはプログラムによる証明ツリーの操作でそれが実現できるか。つまり、正しい論理式をとり、それをもとに、（正しいという前提で？）証明ができるか。

### 具体的な実装

命題論理シーケント計算（LK）の自動証明探索（backward proof search）を `src/lib/logic-core/proofSearch.ts` に実装する。

- 入力: `Sequent`（命題論理のシーケント）
- 出力: `Either<ScProofNode, ProofSearchError>`（証明木 or エラー）
- アルゴリズム: カットなし後方探索（全命題論理規則が可逆）

### テスト計画

- `src/lib/logic-core/proofSearch.test.ts` に追加
  - 公理（恒等式、⊥公理）
  - 各論理結合子の右規則・左規則
  - 排中律 ⇒ φ∨¬φ
  - 二重否定除去 ¬¬φ ⇒ φ
  - ド・モルガン則
  - 証明不可能なシーケント
  - ステップ数制限

### ストーリー計画

- UI変更なし（純粋ロジックのみ）
