# 現在のタスク

## ソース

`tasks/prd-inserted-tasks.md` の最初のタスク:

> 証明を保存する、マイなんたらみたいな、自分だけの証明コレクションを作れるようにしよう。

## 今回のスコープ（サブタスク1: データモデル・純粋ロジック・ストレージ層）

証明コレクション機能の基盤となるデータモデルと純粋ロジックを構築する:
- 証明コレクションの型定義（ProofEntry, ProofCollection）
- CRUD操作の純粋関数
- フォルダ管理の純粋ロジック
- シリアライゼーション/デシリアライゼーション
- StorageServiceを使った永続化

UI統合・メニュー統合は後続タスクで行う。

## テスト計画

- `src/lib/proof-collection/proofCollectionState.test.ts` — CRUD操作のテスト
  - 証明エントリの追加・削除・更新
  - フォルダの作成・リネーム・削除
  - フォルダ間の移動
  - 名前・メモの編集
- `src/lib/proof-collection/proofCollectionSerialization.test.ts` — シリアライゼーションのテスト
  - ラウンドトリップ（serialize → deserialize → 元データと一致）
  - 不正JSON → graceful degradation
- `src/lib/proof-collection/proofCollectionCompatibility.test.ts` — 互換性チェックのテスト
  - 同一体系での利用可能性チェック
  - 互換体系での利用可能性チェック
  - 非互換体系での警告付き利用可能性

## ストーリー計画

今回はUIなし。後続タスクでUI統合時にストーリーを追加する。
