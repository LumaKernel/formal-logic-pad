## 実行中タスク

**出典:** `tasks/prd-inserted-tasks.md` 1行目

> CIの状態を確認し、失敗していれば修正する。`gh run list` や `gh run view` で現状を把握し、失敗原因を特定して対処すること。

### 調査結果

- CI は直近10回すべて failure
- 原因: Prettierフォーマットエラー (17ファイル) + ESLint warning (4件)
