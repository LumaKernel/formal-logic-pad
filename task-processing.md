## タスク（from tasks/inserted-tasks.md）

- [ ] また、ノートを開いてからではなく、クエスト一覧から開くところからストーリーを開始する

### 背景

現在のQuestComplete\*FullFlowストーリーは、直接StatefulWorkspaceをrenderしている。
実際のユーザーフローでは、クエスト一覧（HubPage）からクエストを選択してワークスペースに遷移する。
このフルフローをストーリーで再現する。

### 調査事項

- HubPageViewからワークスペースへの遷移がストーリーで可能か
- 既存のHubPageViewストーリーの構造
- クエスト選択→ワークスペース表示のフロー
