# 実行中タスク

## タスク元: tasks/prd-scripted-proof-rewriting.md / US-004

- [ ] 各ステップ後の証明図の状態をキャンバス上にリアルタイム反映

## 周辺情報

US-004の他の項目は大半が完了済み（実行行ハイライト、コントロールUI、コンソール出力、エラー表示）。
残りは「証明図のリアルタイム反映」と「型チェック/lint通過」「スクリーンショット確認」。

## テスト計画

- `src/lib/script-runner/proofBridge.test.ts` に新しいワークスペース操作ブリッジ関数のテストを追加
  - `addNode`, `setNodeFormula`, `getNodes`, `connectMP` 等
- 新しいブリッジのテストは、コールバック関数がWorkspaceState更新関数を呼ぶことを検証

## ストーリー計画

- `src/components/ScriptEditor/ScriptEditorComponent.stories.tsx` に証明図リアルタイム反映デモのストーリーを追加
  - ScriptEditor + ProofWorkspace を並べたレイアウトで、スクリプトからノード追加・接続を行い証明図に反映される様子を確認

## 実装計画

1. proofBridge にワークスペース操作ブリッジを追加:
   - `addNode(formulaText)` → nodeId を返す
   - `setNodeFormula(nodeId, formulaText)` → ノードの式テキストを更新
   - `getNodes()` → 全ノード一覧を返す
   - `connectMP(antecedentId, conditionalId)` → MP 適用してエッジ接続
   - `setGoal(formulaText)` → ゴール設定

2. ScriptEditorComponentProps に `onWorkspaceCommand` コールバックを追加:
   - ブリッジ関数からの呼び出しを外部に伝播

3. デモストーリーでScriptEditor + ProofWorkspaceの並列表示
