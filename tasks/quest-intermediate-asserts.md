# クエストストーリーの中間ステップ not-proved assert 追加

各クエスト完了ストーリーの play 関数で、証明の各ステップごとにクエストが**まだ完了していない**（`"0 / 1"`）ことを assert する。
これにより、クエスト判定ロジックの誤りで途中ステップで proved になるバグを検出できる。

**重要: 1 回のイテレーションで 1 つのストーリーのみ対応すること。**

ファイル: `src/app/workspace/[id]/WorkspacePageView.stories.tsx`

## FullFlow ストーリー（証明を1ステップずつ構築）

- [x] `QuestCompleteProp01FullFlow` — 全8ステップ中7ステップ後に `"0 / 1"` assert を追加（最終ステップのみ `"1 / 1"` + `"Proved!"`）
- [x] `QuestCompleteNd01FullFlow` — 全4ステップ中3ステップ後に `"0 / 1"` assert を追加
- [x] `QuestCompleteSc01FullFlow` — step1,2後に `"0 / 1"` assert追加。step3(implication-right)後はidentity自動検出でゴール達成するため除外
- [x] `QuestCompleteTab01FullFlow` — step1後に `"0 / 1"` assert追加。step3(¬→)後は矛盾自動検出でゴール達成するため除外
- [x] `QuestCompleteAt01FullFlow` — step1後に `"0 / 1"` assert追加。step3(α規則F∨)後はゴール自動達成のため除外
- [x] `QuestCompletePred01FullFlow` — step1後に `"0 / 1"` assert追加。step2(代入)後はゴール自動達成のため除外

## FromHub ストーリー（Hubからの遷移 + 証明完了）

- [x] `QuestCompleteNd01FromHub` — step1(仮定追加),step2(式編集),step3(→I規則選択)後に `"0 / 1"` assert追加
- [x] `QuestCompleteProp01FromHub` — 全8ステップ中7ステップ後に `"0 / 1"` assert追加
- [x] `QuestCompleteSc01FromHub` — step1,2後に `"0 / 1"` assert追加。step3(implication-right)後はidentity自動検出のため除外
- [x] `QuestCompleteTab01FromHub` — step1後に `"0 / 1"` assert追加。step2は既存。step3(¬→)後は矛盾自動検出のため除外
- [x] `QuestCompleteAt01FromHub` — step1後に `"0 / 1"` assert追加。step2は既存。step3(α F∨)後はゴール自動達成のため除外

## Interactive / 基本ストーリー

- [ ] `QuestCompleteProp01` — 各ステップ後に `"0 / 1"` assert を追加
- [ ] `QuestCompleteNd01Interactive` — 現在: 初期 + 1 中間チェックあり。全ステップに拡充

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
