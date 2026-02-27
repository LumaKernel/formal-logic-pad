## 現在のタスク

**ソース:** `tasks/prd-inserted-tasks.md` 行15-17

> `[ ] コンテキストメニューで、MPの左右それぞれとして選択を開始することもできるようにする。(Apply MP、から始めるだけではなく)`
> `ただし、MPは片方は -> 形じゃないといけないので、そうでないときは選択できない状態でよい。開始すると適用可能対象が光る、というのは同様に。`
> `[ ] Apply Genについても同様`

### 周辺情報

- MPの選択フローは3フェーズ: idle → selecting-left → selecting-right → apply
- ノードコンテキストメニューは現在「Select Subtree」のみ
- MP互換ノードハイライト機能は実装済み（computeMPCompatibleNodeIds）
- Gen選択はidle → selecting-premise → apply のフロー
- 右前提は Implication 形式（φ→ψ）でなければならない
- Genは変数名が必要（先にinput fieldで入力が必要）
