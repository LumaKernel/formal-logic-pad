# 現在のタスク

## タスク元: tasks/prd-custom-quests.md

- 自作クエストの複製
- 自作クエストの削除

## テスト計画

- `CustomQuestListComponent.stories.tsx` に複製・削除操作のストーリーを追加
  - 複製ボタンクリック → `onDuplicateQuest` コールバック
  - 削除ボタンクリック → `onDeleteQuest` コールバック
- `HubPageView.stories.tsx` の `WithCustomQuests` に複製・削除コールバック追加

## ストーリー計画

- `CustomQuestListComponent.stories.tsx`:
  - `DuplicateQuest` ストーリー（複製ボタンクリック）
  - `DeleteQuest` ストーリー（削除ボタンクリック）

## 実装計画

1. `CustomQuestListComponent.tsx` に `onDuplicateQuest`, `onDeleteQuest` コールバックpropsを追加
2. 各クエストアイテムに複製・削除ボタンを追加（開始ボタンの横に配置）
3. `HubPageView.tsx` の props に `onDuplicateQuest`, `onDeleteQuest` を追加
4. `HubContent.tsx` で `duplicateAsCustomQuest`, `removeCustomQuest` を使用するハンドラを実装
5. ストーリー・テスト更新
