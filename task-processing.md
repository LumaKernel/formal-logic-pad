## 現在のタスク

**出典:** `tasks/inserted-tasks.md` - アルゴリズム可視化API（サブタスク2）

### 集中タスク

- [ ] **UI統合: ハイライト描画（ProofWorkspace + ScriptEditorComponent接続）**

### コンテキスト

サブタスク1で VisualizationState / VisualizationBridge は完成済み。
今回はこれらをUI層に統合して、スクリプトから `highlightNode()` を呼ぶとノードが光るようにする。

### 実装計画

1. **ScriptEditorComponent**: `visualizationCommandHandler` prop追加、`buildAllBridges`に接続
2. **ProofWorkspace**: `visualizationState` React state追加、scriptCommandHandler横にvisualizationCommandHandler作成
3. **renderNode内**: highlights Mapを参照してノードにCSS outline/glow適用
4. **visualizationHighlightLogic.ts**: HighlightColor → CSS色マッピング純粋関数（新規）

### テスト計画

- `visualizationHighlightLogic.test.ts`: 色マッピング純粋関数テスト
- ScriptEditorComponent stories: visualizationCommandHandler付きストーリー更新（既存ストーリーに統合可能か確認）
- ProofWorkspace: ハイライト表示のブラウザ確認（Playwright）

### ストーリー計画

- 既存のScriptEditorWithWorkspaceストーリーでハイライトが動作するか確認
- 必要に応じて新ストーリー追加
