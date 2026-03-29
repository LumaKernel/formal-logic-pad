## タスク: `QuestCompleteNd01FullFlow` に中間 not-proved assert 追加

**出典:** `tasks/quest-intermediate-asserts.md` > FullFlow ストーリー > 2番目

### 内容

`QuestCompleteNd01FullFlow` ストーリーの play 関数で、証明の各ステップ後にクエストが**まだ完了していない**（`"0 / 1"`）ことを assert する。

### テスト計画

- 既存のストーリーの play 関数を修正
- 各ステップ後に `goalPanel.toHaveTextContent("0 / 1")` を追加
- Storybook interaction test で検証

### ストーリー計画

- 既存 `QuestCompleteNd01FullFlow` を更新（新規ストーリー追加なし）
