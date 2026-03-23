## 現在のタスク

**出典:** `tasks/inserted-tasks.md`

- [ ] スクリプトに関連する要素(コンポーネントやライブラリ)の遅延ロード

### コンテキスト

- ScriptEditorComponent は ProofWorkspace.tsx で静的インポートされている
- 条件付きレンダリング（scriptEditorOpen が true のときのみ）だが、バンドルは常にロード
- Monaco Editor + js-interpreter + md-editor-rt が 986KB チャンクに含まれる
- ワークスペースページ初回ロード時に不要なコードが読み込まれている

### 置換計画

1. ScriptEditorComponent を React.lazy で動的インポートに変更
2. Suspense境界でラップし、ローディング表示を追加

### テスト計画

- 既存テスト全通過確認
- カバレッジ低下なし

### ストーリー計画

- 既存ストーリーで確認（新規追加不要）
