# 現在のタスク

**出典:** `tasks/prd-inserted-tasks.md`

- [ ] ドキュメントの外部参照は何の言語で書かれたものか、という情報を構造としてすべて持つようにして。

## 周辺情報

現状の `ExternalLink` 型:

```typescript
type ExternalLinkType = "wikipedia-en" | "wikipedia-ja" | "mathworld" | "nlab" | "paper" | "other";
type ExternalLink = {
  readonly type: ExternalLinkType;
  readonly url: string;
  readonly label: LocalizedText;
};
```

- `type` はリンク先サービスの種類だが、言語情報も部分的に含む（wikipedia-en/ja）
- しかし `nlab`（英語のみ）、`paper`（言語不明）、`other` には言語情報がない
- 新たに `documentLanguage` フィールドを追加して、リンク先ドキュメントの言語を明示する

## テスト計画

- `referenceEntry.test.ts`: サンプルデータに `documentLanguage` を追加
- `referenceContent.test.ts`: 外部リンク整合性テストに `documentLanguage` の検証を追加
- `referenceUILogic.test.ts`: `buildModalData` のテストに `documentLanguage` の受け渡し確認

## ストーリー計画

- `ReferenceModal.stories.tsx` / `ReferencePopover.stories.tsx`: 外部リンクに言語表示が出ることを確認
- UI変更: リンクラベルの横に言語タグ（例: `[en]`, `[ja]`）を表示

## 実装計画

1. `referenceEntry.ts`: `ExternalLink` に `readonly documentLanguage: Locale` を追加
2. `referenceContent.ts`: 全178件の外部リンクに `documentLanguage` を付与
   - `wikipedia-en` → `"en"`
   - `wikipedia-ja` → `"ja"`
   - `nlab` → `"en"`（英語サイト）
   - `mathworld`, `paper`, `other` → 個別判断
3. `referenceUILogic.ts`: `ModalData.externalLinks` に `documentLanguage` を追加
4. `ReferenceModal.tsx`: リンクラベルに言語タグを表示
5. テスト・ストーリー更新
