## 実行中タスク

**出典:** `tasks/prd-inserted-tasks.md` > スクリプトエディタのテンプレートは、より強くしよう > スクリプトライブラリから開く、のような方法にして、検索したりしながら探せるように

### タスク内容

現在のテンプレートバー（横並びボタン）を「スクリプトライブラリ」パネルに置き換える。ユーザーがテンプレートを検索・ブラウズして選択できるようにする。

### テスト計画

- `scriptLibraryLogic.test.ts`: 検索・フィルタリングの純粋ロジックテスト
- `ScriptLibraryPanel.stories.tsx`: ストーリー + play関数でインタラクションテスト

### ストーリー計画

- `ScriptLibraryPanel.stories.tsx`: Default, WithSearch, FilteredByStyle, Empty

### 実装計画

1. `scriptLibraryLogic.ts` - テンプレート検索・フィルタリングの純粋ロジック
2. `ScriptLibraryPanel.tsx` - スクリプトライブラリパネルUI（検索、カテゴリフィルタ、テンプレート一覧）
3. `ScriptEditorComponent.tsx` - テンプレートバーを「Library」ボタン+パネルに置き換え
4. テスト・ストーリー追加
5. 品質チェック
