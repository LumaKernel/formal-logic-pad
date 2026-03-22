# 次のタスク候補

## 優先度: 高

### アルゴリズム可視化API

- **出典:** `tasks/inserted-tasks.md` / `tasks-archived/prd-theories.md`
- カット除去等のアルゴリズム実行時にデバッグ・学習用の可視化機能を提供
- サブタスク:
  - [x] VisualizationState 純粋ロジック + VisualizationBridge（基盤）
  - [x] UI統合: ハイライト描画（ProofWorkspace + ScriptEditorComponent接続）
  - [x] UI統合: 吹き出しアノテーション描画（オーバーレイ + dispose UI）
  - [x] ノードIDを指定して内部ステート表示（getNodeState API）
  - ログシステムは console.log で既に実現済み

## 優先度: 中

### ~~script-runner テンプレートのTODO実装~~ (完了済み)

- **場所:** `src/lib/script-runner/templates.ts` (4箇所)
- 4つのTODOは学生向け演習コメントで、実装コードは既に記述済み

### ~~V8 Funcsカバレッジ集約クイーク対策~~ (対応不要)

- V8カバレッジマージの制限による偽陰性。vitest.config.tsに閾値未設定のため影響なし
- 個別テスト実行では全ファイルFuncs 100%。フルスイートの低値はV8の制限

## 優先度: 低

### UIコンポーネントのカバレッジ改善

- ~~`EmbeddedEditor.tsx`~~ (存在しない古い情報)
- ~~`ApiReferencePanel.tsx`~~ → Storybook ストーリー作成済み（6ストーリー、play関数付き）
- ~~`ScriptFileExplorer.tsx`~~ → Escape キャンセル、blur 確定、ホバー解除のストーリー追加済み（計8ストーリー）
- これらはUIコンポーネントのためStorybook play関数での改善が適切

### ドキュメント・学習体験の改善

- リファレンスコンテンツのさらなる充実（証明戦略ガイド等）
- チュートリアルモードの追加
- 証明の自動検証フィードバックの改善
