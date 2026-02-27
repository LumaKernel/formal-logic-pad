## 現在のタスク

**出典**: `tasks/prd-inserted-tasks.md` line 20-22

```
[-] http://localhost:13006/?path=/story/proofpad-peanoarithmeticdemo--zero-plus-zero-completed
    これを例にするが、公理は公理そのものの形(とメタ変数の取り方の違い)を除けば、公理と判定されてはならなくて、
    公理のを利用したものでも、代入操作をするステップ(ノード)を挟んで利用する形でなければならない。
```

### 具体的なスコープ（このイテレーション）

1. **公理判定の厳格化**: `axiomNameLogic.ts` / `inferenceRule.ts` で公理のインスタンス（メタ変数に具体値を代入したもの）を「公理」として認識しないようにする
   - 非自明な代入（メタ変数→具体的な式/項）がある場合は公理として認識しない
   - 公理スキーマそのもの（メタ変数がそのまま残った形）は引き続き認識する
2. **PeanoArithmeticDemo ストーリーの修正**: 代入操作ステップを挟んだ正しい証明フローに更新
   - PA3 axiom → Substitution(x:=0) → `0 + 0 = 0`
   - A5 axiom → Substitution(...) → instantiated A5

### 周辺情報

- 代入操作ロジック: `src/lib/proof-pad/substitutionApplicationLogic.ts` に純粋ロジック
- 公理判定: `src/lib/logic-core/inferenceRule.ts` の `identifyAxiom()`
- 公理名表示: `src/lib/proof-pad/axiomNameLogic.ts` の `identifyAxiomName()`
- ワークスペース状態: `src/lib/proof-pad/workspaceState.ts` に `applySubstitutionAndConnect()`
