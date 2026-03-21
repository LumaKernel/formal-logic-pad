from: tasks/inserted-tasks.md (line 5-6)

タスク: スクリプト管理を、スクリプトなしで開いたときは、スクリプト関連のドキュメントを案内しよう

サブタスク: スクリプトがある場合でも、上のほうにinfo的に、すぐにスクプリト操作の入門系のドキュメントへすぐアクセスできるようにしておこう

## 計画

### テスト計画

- ScriptListPanel.test.tsx: 空状態でドキュメントリンクが表示されることを確認するテスト追加
- ScriptListPanel.test.tsx: アイテムがある場合もinfo bannerが表示されることを確認するテスト追加

### ストーリー計画

- HubPageView.stories.tsx の ScriptsTabEmpty ストーリーのplay関数を更新（ドキュメントリンクの確認追加）
- HubPageView.stories.tsx の ScriptsTab ストーリーのplay関数を更新（info bannerの確認追加）

### 実装方針

1. ScriptListPanelMessages に docsLinkText を追加
2. ScriptListPanel に onShowDocs コールバックを追加
3. 空状態: emptyDescription の下にドキュメントリンクボタン表示
4. リスト状態: 先頭にinfo banner（ドキュメントへのクイックアクセス）表示
5. hubMessages.ts / messages/en.json / messages/ja.json に新メッセージ追加
6. HubPageView.tsx / HubContent.tsx で新props接続
