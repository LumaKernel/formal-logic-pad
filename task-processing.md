## 実行中タスク

**出典:** `tasks/prd-inserted-tasks.md` > スクリプトエディタのテンプレート > 体系の情報を取れるAPI

### タスク内容

体系の情報を取れるAPIをスクリプトブリッジに追加する。

### 周辺情報

- ヒルベルトスタイルのphi->phiの証明スクリプト等の前提条件
- スクリプトユーザーが現在の体系のスタイル、名前、有効な規則を取得できるようにする
- 非対応体系でのスクリプト実行時にガードするためにも必要

### テスト計画

- `workspaceBridge.test.ts` に `getDeductionSystemInfo` のテストを追加
  - 各体系スタイル（hilbert, nd, sc, tab, at）で正しい情報が返ることを確認
  - isHilbertStyle フラグの確認
- 型定義生成 `generateWorkspaceBridgeTypeDefs` のテスト更新

### ストーリー計画

- APIリファレンスパネルに新APIが表示されることを既存ストーリーで確認（API_CATEGORIES経由で自動反映）
