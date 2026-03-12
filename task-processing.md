## タスク

**ソース**: `tasks/prd-docs-improve.md`

> ビルトインのドキュメントは、強調の `**`, `*`, `__` などはすべて `<b>`, `<i>` などで、インラインコードも `<code>` で書くようにすべて完全に統一してください。
> 強制するように簡単なチェッカー(スクリプト、もしくはテストによるインポートしてマッチしての一括チェック)も作ってCIで確認されるようにしてください。

## 周辺情報

- ビルトインドキュメント: `src/lib/reference/referenceContent.ts` (61エントリ, ~4810行)
- パーサー: `src/lib/reference/referenceUILogic.ts` の `parseInlineMarkdown`
- レンダラー: `src/lib/reference/InlineMarkdown.tsx`
- 現在 `**bold**` が ~447箇所、`*italic*` が数箇所使用されている

## 実装計画

1. `parseInlineMarkdown` を拡張: `<b>`, `<i>`, `<code>` HTMLタグをパースできるようにする
2. `InlineElement` 型に `"code"` を追加
3. `InlineMarkdown.tsx` に `<code>` レンダリングを追加
4. `referenceContent.ts` の全 `**text**` → `<b>text</b>`, `*text*` → `<i>text</i>` に変換
5. チェッカーテストを `referenceContent.test.ts` に追加: Markdown記法の使用を検出して失敗させる

## テスト計画

- `referenceUILogic.test.ts`: HTMLタグパース用テストケースを追加
- `referenceContent.test.ts`: 全エントリのbody/summaryに `**`, `__`, Markdown `*` が含まれないことを検証するテスト追加

## ストーリー計画

- UI変更は最小限（`<code>` のスタイリング追加のみ）。既存ストーリーで確認可能
