## 現在のタスク

**ソース:** `tasks/prd-theories.md` L28

- [ ] 記法・記号一覧の解説(en/ja)

### 周辺情報
- `src/lib/reference/` にリファレンスライブラリがある
- `referenceEntry.ts` に型定義と検索ロジック
- `referenceContent.ts` にコンテンツデータ
- カテゴリとして `notation` がある（記法・記号用）
- 既存パターン: 公理(axiom)、推論規則(inference-rule)、論理体系(logic-system) の解説は完了済み
- エントリ追加時は `allReferenceEntries` 配列 + テストのエントリ数更新が必要
