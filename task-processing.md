# 実行中タスク

**ソース**: `tasks/prd-logic-pad-world.md` — クエストモード拡充（group-proofs カテゴリ）

**タスク**: group-proofs カテゴリに3問追加（group-09, group-10, group-11）

## 背景

group-proofs カテゴリは現在2問のみ（全15カテゴリ中最少）。
group-basics（6問）→ group-proofs（2問）の段階が急峻で、段階的学習ギャップがある。

## 追加クエスト

1. **group-09**: 結合律のインスタンス化 `(a * b) * c = a * (b * c)`
   - systemPresetId: "group-full"
   - 公理: G1（3変数∀消去）
   - ステップ: 7（A4×3回 + MP×3回 + G1配置）
   - 難易度: 3
   - 学習ポイント: 多段階の∀消去パターン

2. **group-10**: 右逆元のインスタンス化 `a * i(a) = e`
   - systemPresetId: "group-full"
   - 公理: G3R（1変数∀消去）
   - ステップ: 3
   - 難易度: 2
   - 学習ポイント: 左逆元(G3L)との対比、右公理の活用

3. **group-11**: 可換律のインスタンス化 `a * b = b * a`
   - systemPresetId: "abelian-group"
   - 公理: G4（2変数∀消去）
   - ステップ: 5
   - 難易度: 2
   - 学習ポイント: アーベル群の可換律の具体化

## テスト計画

- `builtinModelAnswers.test.ts` — 自動テスト（既存テストフレームワークが全模範解答を自動検証するため、allModelAnswersに追加すれば自動対応）
- `builtinQuests.test.ts` — 既存テストがクエスト数を検証している場合はテスト数を更新

## ストーリー計画

- UI変更なし（データ追加のみ）

## 変更ファイル

- `src/lib/quest/builtinQuests.ts` — QuestDefinition 3件追加
- `src/lib/quest/builtinModelAnswers.ts` — ModelAnswer 3件追加
- `src/lib/quest/questDefinition.ts` — QuestId に group-09, group-10, group-11 追加
