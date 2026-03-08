## 実行中タスク

**出典**: tasks/prd-logic-pad-world.md — クエストモード拡充

**タスク**: equality-basics カテゴリを6問→10問に拡充（eq-07〜eq-10追加）

### 追加するクエスト

- eq-07: `∀x. x = x → (x = x → x = x)` — A1インスタンス+Gen入門。2 steps, difficulty 1
- eq-08: `a = b → a = b` — 恒等律の等号版。5 steps, difficulty 2
- eq-09: `(a = a → b = b) → (a = a → b = b)` — 恒等律の応用。5 steps, difficulty 2
- eq-10: `∀x.∀y. x = y → x = y` — 恒等律+Gen×2で全称化。7 steps, difficulty 3

### テスト計画

- `builtinQuests.test.ts`: クエスト数 215→219 に更新
- `builtinModelAnswers.test.ts`: 模範解答テスト（ゴール達成・ワークスペース構築・レイアウト）は自動追加

### ストーリー計画

- UI変更なし。HubPageView.stories.tsx は `builtinQuests.slice(0, 20)` なので更新不要

### 変更ファイル

- `src/lib/quest/builtinQuests.ts` — 4クエスト定義追加
- `src/lib/quest/builtinModelAnswers.ts` — 4模範解答追加
- `src/lib/quest/builtinQuests.test.ts` — クエスト数更新
