タスク元: tasks/prd-logic-pad-world.md（クエスト追加の継続）

## 実行タスク

Peano Arithmetic 計算クエスト4問追加（peano-13〜peano-16）

### 追加するクエスト

1. peano-13: 0 + S(0) = S(0) — PA4+PA3+E4 チェーン (difficulty 3)
2. peano-14: 0 × S(0) = 0 — PA6+PA5+PA3+E3 チェーン (difficulty 3)
3. peano-15: S(0) × S(0) = S(0) — PA6+以前の結果活用 (difficulty 3)
4. peano-16: S(S(0)) + S(0) = S(S(S(0))) — 2+1=3 (difficulty 3)

### テスト計画

- `builtinQuests.test.ts`: クエスト数アサーションを 207→211 に更新
- `builtinModelAnswers.test.ts`: 各模範解答の自動テスト（ゴール達成・ワークスペース構築・自動レイアウト）

### ストーリー計画

- UI変更なし（HubPageView.stories.tsx は slice(0,20) を使用しており更新不要）
