## 実行中タスク

**出典:** `tasks/prd-inserted-tasks.md`

> add axiom nodeとadd nodeも分けなくていい。統一する。

### 計画

- コンテキストメニューの「Add Axiom Node」と「Add Node」を1つの「Add Node」に統一
- 新規ノードは `role=undefined` (ROOT表示) で作成。公理パレットからの追加だけが `role="axiom"` を付ける
- 関連するi18nメッセージ、テスト、コマンドパレットを更新
