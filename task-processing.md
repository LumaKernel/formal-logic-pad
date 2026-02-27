## 実行中タスク

**出典**: `tasks/prd-inserted-tasks.md` L20-22, L42

> 公理は公理そのものの形(とメタ変数の取り方の違い)を除けば、公理と判定されてはならなくて、
> 公理を利用したものでも、代入操作をするステップ(ノード)を挟んで利用する形でなければならない。

> Apply 代入操作もコンテキストメニューにあるとよい

### このイテレーションのスコープ

代入操作（Substitution Application）ノードの**純粋ロジック層**の実装:

1. `substitutionApplicationLogic.ts` - 代入ノードの検証・適用の純粋ロジック
2. `proofNodeUI.ts` に "substitution" kind 追加
3. `workspaceState.ts` に代入ノードの追加・接続ロジック
4. 上記に対するテスト
