## 実行中タスク

**ソース:** `tasks/prd-inserted-tasks.md`

- [-] cmd+s(ctrl+s)などのショートカットキーにも対応(保存することで、スクリプトのコレクションに追加されて管理できるように)

### テスト計画

- `scriptEditorKeyboardShortcuts.test.ts`: 純粋ロジックのテスト
  - Cmd+S / Ctrl+S → "save" アクション
  - 修飾キーなし / 他のキーは無視
  - readonlyタブでは保存しない
- 既存の `ScriptEditorComponent.stories.tsx` のplay関数で統合確認

### ストーリー計画

- UI変更は最小限（既存の保存ダイアログを流用）。ストーリー追加は不要、既存ストーリーで動作確認
