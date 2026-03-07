# 実行中タスク

## ソース

`tasks/prd-inserted-tasks.md` より:

> また、可能な範囲はメニューのあり方はコード上でもそれ単体で独立しており、スクリプトの実行などで上記のmdが（一部？）自動生成される（宣言的になる）かたちにしよう

## 概要

ProofWorkspace のメニュー項目（ノードメニュー、キャンバスメニュー、接続メニュー、ワークスペースメニュー）を宣言的データ定義に分離し、`dev/menu-ux-design.md` の「現状のアクション一覧」セクションをそのデータから自動生成できる仕組みを作る。

## テスト計画

- `src/lib/proof-pad/menuActionDefinition.test.ts` を新規作成
  - 宣言的メニュー定義が正しくフィルタリングされるかテスト
  - 各コンテキスト（node-menu, canvas-menu, line-menu, workspace-menu）へのフィルタテスト
  - ラベル取得テスト（en/ja）
  - スクリプトによるmd生成のスナップショットテスト

## ストーリー計画

- UI変更なし（純粋ロジック層の抽出のみ）。既存のストーリーで動作検証。

## 実装計画

### Step 1: `menuActionDefinition.ts` 純粋ロジック作成

- メニューアクションの型定義: `MenuActionDefinition`
  - `id`, `label: { en, ja }`, `contexts[]`, `shortcut?`, `group?`
- 全アクションの宣言的定義配列
- フィルタ関数（コンテキスト別）
- Markdown生成関数（dev/menu-ux-design.md の「現状のアクション一覧」セクションを自動生成）

### Step 2: テスト作成

- 宣言的定義のテスト
- md生成のスナップショットテスト

### Step 3: md自動生成スクリプト

- `scripts/generate-menu-docs.local.ts` を作成（shebang付き）
- `dev/menu-ux-design.md` の該当セクションを生成結果で更新

### Step 4: ProofWorkspace での参照

- 既存のハードコードメニューを宣言的定義から参照するように段階的に移行（可能な範囲で）
