# 実行中タスク

## タスク元: tasks/prd-logic-pad-world.md

カット除去定理を遂行すること — SC模範解答ステップタイプの追加と、カット除去クエスト(sc-ce-01〜05)の模範解答実装

## 周辺情報

- 現在 ModelAnswerStep に SC 用のステップタイプがない
- 5つの sc-ce-* クエストの模範解答はプレースホルダー（axiom 1ステップのみ）
- SC 規則適用は `applyScRuleAndConnect` が workspaceState.ts に既存
- SC 規則パラメータは `ScRuleApplicationParams` 型（scApplicationLogic.ts）
- SC エッジは sc-axiom / sc-single / sc-branching の3種類

## テスト計画

- `modelAnswer.test.ts`: SC ステップタイプのビルドテストを追加
  - sc-root（ルートシーケント配置）
  - sc-rule（SC規則適用、分岐含む）
- `builtinModelAnswers.test.ts`: sc-ce-01〜05 の模範解答がゴール達成するかの既存テストが通るようにする

## ストーリー計画

- UI変更なし（模範解答のデータ定義のみ）
- ブラウザテスト: ストーリーブック上で SC クエストの模範解答が正しく表示されることを確認
