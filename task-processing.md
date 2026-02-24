## 実行中タスク

**ソース:** `tasks/prd-inserted-tasks.md` (1行目, 2行目)

1. CIが通っていないので、確認してまず通す。
2. Storybook ストーリーが真っ白な問題を調査・修正する。

### 進捗

- CI失敗原因: Prettierフォーマットエラー (CLAUDE.md, task-processing.md, tasks/prd-logic-pad-world.md, tasks/prd-next-tasks.md, tasks/prd-inserted-tasks.md)
- 修正: `npx prettier --write` で全ファイルのフォーマットを修正
- lint / test 全パス確認済み
