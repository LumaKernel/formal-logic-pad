From: tasks/prd-inserted-tasks.md

## 実行中タスク

- [ ] 現在、論理式などはただのJSON構造体だが → SCシーケント・証明ノードのコンストラクタ関数をscript APIに追加

### 背景

テンプレートスクリプトではSC証明ノードを `{ _tag: "ScIdentity", conclusion: { antecedents: [...], succedents: [...] } }` のようにraw JSONで構築している。これは構造体の形を知らないと書けず使いづらい。コンストラクタ関数を提供して `scIdentity(sequent([phi], [phi]))` のように書けるようにする。

### テスト計画

- cutEliminationBridge.test.ts にSCノードコンストラクタ関数のテストを追加
  - sequent, scIdentity, scCut, scWeakeningLeft, scWeakeningRight, scImplicationLeft, scImplicationRight
  - 入力バリデーション（unknown前提）テスト

### ストーリー計画

- UI変更なし（APIのみ追加）

### 実装計画

1. cutEliminationBridge.ts に SC ノードコンストラクタブリッジ関数を追加
2. テスト追加
3. テンプレート1つを更新して新APIの利用例を示す
