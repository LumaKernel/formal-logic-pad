# タスク: ノートノード専用コンテキストメニューの設計・実装

**出典:** `tasks/prd-inserted-tasks.md` 1行目
> ノートノードのコンテキストメニューは、ノートノード専用のものを設計しましょう

## 現状の問題

ノートノード右クリック時に、証明ノードと同じコンテキストメニューが表示される。
推論規則（MP, Gen, Substitution）やサブツリー選択、証明選択など、ノートノードに無関係なアクションが並んでいる。

## 実装方針

ノートノードの場合のコンテキストメニューを分岐させる:

### ノートノード専用メニュー項目

1. **ノートを編集** - `handleEditNote` を呼ぶ（既存のダブルクリックと同等）
2. **ノードを複製** - 既存の `handleDuplicateNode`
3. **ノードを削除** - 既存の `handleDeleteNode`

### 非表示にする項目（ノートノードには不要）

- Select Subtree / Select Proof（ノートは証明ツリーに参加しない）
- Save to Collection（証明コレクション用）
- Edit Formula（論理式ではなくノートテキスト）
- Use as MP Left / Right（推論規則）
- Apply Gen（推論規則）
- Apply Substitution（推論規則）
- Merge with Node（ノートはマージ対象外）

### 変更ファイル

1. `src/lib/proof-pad/ProofWorkspace.tsx` - コンテキストメニューの条件分岐
2. `src/lib/proof-pad/menuActionDefinition.ts` - `note-context-menu` コンテキストを追加（またはメタデータでフィルタ）

## テスト計画

- `src/lib/proof-pad/ProofWorkspace.test.tsx` - ノートノード右クリック時のメニュー表示テスト
  - ノートノードのコンテキストメニューに「ノートを編集」が表示される
  - ノートノードのコンテキストメニューにMP/Gen/Substitution等が表示されない
  - 「ノートを編集」クリックでノート編集モーダルが開く
  - 「ノードを複製」「ノードを削除」は表示される
- `src/lib/proof-pad/menuActionDefinition.test.ts` - 新しいアクション定義のテスト

## ストーリー計画

- `src/lib/proof-pad/ProofWorkspace.stories.tsx` に既存のストーリーでノートノードのコンテキストメニューをテスト（必要なら追加）
