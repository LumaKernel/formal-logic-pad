## 実行タスク

**出典:** tasks/prd-logic-pad-world.md — クエストモード拡充

**タスク:** group-basics カテゴリのクエストを 6 問 → 10 問に拡充する（group-07〜group-10 を追加）

### 周辺情報

- group-basics は現在 6 問で、全カテゴリ中最少
- 他のカテゴリはすべて 10 問以上
- 群論の基礎公理: G1(結合律), G2L/G2R(左右単位元), G3L/G3R(左右逆元), E1〜E4(等号公理)
- group-proofs カテゴリ (13問) はより難しい等号推論の証明問題

### テスト計画

- `builtinQuests.test.ts` のクエスト数を 239 → 243 に更新
- `builtinModelAnswers.test.ts` の模範解答テスト（ゴール達成・ワークスペース構築・自動レイアウト）が自動的に追加される
- 既存テストが壊れないことを確認

### ストーリー計画

- UI 変更なし（クエスト追加のみ）。ストーリー変更不要
- HubPageView.stories.tsx は `builtinQuests.slice(0, 20)` なので影響なし
