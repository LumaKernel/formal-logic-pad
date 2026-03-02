# 実行中タスク

## タスク (prd-logic-pad-world.md)

`クエストモード的な形で、基礎を学んだり、問題形式で進めることができる。`
→ シーケント計算クエストを開始可能にする（questStartLogicのSCブロック解除）

### 背景

- `questStartLogic.ts` の `buildQuestStartParams()` が `sequent-calculus` スタイルの場合 `undefined` を返すため、SC系クエスト（カット除去体験含む）がUIから開始できない
- `createQuestWorkspace` はすでにSC対応済み、ProofWorkspace もSC UIを持っている
- 5つのカット除去クエスト (sc-ce-01〜sc-ce-05) が定義済みだが開始不可

### テスト計画

- `questStartLogic.test.ts`: SCプリセットクエストが `undefined` ではなく正常なパラメータを返すようテスト更新
- `questCompletionLogic.test.ts`: SC体系でのゴール判定テスト（シーケント形式の式のマッチング確認）
- `questNotebookIntegration.test.ts`: SCクエストのノートブック作成テスト追加

### ストーリー計画

- `QuestCatalogComponent.stories.tsx`: カット除去クエストが表示され、開始ボタンが有効になることを確認（既存ストーリーでカバー可能か確認）
- ブラウザテスト: Playwright MCPでカット除去クエストの開始→ワークスペース表示を確認
