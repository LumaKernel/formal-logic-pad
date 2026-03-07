## カバレッジ改善: v8 switch artifact対策 (languageToggleLogic, themeToggleLogic, scriptEditorLogic)

**出典:** カバレッジレポート - Branch カバレッジが低いファイル群

### タスク

switch文をif-chainに変換してv8のswitch branchカバレッジアーティファクトを解消する。

対象ファイル:
- `src/components/LanguageToggle/languageToggleLogic.ts` (Branch 75%)
- `src/components/ThemeToggle/themeToggleLogic.ts` (Branch 75%)
- `src/components/ScriptEditor/scriptEditorLogic.ts` (Branch 89.28%)

### テスト計画

- 既存テストがそのまま通ることを確認（ロジック変更なし、構造リファクタのみ）
- テスト追加は不要（既存テストで全ケースカバー済み）

### ストーリー計画

- UI変更なし。ストーリー変更不要。
