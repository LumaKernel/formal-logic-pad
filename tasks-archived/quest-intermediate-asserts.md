# クエストストーリーの中間ステップ not-proved assert 追加（アーカイブ）

## FullFlow ストーリー（証明を1ステップずつ構築）— 全完了

- [x] `QuestCompleteProp01FullFlow` — 全8ステップ中7ステップ後に `"0 / 1"` assert を追加（最終ステップのみ `"1 / 1"` + `"Proved!"`）
- [x] `QuestCompleteNd01FullFlow` — 全4ステップ中3ステップ後に `"0 / 1"` assert を追加
- [x] `QuestCompleteSc01FullFlow` — step1,2後に `"0 / 1"` assert追加。step3(implication-right)後はidentity自動検出でゴール達成するため除外
- [x] `QuestCompleteTab01FullFlow` — step1後に `"0 / 1"` assert追加。step3(¬→)後は矛盾自動検出でゴール達成するため除外
- [x] `QuestCompleteAt01FullFlow` — step1後に `"0 / 1"` assert追加。step3(α規則F∨)後はゴール自動達成のため除外
- [x] `QuestCompletePred01FullFlow` — step1後に `"0 / 1"` assert追加。step2(代入)後はゴール自動達成のため除外

## FromHub ストーリー（Hubからの遷移 + 証明完了）— 全完了

- [x] `QuestCompleteNd01FromHub` — step1(仮定追加),step2(式編集),step3(→I規則選択)後に `"0 / 1"` assert追加
- [x] `QuestCompleteProp01FromHub` — 全8ステップ中7ステップ後に `"0 / 1"` assert追加
- [x] `QuestCompleteSc01FromHub` — step1,2後に `"0 / 1"` assert追加。step3(implication-right)後はidentity自動検出のため除外
- [x] `QuestCompleteTab01FromHub` — step1後に `"0 / 1"` assert追加。step2は既存。step3(¬→)後は矛盾自動検出のため除外
- [x] `QuestCompleteAt01FromHub` — step1後に `"0 / 1"` assert追加。step2は既存。step3(α F∨)後はゴール自動達成のため除外

## Interactive / 基本ストーリー（部分完了）

- [x] `QuestCompleteNd01Interactive` — step1(仮定追加)後に `"0 / 1"` assert追加。step2(式編集後)は既存のassertをgoalPanelに統一
