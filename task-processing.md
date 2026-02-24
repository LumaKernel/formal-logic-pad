## 実行中タスク

**ソース:** `tasks/prd-formula-input-component.md` FI-005

### FI-005: 項テキスト入力

**説明:** ユーザーとして、項（Term）のみをテキスト入力したい。代入パラメータの入力などに使う。

**受け入れ基準:**

- [ ] `<TermInput value={text} onChange={handler} />` コンポーネントを作成
- [ ] Logic Langのterm用パーサーを使用
- [ ] パース成功/エラー表示はFormulaInputと同様
- [ ] `onParsed` コールバックでTermASTを通知
- [ ] Storybookストーリーを追加
- [ ] 型チェック/lintが通る

### 前提作業

- parser.ts に `parseTermString` を追加する必要がある（現在は内部関数のみ）
