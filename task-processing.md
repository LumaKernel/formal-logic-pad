## 実行中タスク

**ソース:** `tasks/play-function-enhancement.md` — PLAY-WS-15

> PLAY-WS-15: `QuestCompleteProp42ModelAnswer` — 完了バナー確認＋ノード数確認

### コンテキスト

- prop-42: A2の前方適用 — Łukasiewicz体系、公理2つ(A2×2) + Subst1つ + MP1つ = 4ノード
- 100%ズームで全ノードが表示される（fitToContent不要）
- node-1,node-2=公理(A2), node-3=Subst(3)DERIVED, node-4=MP DERIVED(ゴール)
- エッジバッジ3つ: Subst(node-2→node-3), MP:φ(node-1→node-4), MP:→(node-3→node-4)

### テスト計画

- 既存テストファイル: `src/app/workspace/[id]/WorkspacePageView.stories.tsx`
- play関数に追加するインタラクション:
  1. 完了バナー確認（追加）
  2. 全4ノード存在＋公理名＋role-badge確認（100%ズームなので詳細確認可能）
  3. エッジバッジ3つ確認
  4. ノードクリック→選択バナー確認
