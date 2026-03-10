## タスク: ゴール詳細パネルに参照リンクを追加

**出典:** `tasks/prd-2026-03-10.md` — ゴールの論理式をクリックすると詳細が開く → 参照リンク

### 周辺情報

- GoalPanel.tsx の GoalDetailPanel に4セクション（解説・ヒント・公理群・学習ポイント）は実装済み
- ProofWorkspace には既に `referenceEntries` + `onOpenReferenceDetail` のpropsパターンがある
- `getAxiomReferenceEntryId(axiomId)` で公理IDからリファレンスエントリIDを解決可能
- `ReferencePopover` コンポーネントが `(?)` ボタン + ポップオーバーを提供
- `findEntryById(entries, id)` でエントリ検索

### テスト計画

- `GoalPanel.test.tsx` に追加:
  - referenceEntries指定時に公理の横に(?)ボタンが表示される
  - referenceEntries未指定時は(?)ボタンが非表示
  - onOpenReferenceDetailが呼ばれる（(?)→詳細ボタン or 直接クリック）
  - referenceEntryに該当しない公理IDの場合は(?)が表示されない

### ストーリー計画

- `ProofWorkspace.stories.tsx` の既存クエストモードストーリー（QuestMode等）で参照リンクが動作することを確認

### 実装計画

1. GoalPanelPropsに `referenceEntries` + `locale` + `onOpenReferenceDetail` を追加
2. GoalDetailPanelの公理セクションに `ReferencePopover` を追加
3. ProofWorkspace.tsx から GoalPanel に参照props を転送
4. テスト追加
5. index.ts エクスポート更新（必要なら）
