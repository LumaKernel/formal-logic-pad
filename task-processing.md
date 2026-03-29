## 実行中タスク

**ソース:** `tasks/quest-stories.md` > propositional-basics > prop-06

- [-] prop-06: S公理の特殊ケース — Quest Complete ストーリー作成・確認

### コンテキスト

- prop-06: (φ → (φ → ψ)) → (φ → ψ) を証明
- 12ステップ（CI安全: 20ステップ制限内）
- allowedAxiomIds: ["A1", "A2"]
- systemPresetId: "lukasiewicz"

### テスト計画

- `WorkspacePageView.stories.tsx` に `QuestCompleteProp06` と `QuestCompleteProp06ModelAnswer` を追加
- play関数でインタラクションテスト（完了状態・ゴール達成・バナー確認）

### ストーリー計画

- QuestCompleteProp06: `buildCompletedQuestWorkspace("prop-06")` 使用、完了状態の検証
- QuestCompleteProp06ModelAnswer: 模範解答ベースの完了状態（静的確認用）
