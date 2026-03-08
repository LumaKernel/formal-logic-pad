## 実行中タスク

カバレッジ改善（第7回）: Branch 98.73% → さらなる改善

元タスク: カバレッジ100%を目指すアーキテクチャ品質指標（CLAUDE.mdの方針）

### 対象ファイル

1. `proofCollectionPanelLogic.ts` (Branch 95.45%, line 147) - isFolderEditingの2nd condition未テスト
2. `CustomQuestListComponent.tsx` (Branch 98.78%, line 1277) - 空状態ブランチの未テスト
3. `ProofWorkspace.tsx` (Branch 88.22%) - コレクションインポート/ペーストエラーパス

### テスト計画

1. `proofCollectionPanelLogic.test.ts`: isFolderEditing で folderEditing は存在するが folderId が異なるケースを追加
2. `CustomQuestListComponent.test.tsx`: items が空で isCreating/isImporting が true の場合のテスト追加
3. `ProofWorkspace.test.tsx`: IncompatibleStyle ペーストエラーパスのテスト追加（可能であれば）

### ストーリー計画

UI変更なし。テスト追加のみ。
