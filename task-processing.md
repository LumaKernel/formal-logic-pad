## 実行中タスク

**ソース:** `tasks/prd-formal-logic-pad.md` — US-020: 公理の追加

> **説明:** ユーザーとして、公理をノートに追加したい。
>
> **受け入れ基準:**
>
> - [ ] サイドパネルまたはメニューから公理を選択
> - [ ] 公理インスタンスをキャンバスにドロップ
> - [ ] 公理はノードとして表示される（式と「公理」ラベル）
> - [ ] 型チェック/lintが通る
> - [ ] Playwright MCPでスクリーンショットを撮影し `.screenshots/` に保存して確認

### 周辺情報

- ProofWorkspace (US-019) は完了済み。`src/lib/proof-pad/` にUI、`src/lib/logic-core/inferenceRule.ts` に公理定義がある
- 公理体系: K, S, 否定公理 (DN1等)、量化子公理 (A4, A5)、等号公理 (オプション)
- EditableProofNode: FormulaEditorを内包した編集可能証明ノード
