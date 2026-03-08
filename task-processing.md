## 実行中タスク

**出典:** `tasks/prd-logic-pad-world.md` — クエストモード拡充

**タスク:** predicate-basics カテゴリのクエスト4問追加（pred-07〜pred-10）

### 周辺情報

- 現在 predicate-basics は6問（pred-01〜pred-06）
- 述語論理の基礎的な論理式を追加
- 既存パターン: Hilbert体系での述語論理証明

### テスト計画

- `builtinQuests.test.ts` のクエスト数を 211→215 に更新
- `builtinModelAnswers.test.ts` の模範解答テストが自動で追加分を検証

### ストーリー計画

- UI変更なし（クエスト追加のみ）
- HubPageView.stories.tsx は `builtinQuests.slice(0, 20)` なのでクエスト数増加の影響なし
