## 現在のタスク

**出典:** `tasks/play-function-enhancement.md` PLAY-WS-04

- [-] PLAY-WS-04: `WithGoal` — ゴールパネルの初期状態確認＋公理操作で変化確認

### コンテキスト

- WithGoalストーリーは `lukasiewiczSystem` + ゴール `φ → φ` (Identity) + A1ノード1つ
- GoalPanelのtestIdは `${workspaceTestId}-goal-panel`
- ゴールアイテムは `${testId}-item-0`, トグルは `${testId}-toggle`

### テスト計画

- WorkspacePageView.stories.tsx の WithGoal ストーリーの play 関数を強化
- workspaceTestId="workspace" を追加
- ゴールパネルの表示確認→ゴール式テキスト確認→A1ノード存在確認

### ストーリー計画

- 既存の WithGoal ストーリーを修正（新規作成なし）
