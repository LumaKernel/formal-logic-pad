## 現在のタスク

**ソース:** `tasks/prd-logic-pad-world.md` - クエストモード

> - [ ] 大きなゴールはいくつかあるし、学ぶ順番は自由でどこからでも再開したり進めることができる

### 実装内容

クエスト一覧UIコンポーネントの作成（`src/lib/quest/`）

- 純粋ロジック層（questCatalogListLogic.ts）: カタログ表示用データ変換、フィルタ状態管理
- UIコンポーネント（QuestCatalogComponent.tsx）: カテゴリ別グループ表示、難易度・完了状態フィルタ、評価バッジ
- テスト＆ストーリー

### 周辺情報

- 純粋ロジック（questDefinition, builtinQuests, questProgress, questCatalog）は完成済み
- NotebookListComponent, NotebookCreateFormComponent のUIパターンを踏襲
- インラインCSSProperties + CSS変数パターン
- play関数付きストーリー必須
