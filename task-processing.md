## 実行中タスク

**出典:** `tasks/prd-scripted-proof-rewriting.md` US-004

**タスク:** 実行コントロール: 再生（▶）、ステップ（⏭）、一時停止（⏸）、リセット（⏹）と実行速度スライダー（自動再生時の速度調整）

### テスト計画

- `src/components/ScriptEditor/scriptEditorLogic.test.ts` に以下を追加:
  - `startAutoPlay` / `pauseAutoPlay` 状態遷移テスト
  - `autoPlaySpeed` の更新テスト
  - "paused" 状態の `executionStatusLabel` テスト
- `src/components/ScriptEditor/ScriptEditorComponent.stories.tsx` にストーリー追加:
  - AutoPlayControls: Play/Pause/速度スライダーの表示確認

### ストーリー計画

- ScriptEditorComponent.stories.tsx に AutoPlayControls ストーリーを追加
- play 関数でボタン存在確認とスライダー操作テスト
