## 実行中タスク

**出典:** `tasks/prd-scripted-proof.md`

**タスク:** スクリプトノードのコンテキストメニューに「スクリプトを実行」を追加し、サイドパネルでScriptEditorを開けるようにする

**周辺情報:**
- スクリプトノード（kind: "script"）は既に存在
- ScriptEditorComponent は既に完成（Monaco Editor + 実行制御 + コンソール）
- WorkspaceCommandHandler で workspace 操作が可能
- 現状、スクリプトノードはコンテキストメニューで通常のフォーミュラノードと同じ扱い

### テスト計画
- `menuActionDefinition.test.ts`: "run-script" アクション追加の網羅性テスト更新
- `ProofWorkspace.test.tsx`: スクリプトノード右クリック→「スクリプトを実行」表示テスト
- `ProofWorkspace.stories.tsx`: スクリプトノード付きストーリー追加

### ストーリー計画
- `ProofWorkspace.stories.tsx` にスクリプトノードを含むストーリー追加
- スクリプトエディタパネルの表示確認ストーリー
