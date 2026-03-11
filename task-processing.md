# 実行中タスク

**ソース:** `tasks/prd-inserted-tasks.md`

> MPのドキュメントなどでのブロック数式の描画で、元のコードが露出しているように思えます。

## 調査結果

- `referenceContent.ts` の MP bodyに `*detachment*`、`*分離規則*` などの `*italic*` マークアップがある
- `parseInlineMarkdown()` は `**bold**` のみサポートで `*italic*` を処理していない
- 結果として `*detachment*` がそのまま表示される（「元のコードが露出」）
- `InlineElement` 型にも "italic" タイプがない

## テスト計画

- `referenceUILogic.test.ts`: `parseInlineMarkdown` に italic パースのテストを追加
  - 単独 italic: `*text*`
  - bold と italic の混在: `**bold** and *italic*`
  - 閉じ `*` がない場合のフォールバック
  - bold 内に italic がある場合（サポートしない: ネストは非対応でOK）
- `ReferenceModal.test.tsx`: body に italic を含むエントリで `<em>` がレンダリングされることを確認
- `ReferencePopover.test.tsx`: summary に italic を含む場合のテスト

## ストーリー計画

- 既存の `ReferenceModal.stories.tsx` のサンプルデータに `*italic*` を含めて確認
- 新ストーリーは不要（既存ストーリーのデータ更新で十分）

## 実装計画

1. `referenceUILogic.ts`: `InlineElement` 型に `"italic"` を追加
2. `referenceUILogic.ts`: `parseInlineMarkdown()` を拡張して `*...*` を認識
   - 注意: `**bold**` の `**` と `*italic*` の `*` を正しく区別する必要がある
3. `InlineMarkdown.tsx`: `"italic"` 要素を `<em>` でレンダリング
4. テスト追加・更新
