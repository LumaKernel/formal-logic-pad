# タスク実行中

## タスク

`tasks/prd-docs-improve.md` より:

> ?で開いたドキュメントは同様に、ウィンドウ化できるようにして、参照しながら証明作業できるようにしよう

## 概要

現在、リファレンスポップオーバー（?ボタン）から「詳しく見る→」を押すと `ReferenceModal` が全画面オーバーレイで開き、証明作業がブロックされる。
これを**フローティングウィンドウ**に変更し、証明作業と並行してリファレンスを参照できるようにする。

## 設計方針

### アプローチ: ReferenceModal をフローティングウィンドウモードに変換

- 新コンポーネント `ReferenceFloatingWindow` を作成
- WorkspaceContent.tsx で `ReferenceModal` の代わりに `ReferenceFloatingWindow` を使用
- ドラッグ移動＋リサイズ可能なウィンドウ
- 純粋ロジック部分 `floatingWindowLogic.ts` に分離（ドラッグ計算、リサイズ計算、ウィンドウ位置制約）
- ポップオーバー(?)→「詳しく見る」→フローティングウィンドウが開く（現在のモーダルと同じフロー）
- ウィンドウは証明作業を妨げない（オーバーレイなし、z-indexで前面表示）
- ウィンドウ内容はReferenceModalと同じ（モーダルの本体部分を共有）

### ウィンドウ機能

- タイトルバー: ドラッグで移動、タイトル表示、閉じるボタン、新規タブで開くボタン
- リサイズ: 右下角ハンドル
- 初期位置: 画面右側中央付近
- 最小サイズ: 300x200
- Escapeキーで閉じない（証明作業中にEscapeは別の用途で使う可能性がある）
- 閉じるボタンでのみ閉じる

### 変更点

1. `src/lib/reference/floatingWindowLogic.ts` - 新規: ドラッグ/リサイズの純粋ロジック
2. `src/lib/reference/ReferenceFloatingWindow.tsx` - 新規: フローティングウィンドウUI
3. `src/app/workspace/[id]/WorkspaceContent.tsx` - 変更: ReferenceModal → ReferenceFloatingWindow
4. HubPageView（ハブページ）のReferenceModal はそのまま維持（ハブではフルモーダルで問題ない）

## テスト計画

- `src/lib/reference/floatingWindowLogic.test.ts` - 純粋ロジックのテスト
  - ドラッグ位置計算（開始、移動、終了）
  - リサイズ計算（最小サイズ制約）
  - 初期位置計算
  - ビューポート制約（画面外にはみ出さない）
- `src/lib/reference/ReferenceFloatingWindow.test.tsx` - UIコンポーネントテスト
  - 表示内容確認（タイトル、本文等）
  - 閉じるボタン動作
  - 新規タブリンク
  - 関連エントリナビゲーション
  - ドラッグ移動の基本動作

## ストーリー計画

- `src/lib/reference/ReferenceFloatingWindow.stories.tsx`
  - Default: 基本表示
  - Japanese: 日本語表示
  - WithRelatedEntries: 関連エントリ付き
  - Dragged: ドラッグ後の状態（play関数でドラッグシミュレーション）
