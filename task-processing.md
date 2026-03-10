## タスク

**出典: `tasks/prd-2026-03-10.md`**

> ノート一覧でのノートのところに三点リーダーで、エクスポートみたいなメニューを作ろう。
> - ノートの新規作成の近くにも同様にリーダーメニューでインポートを用意しよう。
> - エクスポートされたデータにはバージョン情報を入れて、将来的な破壊変更に対応できる抽象化をしておこう

### 周辺情報

- 既存の三点リーダーメニュー（MoreMenu）は NotebookListComponent.tsx に実装済み（名前変更・複製・自由帳として複製・削除）
- エクスポート/インポートのパターンは CustomQuestState の `exportCustomQuestAsJson` / `importCustomQuestFromJson` に先例あり
  - `_format` + `_version` メタデータフィールドでバージョン管理
  - Blob + Object URL + anchor でダウンロード
  - discriminated union のResult型でエラーハンドリング
- 既存のシリアライゼーション: `notebookSerialization.ts` の `serializeCollection`/`deserializeCollection`（NotebookCollection 単位）

### テスト計画

1. **純粋ロジック（notebookExportLogic.ts 新規）:**
   - `exportNotebookAsJson(notebook)` のラウンドトリップテスト
   - `importNotebookFromJson(collection, jsonString, now)` のバリデーションテスト
     - 正常ケース、InvalidJson、InvalidFormat、InvalidVersion
   - バージョン情報が正しく含まれるか
   - テストファイル: `src/lib/notebook/notebookExportLogic.test.ts` (新規)

2. **UIテスト（既存テスト更新）:**
   - NotebookListComponent.test.tsx: エクスポートメニュー項目の表示・クリックテスト
   - NotebookListComponent.stories.tsx: エクスポートメニュー操作ストーリー

3. **ストーリー計画:**
   - NotebookListComponent.stories.tsx: 既存ストーリーに onExport コールバック追加
   - HubPageView.stories.tsx: 必要に応じてインポートUI確認

### 実装計画

1. `src/lib/notebook/notebookExportLogic.ts` (新規): 純粋なエクスポート/インポートロジック
2. `src/lib/notebook/NotebookListComponent.tsx`: MoreMenuに「エクスポート」メニュー追加
3. `src/lib/notebook/notebookListLogic.ts`: 必要に応じて型拡張
4. `src/app/` の接続コンポーネント: Blob + ダウンロード/ファイルインプットの副作用接続
