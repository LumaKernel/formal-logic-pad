## 現在のタスク

**出典:** `tasks/prd-logic-pad-world.md` - クエストモード `[-]` 項目

**タスク:** クエスト開始→ノートブック自動作成の統合hook作成（`useQuestStart`）

**周辺情報:**

- `questStartLogic.ts` の `prepareQuestStart()` がクエスト定義からノートブック作成パラメータを生成
- `useNotebookCollection.createQuest()` がクエスト用ノートブックを作成
- `useQuestProgress` がクエスト進捗を管理
- これらを統合する hook を作成し、`onStartQuest(questId)` → ノートブック作成 → 作成されたノートブックIDを返す、というフローを提供する
