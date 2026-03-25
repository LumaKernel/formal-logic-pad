## 現在のタスク

**出典:** `tasks/inserted-tasks.md`

### 対象タスク

- [-] ドキュメント内の用語でもすぐ飛べるような仕組みを用意

### コンテキスト

- サブタスク: 既存の飛ばすことができる用語は飛ぶように変更していく
- 現在、body テキスト内の用語（例: "Modus Ponens", "公理A1"）はプレーンテキストで、他のリファレンスエントリへのリンクになっていない
- インラインマークダウンパーサー (`referenceUILogic.ts`) は `<b>`, `<i>`, `<code>`, `$...$`, `_subscript` のみ対応
- リンク構文 `[text](url)` は未サポート

### テスト計画

- `referenceUILogic.test.ts` に新しいリンク構文のパーステストを追加
- `InlineMarkdown.test.tsx` にリンクレンダリングのテストを追加（存在すれば）
- `referenceContent.test.ts` にリンク先IDの妥当性検証テストを追加

### ストーリー計画

- `InlineMarkdown.stories.tsx` にリンク付きテキストのストーリーを追加（存在すれば）
- `ReferenceViewerPageView.stories.tsx` でリンク動作を確認

### 実装計画

1. リンク構文を決定: `[[ref:rule-mp]]`（IDのタイトルを自動表示）または `[[ref:rule-mp|Modus Ponens]]`（カスタムテキスト）
2. `referenceUILogic.ts` の `parseInlineMarkdown` にリンク構文パースを追加
3. `InlineMarkdown.tsx` にリンクレンダリングを追加（`onNavigate` コールバック経由）
4. 既存ドキュメントのbodyテキストにリンク構文を適用
