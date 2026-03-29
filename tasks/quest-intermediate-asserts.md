# クエストストーリーの中間ステップ not-proved assert 追加

各クエスト完了ストーリーの play 関数で、証明の各ステップごとにクエストが**まだ完了していない**（`"0 / 1"`）ことを assert する。
これにより、クエスト判定ロジックの誤りで途中ステップで proved になるバグを検出できる。

**重要: 1 回のイテレーションで 1 つのストーリーのみ対応すること。**

ファイル: `src/app/workspace/[id]/WorkspacePageView.stories.tsx`

## Interactive / 基本ストーリー

- [ ] `QuestCompleteProp01` — 既存ストーリーがローカルで不安定（MP操作でnode-7未生成）。CIでの安定性確認後に対応

## ModelAnswer ストーリー（事前構築済み証明のロード）

ModelAnswer ストーリーはロード時点で完了済みなので中間 assert は不要。
ただし、ロード直後に `"1 / 1"` であることは既に assert 済み。

対象外:

- `QuestCompleteProp01ModelAnswer`
- `QuestCompleteProp42ModelAnswer`
- `QuestCompleteProp19ModelAnswer`
- `QuestCompletePredAdv11ModelAnswer`
- `QuestCompleteEq01ModelAnswer`
- `QuestCompleteGroup01ModelAnswer`
- `QuestCompleteGroup07ModelAnswer`
- `QuestCompletePeano01ModelAnswer`
- `QuestCompletePeano07ModelAnswer`
- `QuestCompleteNd01`
- `QuestCompleteTab01`
- `QuestCompleteSc01`
- `QuestCompleteAt01`
