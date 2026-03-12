## タスク

from: `tasks/prd-docs-improve.md`

> ドキュメントには関連するクエスト、のようなものも用意して、そこからクエストを開始できるようにしよう

### テスト計画

- `src/lib/reference/referenceEntry.test.ts` に `relatedQuestIds` フィールド関連のテスト追加
- `src/lib/reference/referenceContent.test.ts` に全エントリの relatedQuestIds バリデーション追加
- `src/lib/reference/ReferenceModal.test.tsx` にクエスト開始ボタンのテスト追加
- `src/lib/reference/ReferenceViewerPageView.test.tsx` にクエスト開始ボタンのテスト追加
- `src/lib/reference/ReferenceBrowserComponent.test.tsx` にクエスト開始コールバックのテスト追加

### ストーリー計画

- `ReferenceModal.stories.tsx` にクエスト関連表示のストーリー追加/更新
- `ReferencePopover.stories.tsx` は軽量表示のため変更不要
- `ReferenceViewerPageView.stories.tsx` にクエスト開始ボタンのストーリー追加/更新

### 実装計画

1. `referenceEntry.ts`: `ReferenceEntry` 型に `relatedQuestIds?: readonly QuestId[]` 追加
2. `referenceContent.ts`: 各エントリに関連クエストIDを設定
3. `referenceUILogic.ts` or `referenceEntry.ts`: クエスト情報を解決するユーティリティ
4. `ReferenceModal.tsx`: 関連クエストセクション追加（クエスト名表示 + 開始ボタン）
5. `ReferenceViewerPageView.tsx`: 関連クエストセクション追加
6. `ReferenceBrowserComponent.tsx`: `onStartQuest` コールバック追加
7. `HubPageView.tsx`: ReferenceBrowserComponent に onStartQuest を配線
