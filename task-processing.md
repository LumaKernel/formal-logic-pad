## 実行中タスク

**ソース:** `tasks/play-function-enhancement.md` — PLAY-WS-14

> PLAY-WS-14: `QuestCompleteProp01ModelAnswer` — 完了バナー確認＋ノードクリック＋推論エッジバッジ確認

### コンテキスト

- `buildCompletedQuestWorkspace("prop-01")` で全ステップ適用済みの完了ワークスペースが構築される
- prop-01: φ→φ (Identity law) — Łukasiewicz体系、公理3つ + MP2回
- 既存play関数: workspace-page, system badge ("Łukasiewicz"), goal panel ("1/1", "Proved!") の確認のみ
- エッジバッジtestId: `workspace-edge-badge-${conn.id}` 形式

### テスト計画

- 既存テストファイル: `src/app/workspace/[id]/WorkspacePageView.stories.tsx`
- play関数に追加するインタラクション:
  1. 完了バナー確認（既存）
  2. ノードクリック → 選択状態確認
  3. 推論エッジバッジ（MP）の存在確認

### ストーリー計画

- 既存ストーリー `QuestCompleteProp01ModelAnswer` のplay関数を強化（新規ストーリー不要）
