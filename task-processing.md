## 実行中タスク

**ソース:** `tasks/prd-custom-quests.md` > 自作クエスト管理 > 自作クエストの保存・管理の仕組み

- [ ] 自作クエストの保存・管理の仕組み（ビルトインとは別枠で管理）

### 周辺情報

- 既存の `QuestDefinition` 型は `readonly` でイミュータブル
- `builtinQuests` は `readonly QuestDefinition[]` で静的データ
- `questProgress.ts` の serialization パターン（Map ↔ JSON）を踏襲
- `StorageService` (Effect Layer) で localStorage 抽象化済み
- カスタムクエストは `QuestDefinition` を再利用し、IDプレフィックスで区別（`custom-*`）

### テスト計画

- `src/lib/quest/customQuestState.test.ts` を新規作成
  - CRUD操作（add/update/remove）の純粋ロジックテスト
  - ID重複チェック、バリデーション
  - シリアライゼーション/デシリアライゼーション
  - ビルトインクエストとの統合（マージ、ID衝突防止）

### ストーリー計画

- UIなし（純粋ロジック層のみ）。ストーリー不要
