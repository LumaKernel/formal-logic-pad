## タスク: `QuestCompleteTab01FullFlow` に中間 not-proved assert 拡充

**出典:** `tasks/quest-intermediate-asserts.md` > FullFlow ストーリー > 4番目

### 内容

`QuestCompleteTab01FullFlow` の play 関数で、既存の step2 後チェックに加え、step1, step3, step4 後にも `"0 / 1"` assert を追加する。

### テスト計画

- 既存のストーリーの play 関数を修正
- goalPanel 変数化 + 各ステップ後に assert 追加
- Storybook interaction test で検証

### ストーリー計画

- 既存 `QuestCompleteTab01FullFlow` を更新
