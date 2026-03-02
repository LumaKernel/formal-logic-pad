## 実行中タスク

**出典:** `tasks/prd-scripted-proof-rewriting.md` US-003

### US-003: Monaco Editorの統合

- [ ] `@monaco-editor/react` をインストール・統合
- [ ] `src/components/ScriptEditor/` にスクリプトエディタコンポーネントを作成
- [ ] JavaScriptの基本シンタックスハイライト
- [ ] ブリッジ済みAPI（US-002で定義）の補完候補を自動表示
- [ ] 各APIのJSDoc/型情報をホバーで表示（引数の型、戻り値の型、説明）
- [ ] エディタ下部に実行ボタン（▶ Run）とステップ実行ボタン（⏭ Step）を配置
- [ ] 型チェック/lintが通る
- [ ] Playwright MCPでスクリーンショットを撮影し `.screenshots/` に保存して確認

### テスト計画

- `src/components/ScriptEditor/scriptEditorLogic.test.ts` — 純粋ロジック（API定義変換、補完設定等）のテスト
- `src/components/ScriptEditor/ScriptEditorComponent.test.tsx` — コンポーネントのレンダリング・基本操作テスト
- Monaco Editorはヘビーなので、テストではモック化を検討

### ストーリー計画

- `src/components/ScriptEditor/ScriptEditor.stories.tsx` — play関数付きのストーリー
  - デフォルト表示
  - コード入力
  - 実行ボタンクリック
  - ステップ実行ボタンクリック
