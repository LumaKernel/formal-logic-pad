# タスク: ゴール詳細パネル - axiom violation時に違反公理を表示

**出典:** `tasks/prd-2026-03-10.md` > ゴールの論理式をクリックすると詳細が開くようにしよう > axiom violationなら、どれが違反してる公理なのか

## 周辺情報

- `GoalViolationInfo` は現在 `hasAxiomViolation: boolean` のみで、どの公理が違反かの情報を持っていない
- `questCompletionLogic.ts` の `checkQuestGoalsWithAxioms` は既に `violatingAxiomIds: ReadonlySet<AxiomId>` を計算している
- `GoalPanelItem` に `violatingAxiomIds` を追加し、UIで公理制限違反セクションに赤ハイライトで表示する

## テスト計画

1. **goalPanelLogic.test.ts**: `computeGoalPanelData` のテスト追加
   - `GoalViolationInfo` に `violatingAxiomIds` を追加した場合のテスト
   - 違反公理IDが `GoalPanelItem.violatingAxiomIds` に正しく反映されるか
   - 違反なしの場合は undefined のまま
2. **GoalPanel.test.tsx**: UI表示テスト
   - axiom violation 時に違反公理のハイライト表示が出るか
   - 詳細パネル展開時に違反公理セクションが表示されるか
3. **proofMessages.ts**: i18n メッセージ追加（違反公理表示用）

## ストーリー計画

- GoalPanel.test.tsx のストーリーに axiom violation with specific IDs のケースを追加（既存のストーリーで対応可能かも）

## 実装計画

1. `goalPanelLogic.ts`: `GoalViolationInfo` に `violatingAxiomIds: readonly string[]` 追加
2. `goalPanelLogic.ts`: `GoalPanelItem` に `violatingAxiomIds: readonly string[] | undefined` 追加
3. `goalPanelLogic.ts`: `computeGoalPanelData` で `violatingAxiomIds` を `GoalPanelItem` に渡す
4. `ProofWorkspace.tsx`: `goalViolations` 生成で `violatingAxiomIds` を含める
5. `GoalPanel.tsx`: 公理制限違反時に違反公理を赤ハイライトで表示
6. `proofMessages.ts` + i18n: 違反公理表示用メッセージ追加
