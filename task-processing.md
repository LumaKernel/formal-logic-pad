## 現在のタスク

**出典:** `tasks/prd-logic-pad-world.md`

- [ ] ノートの新規作成では、モードや公理系などが選択できる。

### 周辺情報

- `notebookState.ts` に `createNotebook` / `createQuestNotebook` が既にある
- `LogicSystem` 型は `inferenceRule.ts` で定義済み（name, propositionalAxioms, predicateLogic, equalityLogic, generalization）
- 現在のプリセットは `lukasiewiczSystem` のみ
- hookの `create(name, system)` でノート作成は可能だが、UIにはモード・公理系選択がない
- 必要なもの: ノート作成ダイアログ/フォームUI（名前入力、モード選択、公理系選択）
