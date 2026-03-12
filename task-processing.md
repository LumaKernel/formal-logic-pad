## タスク (from tasks/prd-2026-03-11.md)

- [ ] ノートノードの編集のモーダルはマークダウンエディタを使いましょう。また、もう少し広くしましょう。md-editor-rtを利用
  - [ ] ストレージが必要なもの、画像アップロードとか、その他使えない機能はオフにしておいてください。

## 周辺情報

- 現在: ノート編集はtextareaモーダル（ProofWorkspace.tsx L5577-5697）
- ノート内容は`formulaText`フィールドに格納（workspaceState.ts）
- ノート表示はプレーンテキスト（EditableProofNode.tsx L581-592）
- md-editor-rt: `MdEditor`（編集）と`MdPreview`（表示のみ）を提供
- `noUploadImg`でアップロード無効化、`toolbars`でツールバーカスタマイズ可能

## テスト計画

- ProofWorkspace.test.tsx: 既存のノート編集テストが引き続きパスすることを確認
- ノートモーダルUIのテストは既存テストの動作確認で十分（MDエディタは外部ライブラリなので内部テスト不要）
- EditableProofNodeのノート表示テスト: マークダウンプレビューがレンダリングされることの確認

## ストーリー計画

- ProofWorkspace.stories.tsx: 既存のストーリーでノート機能が動作することを確認
- 必要に応じてノートノード入りのストーリーを追加

## 実装計画

1. `md-editor-rt`パッケージをインストール
2. ProofWorkspace.tsx のノート編集モーダルを MdEditor に置換
   - `noUploadImg` で画像アップロード無効化
   - `toolbars` から `image`, `mermaid`, `katex`, `save`, `github`, `fullscreen`, `pageFullscreen`, `htmlPreview`, `catalog` を除外
   - テーマ対応: `theme` propでダーク/ライト切替
   - モーダルサイズを拡大（minWidth: 600, maxWidth: 800）
3. EditableProofNode.tsx のノート表示を MdPreview に置換
   - ノード内のプレーンテキスト表示をマークダウンプレビューに変更
4. テスト・ストーリー確認
5. 品質チェック
