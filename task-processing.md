## 実行中タスク

**出典:** `tasks/prd-note-node.md`

> 各種、模範解答に、純粋な証明構造の中にノート、解説を書くことができるようにして、証明のサイドに証明の解説を配置できるように

### 周辺情報

- メモノードの基本機能は既に実装済み（commit 6c668cc）
- `ModelAnswerStep` union にノート用の variant がまだない
- `buildModelAnswerWorkspace` にノートステップのハンドラがない
- ノートノードは `kind: "note"`, `formulaText` にマークダウンテキストを格納
- ノートノードは証明DAGの一部ではない（InferenceEdge不要、ゴールチェック対象外）

### テスト計画

- `modelAnswer.test.ts` に `note` ステップの直接テスト追加
  - ノートステップでノートノードが正しく作成される
  - ノートノードが証明の検証に影響しない
  - ノート付き模範解答がゴールを達成する
- `builtinModelAnswers.test.ts` は模範解答にノートを追加した場合の既存テストが通ることを確認

### ストーリー計画

- ModelAnswerDemo にノート付きの模範解答表示の確認（既存ストーリーで表示確認可能であれば新規不要）
