## 実行中タスク

**ソース:** `tasks/play-function-enhancement.md` PLAY-WS-21

> PLAY-WS-21: `QuestCompleteAt01FullFlow` — AT推論規則適用→証明完成→ゴール達成のフルフロー

### コンテキスト

- PLAY-WS-19 (SC), PLAY-WS-20 (TAB) は完了済み
- PLAY-WS-22 (FromHub AT) は本タスク完了後に拡張予定
- at-01 クエスト: 排中律 φ ∨ ¬φ をATで証明
  - ルート: F:phi \/ ~phi
  - α規則 (F∨/alpha-neg-disj): F:phi, F:~phi
  - α規則 (F¬/alpha-neg-f): F:~phi → T:phi
  - closure: T:phi と F:phi で枝閉じ

### AT規則適用UIフロー (確認済み)

- α/β規則: パレットクリック → バナー表示 → ノードクリック → 規則適用（モーダルなし）
- closure: パレットクリック → バナー表示 → 主ノードクリック → 矛盾ノードクリック → closure適用

### テスト計画

- `WorkspacePageView.stories.tsx` の `QuestCompleteAt01FullFlow` を拡張
- 既存のスタンドアロン確認（Step 1-2）を維持し、Step 3以降にAT規則適用→ゴール達成フローを追加
- ストーリー内完結（新規テストファイル不要）

### ストーリー計画

- `QuestCompleteAt01FullFlow` のplay関数を拡張
- `QuestCompleteAt01FromHub` も同様に拡張（PLAY-WS-22として次回以降）
