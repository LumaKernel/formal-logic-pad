# 現在のタスク

**ソース:** `tasks/prd-inserted-tasks.md` 2行目

> 各公理呼び出しの近くにクリックから、体系に関する解説ウィンドウを起動できるような機能を追加

## 周辺情報

- EditableProofNode.tsx に既にaxiomNameバッジがある（line 475-487）。現在は非クリッカブルな `<div>`
- `identifyAxiomName()` は `axiomId` と `displayName` を返す
- `getAxiomReferenceEntryId(axiomId)` でReferenceEntryIdへのマッピングが既存
- ProofWorkspace.tsx で `axiomNames` Map が計算済みだが `displayName` のみ。`axiomId` も含める必要あり
- 体系バッジクリック（前回実装済み）と同じパターンでUIを実装する

## テスト計画

1. **EditableProofNode.test.tsx**: 新テスト追加
   - `onClickAxiomBadge` 指定時にバッジがボタンになること
   - `onClickAxiomBadge` 未指定時はバッジがspanのまま
   - クリックで `onClickAxiomBadge` が呼ばれること
2. **ProofWorkspace.test.tsx**: 新テスト追加
   - 公理ノードのバッジクリックで `onOpenReferenceDetail` が正しいentryIdで呼ばれること

## ストーリー計画

- **ProofWorkspace.stories.tsx**: `WithReferencePopover` ストーリーを更新して公理バッジクリック → Detail表示の検証を追加
