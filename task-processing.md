# カバレッジ改善: Branch カバレッジが低いファイル群

## 対象（PRD由来ではなく、カバレッジ指標に基づく改善）

Branch カバレッジが 100% でないファイルの改善（全体 Branch: 94.89%）

### 対象ファイル（優先度順）
1. `storageService.ts` - Branch 66.66% (line 47: `??` operator in Effect.sync)
2. `nodeRoleLogic.ts` - Branch 75% (line 97: OR条件)
3. `proofCollectionCompatibility.ts` - Branch 75% (line 97: OR条件)
4. `useHistory.ts` - Branch 75% (line 60: maxPastSize条件分岐)
5. `multiSelection.ts` - Branch 75% (line 120: AND条件4つ)

※ `modelAnswer.ts` (68.42%) は大部分が `v8 ignore` 済みの未使用ステップタイプ。テスト追加は新ND/SC模範解答追加時に行うべきで、今回はスキップ。

## テスト計画

| ファイル | テストファイル | 追加テスト内容 |
|---------|-------------|-------------|
| storageService.ts | storageService.test.ts | `??` null coalescing の v8 ignore 追加（v8 artifact） |
| nodeRoleLogic.ts | nodeRoleLogic.test.ts | OR条件の各パス独立テスト |
| proofCollectionCompatibility.ts | proofCollectionCompatibility.test.ts | hasWarnings の各分岐テスト確認 |
| useHistory.ts | useHistory.test.ts | maxPastSize undefined vs 設定済みのテスト |
| multiSelection.ts | multiSelection.test.ts | rectsOverlap の4条件独立テスト |
