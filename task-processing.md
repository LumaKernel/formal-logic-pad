# 実行中タスク

**ソース:** `tasks/prd-inserted-tasks.md` 1行目

> クエストを自由帳に変換したら、ゴール一覧は消えるべきだろうし、そもそも適切にdiscriminated unionにして存在すらそもそもできないようにするべきだろう。
> 変換された自由帳は、かつてクエストであったことを完全に忘却すべきだ。

## 周辺情報

- 現在 `convertToFreeMode` はゴールを保持している（コメントに「ゴールは保持される」と明記）
- `Notebook` 型は `questId?: string` でオプショナル（discriminated unionではない）
- `WorkspaceState` は `mode: "free" | "quest"` + `goals: readonly WorkspaceGoal[]` で、free でも goals が存在可能

## 方針

### Phase 1: このイテレーション

1. `convertToFreeMode` でゴールを空にする
2. `Notebook` 型を discriminated union 化 (`_tag: "free" | "quest"`)
3. `convertNotebookToFreeMode` で `questId`/`questVersion` を完全に除去
4. 影響を受ける全テストを更新

### テスト計画

- `workspaceState.test.ts`: `convertToFreeMode` でゴールが消えることを確認するテスト追加/更新
- `notebookState.test.ts`: `convertNotebookToFreeMode` で `questId`/`questVersion` が消えることのテスト追加/更新
- `notebookSerialization.test.ts`: シリアライゼーションが discriminated union に対応していることを確認
- `notebookListLogic.test.ts`: リスト表示ロジックが新しい型に対応していることを確認
- 既存テストが壊れていないことを確認

### ストーリー計画

- 既存の `WorkspacePageView.stories.tsx` で自由帳の表示が正常であることを確認
- 必要に応じて `NotebookListComponent.stories.tsx` の更新

### 変更ファイル（予定）

- `src/lib/proof-pad/workspaceState.ts` - `convertToFreeMode` 修正
- `src/lib/notebook/notebookState.ts` - `Notebook` 型の discriminated union 化
- `src/lib/notebook/notebookSerialization.ts` - シリアライゼーション対応
- `src/lib/notebook/notebookListLogic.ts` - 新型対応
- 各テストファイル
