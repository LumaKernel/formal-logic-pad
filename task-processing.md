## 実行中タスク

**出典:** `tasks/inserted-tasks.md`

**タスク:** `/reference/guide-hilbert-proof-method` で `[[ref:axiom-a1|A1]]` がそのまま表示されるバグ修正

### 根本原因

`parseInlineMarkdown` は `<b>...</b>` を1トークンとして処理し、中身を `{type: "bold", content: "..."}` として返す。
`<b>[[ref:axiom-a1|A1]] (K):</b>` の場合、`[[ref:...]]` は bold 要素の `content` 文字列内に残り、再帰的にパースされない。
`renderContentWithMath` は `$...$` のみ処理するため、`[[ref:...]]` と `[[cite:...]]` は生文字列として表示される。

### 修正方針

`renderContentWithMath` を拡張して `[[ref:...]]` と `[[cite:...]]` も処理する `renderContentWithInline` に変更。
bold/italic 内でもリファレンスリンク・参考文献リンクが正しくレンダリングされるようにする。

### テスト計画

- `referenceUILogic.test.ts`: 既存のパーステストはそのまま（パース層は変更なし）
- `InlineMarkdown.test.tsx`: bold内 `[[ref:...]]` のレンダリングテスト追加
- `BodyContent.test.tsx`: 必要に応じて統合テスト追加

### ストーリー計画

- `ReferenceViewerPageView.stories.tsx`: `[[ref:...]]` を含む bold コンテンツのストーリー追加
