## 現在のタスク

**ソース:** `tasks/prd-theories.md` 17行目

> リファレンス、内部ドキュメント管理のための仕組みを用意しよう — リファレンスデータモデル: 多言語対応の構造化リファレンスシステムの型定義と純粋ロジック

### サブタスク

- `src/lib/reference/` にリファレンスライブラリを作成
- `ReferenceEntry` 型定義: id, 多言語テキスト(en/ja)、パラグラフ単位のマークダウン、カテゴリ、関連リンク
- `ReferenceCategory`: axiom, inference-rule, logic-system, notation, concept 等
- 検索・フィルタリングの純粋ロジック
- テスト

### ベースラインカバレッジ

- Stmts: 99.33%, Branch: 94.93%, Funcs: 89.98%, Lines: 99.92%
