## 実行中タスク

**出典:** `tasks/prd-inserted-tasks.md`

> - [ ] 論理式ノードについて。編集のためにダブルクリックしたときにノード選択にならないでほしい
>   - [ ] 単なるクリックでも、どのノードも選択に入らないで

### 周辺情報

- ProofWorkspace.tsx:4013-4021 の wrapper div onClick で `handleNodeSelect` が呼ばれている
- ダブルクリック時: 1回目のclickイベントで `handleNodeSelect` → 選択される → 2回目のdblclickで編集モードに入る
- 通常クリック: `handleNodeSelect` → 単一選択される
- MP/Gen選択モード（`isSelectionActive`）の挙動は維持する必要がある

### テスト計画

- `ProofWorkspace.test.tsx` の既存テストで「クリックで選択」を前提としたテストを更新
- ノードクリックで選択されないことを検証するテストを追加
- MP/Gen選択モードでのクリックは引き続き動作することを検証

### ストーリー計画

- UI変更なし（動作変更のみ）。既存ストーリーのplay関数で選択関連のものがあれば確認
