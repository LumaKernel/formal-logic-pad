## タスク: カバレッジ改善（第5回）

出典: CLAUDE.md「100%カバレッジを目指す」

### 対象ファイル

- proofCollectionPanelLogic.ts: Branch 95.45% (line 147)
- normalForm.ts: Branch 98% (lines 154, 230, 554)
- naturalDeduction.ts: Branch 95.74% (lines 259-359)

### テスト計画

- proofCollectionPanelLogic.test.ts: `isFolderEditing` の && 短絡評価テスト追加
- normalForm.ts: 最後の if 条件を fall-through 化して v8 artifact を回避
- naturalDeduction.ts: 既に v8 ignore 済みの防御コード。if-chain 構造の見直しで v8 artifact 回避

### ストーリー計画

- UI変更なし
