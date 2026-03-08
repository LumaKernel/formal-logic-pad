## 現在のタスク

**出典:** `tasks/prd-logic-pad-world.md` — `[-]` クエストモード的な形で、基礎を学んだり、問題形式で進めることができる。

**タスク:** 群論の等号推論クエスト4問追加（group-16〜group-19）

### 背景

- group-01〜group-06: 公理配置（1ステップ）
- group-07〜group-15: ∀消去パターン（3-7ステップ）
- **次のレベル:** 等号推論（E2+E3）を使って複数の等式を連鎖させる証明

### 追加クエスト

1. **group-16: a\*e = e\*a** (difficulty 3, 21 steps) — G2R+G2L+E2+E3で単位元の交換
2. **group-17: i(a)\*a = a\*i(a)** (difficulty 3, 21 steps) — G3L+G3R+E2+E3で逆元の交換
3. **group-18: (a\*e)\*e = a** (difficulty 3, 14 steps) — G2R二重適用+E3で推移律チェーン
4. **group-19: i(e) = e** (difficulty 4, 21 steps) — G3L+G2R+E2+E3で単位元の逆元

### テスト計画

- `builtinQuests.test.ts`: クエスト数を187→191に更新
- `builtinModelAnswers.test.ts`: 模範解答テスト（ゴール達成+ワークスペース構築+レイアウト）は自動生成

### ストーリー計画

- UI変更なし（クエスト定義の追加のみ）。HubPageView.stories.tsxは`builtinQuests.slice(0, 20)`使用のため変更不要

### 変更ファイル

- `src/lib/quest/builtinQuests.ts` — 4クエスト定義追加
- `src/lib/quest/builtinModelAnswers.ts` — 4模範解答追加
- `src/lib/quest/builtinQuests.test.ts` — クエスト数更新
