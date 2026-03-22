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

### script-runner テンプレートのTODO実装

- **場所:** `src/lib/script-runner/templates.ts` (4箇所)
- カット除去証明の手動構築テンプレートが未実装
  - L1136: 基本実装
  - L1201: カット除去結果の手動構築
  - L1282: 弱化のみのカット除去証明構築
  - L1372: ランク削減証明構築

### V8 Funcsカバレッジ集約クイーク対策

- Funcs 89.84% はV8カバレッジマージの制限による偽陰性
- vitest.config.ts のカバレッジ設定で Funcs 閾値を除外するか、カバレッジプロバイダーを istanbul に切り替えることで対応可能
- もしくはレポート上の注記として扱う

## 優先度: 低

### UIコンポーネントのカバレッジ改善

- `EmbeddedEditor.tsx` (71.42% Funcs, 76.36% Stmts)
- `ApiReferencePanel.tsx` (75% Funcs, 86.2% Stmts)
- `ScriptFileExplorer.tsx` (81.48% Funcs, 86.56% Stmts)
- これらはUIコンポーネントのためStorybook play関数での改善が適切

### ドキュメント・学習体験の改善

- リファレンスコンテンツのさらなる充実（証明戦略ガイド等）
- チュートリアルモードの追加
- 証明の自動検証フィードバックの改善
