## 現在のタスク

**出典:** `tasks/quest-stories.md` — prop-04: 推移律 (Hypothetical Syllogism)

- [ ] prop-04: Quest Complete ストーリーが存在していなければ作成する
- [ ] 模範解答とクエスト攻略ストーリーをそれぞれ比べて、意図通りにそれぞれなっているか確認する

### テスト計画

- WorkspacePageView.stories.tsx に以下2ストーリーを追加:
  - `QuestCompleteProp04`: インタラクティブ完了（axiomステップのみ配置→MP手動適用なし、公理のみでは完了しないので全ステップ使用）
  - `QuestCompleteProp04ModelAnswer`: 模範解答ベースの完了状態（`buildCompletedQuestWorkspace`使用）
- play関数でインタラクションテスト（ゴール達成確認、ノード存在確認）

### ストーリー計画

- prop-04は15証明ステップ（8 axiom + 7 MP）。全ステップ使用版のインタラクティブストーリーを作成
- ModelAnswerストーリーは`buildCompletedQuestWorkspace("prop-04")`で静的確認
- 16エントリ（note含む）なので20ステップ制限内、CI安全

### ベースライン

- Stmts 99.80%, Branch 99.06%, Funcs 90.66%, Lines 99.81%
