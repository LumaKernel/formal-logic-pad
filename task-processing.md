# 現在のタスク

## タスク（prd-scripted-proof-rewriting.md US-005 残り）

- [ ] 実行すると証明図からカットが段階的に除去される過程がキャンバス上で可視化される
- [ ] ステップ実行で各変換ケースが適用される様子を1ステップずつ確認可能

## 周辺情報

US-005 のカット除去テンプレートは完成しているが、現在はコンソール出力のみ。
ワークスペースブリッジ（addNode, connectMP 等）は完成しているが、SC証明木を直接表示する機能はない。

## テスト計画

- `src/lib/script-runner/workspaceBridge.test.ts` に `displayScProof` のテスト追加
- `src/lib/script-runner/templates.test.ts` のテンプレート数更新（3→変更なしなら不要）
- テンプレートの更新がキャンバスコマンドを正しく発行するか確認

## ストーリー計画

- UI変更なし（テンプレートコード内容の更新のみ）
- 既存の ScriptEditor ストーリーで動作確認

## 実装方針

### アプローチ: SC証明木→ワークスペースノード変換ブリッジ関数を追加

1. **`displayScProof(proofJson)` ブリッジ関数を workspaceBridge に追加**
   - SC証明木を再帰的にワークスペースノード（sequent テキスト）+ エッジに変換
   - 既存ノードをクリアしてから配置
   - 最後に applyLayout() を呼んでレイアウト整理

2. **テンプレートスクリプトを更新**
   - カット除去テンプレートで `displayScProof(proof)` を呼び出してキャンバスに初期状態を表示
   - 各ステップで `displayScProof(step.proof)` を呼び出して変化を可視化

3. **clearWorkspace() ブリッジ関数を追加**
   - 全ノード削除用（displayScProof の前に呼ぶ）
