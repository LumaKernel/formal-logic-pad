## 現在のタスク

equality-basics カテゴリ（eq-01〜eq-10）の模範解答テストを追加する

**出典:** prd-logic-pad-world.md のクエストモード開発。全251問中、equality-basics の10問だけテストが存在しない。

### テスト計画

- `src/lib/quest/builtinModelAnswers.test.ts` に `equality-basics` の describe ブロックを追加
- 既存の15カテゴリのテストパターンに従う（模範解答がゴールを達成する / ワークスペース構築が成功する / 自動レイアウトが適用される）

### ストーリー計画

- UI変更なし。テストのみ。
