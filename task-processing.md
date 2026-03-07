# 現在のタスク

## タスク（tasks/prd-inserted-tasks.md より）

証明コレクション機能の続き: useProofCollection フック（localStorage永続化）の実装

前回のイテレーションでデータモデル・純粋ロジック・シリアライゼーション基盤が完了。
次のステップとしてReact hook層を構築し、localStorage永続化を統合する。

## テスト計画

- `src/lib/proof-collection/useProofCollection.test.tsx` を新規作成
- テスト対象:
  - localStorage adapter関数（loadProofCollection, saveProofCollection）
    - 保存データなし → 空コレクション返却
    - ラウンドトリップ（save → load）
    - 不正データ → 空コレクション返却
  - useProofCollection hook
    - 初期状態は空コレクション
    - localStorageからの復元
    - addEntry: エントリ追加
    - removeEntry: エントリ削除
    - renameEntry: エントリ名変更
    - updateMemo: メモ更新
    - moveEntry: フォルダ移動
    - createFolder: フォルダ作成
    - removeFolder: フォルダ削除
    - renameFolder: フォルダ名変更
    - entries/folders の派生データ（ソート済み）
    - getNow DI が機能すること

## ストーリー計画

- 純粋ロジック + hookのみのため、UIストーリーは不要（UIコンポーネント統合は後続タスク）

## 参考パターン

- `src/lib/notebook/useNotebookCollection.ts` のパターンをそのまま踏襲
  - localStorage adapter (loadCollection / saveCollection) を export
  - useState + useEffect で永続化
  - useCallback で各操作をラップ
  - useMemo でソート済みリストを提供
  - getNow DI でテスト用時刻制御
