## 実行中のタスク

**ソース:** `tasks/prd-logic-pad-world.md`

> カット除去定理を遂行すること。実装をサポートしてもらいながら実際にカット除去定理まで学べたらいい

### 具体的な実装内容

SC体系のカット除去を体験できるクエストカテゴリー `sc-cut-elimination` とクエストを追加する。

- 新カテゴリー `sc-cut-elimination`（カット除去の体験）を `questDefinition.ts` に追加
- カット規則を使う証明のクエストを `builtinQuests.ts` に追加（3-5問程度）
  - 簡単なカット使用例（identity + cut で別の式を導く）
  - 中程度（cut を組み合わせて定理を証明する）
  - カット除去ステッパーとの連携を促す内容

### テスト計画

- `builtinQuests.test.ts` のクエスト数更新
- `questDefinition.test.ts` に新カテゴリーのテスト追加（もし既存テストが壊れれば）
- `referenceContent.test.ts` のエントリ数更新（リファレンスを追加する場合）

### ストーリー計画

- UI変更はなし（クエストカタログに新カテゴリーが自動的に表示される）
- ブラウザ確認で新カテゴリーの表示を確認
