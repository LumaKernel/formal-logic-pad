# 実行中タスク

## タスク（prd-inserted-tasks.md より）

ビルトインのクエスト模範解答 - タブロー法（TAB）10問（tab-01〜tab-10）の模範解答を追加

## テスト計画

- `src/lib/quest/builtinModelAnswers.test.ts` に tab-basics セクションを追加
- 各問題について「模範解答がゴールを達成する」「ワークスペース構築が成功する」「自動レイアウトが適用される」の3テスト
- `src/lib/quest/modelAnswer.test.ts` に TAB ステップタイプの基本テストを追加（既存パターンに従う）

## ストーリー計画

- UI変更なし（データのみの追加）。既存の QuestCatalogComponent.stories.tsx で確認

## 実装計画

1. `modelAnswer.ts` の `ModelAnswerStep` 型に TAB ステップタイプを追加:
   - `tab-root`: ルートノード（ゴールの式）を配置
   - `tab-single`: 1前提の TAB 規則適用（¬→, ¬∨, ¬¬, ∧ 等）
   - `tab-branching`: 2前提の TAB 規則適用（→, ∨, ¬∧）
   - `tab-axiom`: 0前提の TAB 規則適用（BS, ⊥）

2. `modelAnswer.ts` の `buildModelAnswerWorkspace` の switch に TAB ケースを追加:
   - `tab-root`: addNode でルートノード配置
   - `tab-single/tab-branching/tab-axiom`: applyTabRuleAndConnect で規則適用

3. `builtinModelAnswers.ts` に tab-01〜tab-10 の模範解答を定義

4. テスト追加・実行
