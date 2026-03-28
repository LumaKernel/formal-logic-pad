## 実行中タスク

**出典:** `tasks/play-function-enhancement.md` PLAY-WS-24

- [ ] PLAY-WS-24: `WithQuestVersionWarning` — 警告バナーのUIインタラクション（閉じるボタン等）テスト追加

### コンテキスト

現在のquestVersionWarningバナーは静的な表示のみで、閉じるボタンがない。
play関数もexpectのみでインタラクションがない。

### テスト計画

- `WorkspacePageView.stories.tsx` の `WithQuestVersionWarning` ストーリーのplay関数を強化
  - 警告バナー存在確認
  - 閉じるボタンクリック→バナー非表示確認

### ストーリー計画

- 既存の `WithQuestVersionWarning` ストーリーを更新（新規ストーリー不要）

### 実装計画

1. WorkspacePageView.tsx に警告バナーの dismissible 機能を追加（ローカルstate）
2. 閉じるボタンUI追加
3. play関数にインタラクション追加
