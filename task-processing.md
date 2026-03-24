## タスク

**出典:** `tasks/inserted-tasks.md` line 9

> EN設定で日本語の箇所がいくらかある。pw mcpで確認していって。

## スコープ

QuestCatalogComponent.tsx（ビルトインクエスト一覧）の日本語テキストを修正。
CustomQuestListComponent.tsx は日本語が大量（編集フォームラベル、確認ダイアログ等）のため別タスクとして残す。

### 修正対象（questCatalogListLogic.ts + QuestCatalogComponent.tsx）

- "難易度:" → "Difficulty:"
- "全難易度" → "All Levels"
- "状態:" → "Status:"
- "すべて" → "All"
- "クリア済み" → "Cleared"
- "未クリア" → "Not Cleared"
- "目安: Nステップ" → "Est.: N steps"
- "ベスト: Nステップ" → "Best: N steps"
- "開始" → "Start"
- "再挑戦" → "Retry"
- "条件に合うクエストがありません。" → "No quests match the current filters."

### CustomQuestListComponent.tsx の最小限修正

- ratingLabel, stepCountText, startButtonLabel の呼び出し更新（locale引数追加）
- 編集フォームラベル等の完全なi18n化は別タスク
