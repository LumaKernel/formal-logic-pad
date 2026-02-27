## 現在のタスク

**出典**: `tasks/prd-inserted-tasks.md` 7行目

> (AST内にある)置換を解決するというのを補助する機能はあってよいだろうね。Resolve substition的に(ここで差すsubstitionはメタ変数の置換ではなく、そのスキーム言語内部の置換として)

### 周辺情報

- `FormulaSubstitution` ASTノードは前回のイテレーションで追加済み（`φ[τ/x]`）
- これはAST内に「項変数の置換」を表現するノード
- 今回は、この `FormulaSubstitution` を「解決」する純粋関数を実装する
- resolve: `φ[τ/x]` → φの中のxをτで置換した結果のFormulaを返す
- UIでの利用は後続タスクとする（まず純粋ロジック + テスト）
