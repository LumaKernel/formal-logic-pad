## 現在のタスク

**ソース:** `tasks/quest-stories.md` — propositional-intermediate セクション

**タスク:** prop-35: Mendelson体系での恒等律 — Quest Complete ストーリー作成・確認

- [ ] Quest Complete ストーリーが存在していなければ作成する
- [ ] 模範解答とクエスト攻略ストーリーをそれぞれ比べて、意図通りにそれぞれなっているか確認する

### テスト計画

- `WorkspacePageView.stories.tsx` に `QuestCompleteProp35` と `QuestCompleteProp35ModelAnswer` ストーリーを追加
- play関数でインタラクションテスト（完了状態確認、体系バッジ "Mendelson" 確認、ゴール達成確認）

### ストーリー計画

- QuestCompleteProp35: `buildCompletedQuestWorkspace("prop-35")` 使用、5ステップ証明の完了状態
- QuestCompleteProp35ModelAnswer: 模範解答ベースの完了状態（静的確認用）

### 注意点

- prop-35はMendelson体系（systemPresetId: "mendelson"）。体系バッジは "Mendelson" を確認
- 5ステップ証明なのでCI timeout問題なし
