# クエスト問題群 設計ドキュメント

## 概要

Formal Proof Pad のクエストモードで出題する練習問題群を定義する。
ユーザーは空のワークスペースから公理を選び、推論規則を適用して目標式を導出する。

## ドキュメント構成

| ファイル                                                               | 内容                                       |
| ---------------------------------------------------------------------- | ------------------------------------------ |
| [01-propositional-basics.md](./01-propositional-basics.md)             | 命題論理の基礎（Łukasiewicz系 A1-A3 + MP） |
| [02-propositional-intermediate.md](./02-propositional-intermediate.md) | 命題論理の中級（演繹定理的テクニック）     |
| [03-propositional-advanced.md](./03-propositional-advanced.md)         | 命題論理の上級（否定、対偶、背理法）       |
| [04-predicate-basics.md](./04-predicate-basics.md)                     | 述語論理の基礎（A4-A5 + Gen）              |
| [05-predicate-advanced.md](./05-predicate-advanced.md)                 | 述語論理の上級（複合量化子、自由変数）     |
| [06-equality.md](./06-equality.md)                                     | 等号付き論理（E1-E3 + 等号推論）           |

## 問題の難易度

- **Level 1 (入門):** 1〜3ステップ。公理のインスタンス化と1回のMP
- **Level 2 (初級):** 3〜6ステップ。複数回のMPチェイン
- **Level 3 (中級):** 6〜12ステップ。S公理の活用、入れ子のMP
- **Level 4 (上級):** 12〜25ステップ。否定公理、対偶、複雑な証明
- **Level 5 (挑戦):** 25ステップ以上。自力発見が困難な証明

## 問題のフォーマット

各問題は以下の形式で記述する:

```markdown
### Q-XX: [問題名]

**難易度:** Level N
**体系:** Łukasiewicz / Predicate Logic / Equality Logic
**ゴール:** `[DSLテキスト]`
**ヒント:** [任意のヒント]

**解法の概略:**

1. ステップ1の説明
2. ステップ2の説明
   ...
```

## 解答ノート

各問題の完全な形式証明を `solutions/` ディレクトリに配置する。

| ファイル                                                                                                       | 内容              |
| -------------------------------------------------------------------------------------------------------------- | ----------------- |
| [solutions/01-propositional-basics-solutions.md](./solutions/01-propositional-basics-solutions.md)             | Q-01〜Q-07 の解答 |
| [solutions/02-propositional-intermediate-solutions.md](./solutions/02-propositional-intermediate-solutions.md) | Q-08〜Q-14 の解答 |
| [solutions/03-propositional-advanced-solutions.md](./solutions/03-propositional-advanced-solutions.md)         | Q-15〜Q-24 の解答 |
| [solutions/04-predicate-basics-solutions.md](./solutions/04-predicate-basics-solutions.md)                     | Q-25〜Q-32 の解答 |
| [solutions/05-predicate-advanced-solutions.md](./solutions/05-predicate-advanced-solutions.md)                 | Q-33〜Q-38 の解答 |
| [solutions/06-equality-solutions.md](./solutions/06-equality-solutions.md)                                     | Q-39〜Q-45 の解答 |

各解答には:

- 公理のインスタンス化の具体的な代入を明記
- 推論ステップごとの根拠（公理名、既証補題名、MP の参照先）
- 既証の補題を再利用するためのまとめ表

## 設計方針

1. **段階的学習:** 各レベルは前のレベルの知識を前提とする
2. **名前付き定理:** 有名な定理にはその名前を明記する（例: 恒等律、交換則）
3. **解答付き:** すべての問題に解法の概略と解答ノート（形式証明）を付ける
4. **実用的:** 後のステップで「使える」補題を先に証明させる構成にする
5. **DSL表記:** ゴールはプロジェクトのDSL構文で記述する
