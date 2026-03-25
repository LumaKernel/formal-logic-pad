## 実行中タスク

**元ファイル:** `tasks/inserted-tasks.md` (1行目)

**タスク:** 公理一覧ウィンドウも畳む、動かすことがそれぞれできるようにしよう。

**状況:** ドラッグ移動は既に実装済み（usePanelDrag, panelPositionLogic）。畳む（collapse）機能が未実装。GoalPanelには既にcollapse機能がある。

### テスト計画
- `AxiomPalette.test.tsx` に畳む/展開のテストを追加:
  - 畳むボタンクリックでパネルが畳まれる
  - 畳まれた状態でクリックすると展開される
  - ドラッグ中はトグルしない（wasDraggedRef連携）
  - 畳まれた状態でもtestIdが適切に付与される
  - キーボード操作（Enter/Space）でトグル

### ストーリー計画
- `AxiomPalette.stories.tsx` に畳まれた状態のストーリーを追加（play関数付き）

### 実装方針
- GoalPanelのcollapse実装パターンを踏襲
- AxiomPaletteに`collapsed`状態を追加
- `wasDraggedRef` propsを追加（GoalPanelと同パターン）
- 畳まれた状態: ヘッダーのみのコンパクトなトグルボタンで表示
- ProofWorkspace.tsxでwasDraggedRefを渡す
