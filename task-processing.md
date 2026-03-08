## 実行タスク

**ソース:** `tasks/prd-logic-pad-world.md` — クエストモード拡充（predicate-advanced カテゴリ）

**タスク:** predicate-advanced カテゴリにクエスト2問追加（Q-35, Q-36）

- pred-adv-03: 全称量化子の否定 `~(all x. P(x)) -> ex x. ~P(x)` (difficulty 4, ~30 steps)
- pred-adv-04: 存在の含意分配 `all x. (P(x) -> Q(x)) -> (ex x. P(x) -> ex x. Q(x))` (difficulty 5, 40+ steps)

### テスト計画

- `builtinQuests.test.ts`: クエスト数カウント更新 (147 → 149)
- `builtinModelAnswers.test.ts`: predicate-advanced ブロックで自動テスト（既存の it.each で追加分もカバー）
- `questDefinition.test.ts`: カテゴリ数は変更なし (16)

### ストーリー計画

- UI変更なし。QuestCatalogComponent の既存ストーリーでブラウザ確認のみ

### 変更ファイル

- `src/lib/quest/builtinQuests.ts` — 2クエスト定義追加
- `src/lib/quest/builtinModelAnswers.ts` — 2模範解答追加
- `src/lib/quest/builtinQuests.test.ts` — カウント更新
