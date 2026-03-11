## タスク

出典: `tasks/prd-syntax-highlight.md`

論理式編集をさらに進化させる。論理式のドキュメントへのアクセスの横などに、右上に向かう矢印拡大みたいなボタンを置いて、それで広い画面での編集に入れるようにする。

### 周辺情報

- 全画面ではなく広めのモーダル
- textareaベースで複数行編集可能
- シンタックスハイライトは維持
- 編集の完了は unfocus ではなく、明示的な閉じるボタンやモーダル外クリック
- リアルタイムなエラー詳細やRenderedのプレビューも表示
- 複数行にまたがる論理式の場合は最初からモーダルに突入
- 閉じるときは一行編集に戻らない（FormulaEditorの値に反映して閉じる）

### テスト計画

- `src/lib/formula-input/FormulaExpandedEditor.test.tsx` に新規テスト作成
  - 基本表示テスト: モーダルが開くとtextareaとプレビューが表示される
  - テキスト編集: 入力するとリアルタイムでプレビューが更新される
  - エラー表示: パースエラーがある場合にエラーメッセージが表示される
  - 閉じる操作: 閉じるボタンで閉じてonChangeが発火する
  - モーダル外クリックで閉じる
  - Escapeキーで閉じる
  - シンタックスハイライトが適用される
- `src/lib/formula-input/FormulaEditor.test.tsx` に既存テスト追加
  - 拡大ボタンクリックでonOpenExpandedがコールされる
  - onOpenExpandedが未指定のとき拡大ボタンが表示されない

### ストーリー計画

- `src/lib/formula-input/FormulaExpandedEditor.stories.tsx` に新規ストーリー
  - Default: 基本的な拡大エディタ表示
  - WithError: パースエラー表示
  - Interactive: play関数付きで入力→プレビュー更新→閉じるフロー
- FormulaEditor.stories.tsx に既存ストーリーへ拡大ボタン追加は不要（propsで制御するだけ）
