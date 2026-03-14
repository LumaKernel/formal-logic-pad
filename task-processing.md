## 現在のタスク

**ソース:** `tasks/prd-scripted-proof.md`

トップにもスクリプト管理のための専用のページ、タブがあるとよいだろう

### 周辺情報
- 現在のHubTabは5種: notebooks, quests, custom-quests, collection, reference
- スクリプトはlocalStorageに保存 (key: "script-editor-saved-scripts")
- savedScriptsLogic.ts に純粋CRUD、ScriptEditorComponent.tsx にUI
- Hub page はルートベースのタブ (/, /quests, /custom-quests, /collection, /reference)

### テスト計画
- `src/app/HubPageView.test.tsx` 等既存テストにScriptsタブの切り替えテストを追加（既存パターンに従う）
- スクリプト一覧表示のロジックテスト（savedScriptsLogicの既存テストは十分なので、新規UIロジックがあればテスト追加）

### ストーリー計画
- HubPageView.stories.tsx に Scripts タブのストーリーを追加
- スクリプト一覧表示、削除、名前変更等の操作をplay関数でテスト
