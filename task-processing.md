## タスク: group-proofsカテゴリにクエスト4問追加

ソース: prd-logic-pad-world.md（クエストモードの充実）

group-proofsカテゴリは現在5問（最少）。複合項(a\*b)に対する公理適用を学ぶクエスト4問を追加し9問にする。

追加クエスト:

- group-12: e \* (a \* b) = a \* b （複合項への左単位元G2L適用, difficulty 2）
- group-13: (a \* b) \* e = a \* b （複合項への右単位元G2R適用, difficulty 2）
- group-14: i(a \* b) \* (a \* b) = e （複合項への左逆元G3L適用, difficulty 2）
- group-15: (a \* b) \* i(a \* b) = e （複合項への右逆元G3R適用, difficulty 2）

### テスト計画

- `src/lib/quest/builtinQuests.test.ts`: クエスト総数 155→159 に更新
- `src/lib/quest/builtinModelAnswers.test.ts`: 模範解答テスト自動追加（各3ステップ）

### ストーリー計画

- UI変更なし。QuestCatalogComponentのストーリーで表示確認のみ

### 変更ファイル

- `src/lib/quest/builtinQuests.ts`: 4クエスト定義追加
- `src/lib/quest/builtinModelAnswers.ts`: 4模範解答追加
- `src/lib/quest/builtinQuests.test.ts`: カウント更新
