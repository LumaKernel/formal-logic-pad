## 実行中タスク

from: `tasks/prd-inserted-tasks.md`

> - [ ] ノート一覧の三点リーダーの開かれるメニューが、次のノートのカラムの後ろに隠れてしまう。
>   - [ ] クエスト一覧なども同様。一番下のやつは見切れる

### 問題の原因

1. **NotebookListComponent**: ドロップダウン(`zIndex: 10`)が、後続のカード(`position: relative`)の背後に隠れる。
2. **QuestCatalogComponent**: `questListStyle`に`overflow: "hidden"`が設定されており、ドロップダウンがクリップされる。加えて`zIndex: 10`が低い。

### テスト計画

- 既存テストが正常に通ることを確認（レイアウト変更のみ）
- Storybook での目視確認・スクリーンショット撮影

### ストーリー計画

- 既存ストーリーでドロップダウン表示確認（NotebookListComponent.stories, QuestCatalogComponent.stories）
- 必要に応じてplay関数でメニュー開閉操作を確認

### 修正方針

1. NotebookListComponent: `dropdownMenuStyle`の`zIndex`を`1000`に引き上げ
2. QuestCatalogComponent: `questListStyle`から`overflow: "hidden"`を削除し、最初・最後の要素で角丸を実現する方法に変更。`moreMenuStyle`の`zIndex`も`1000`に引き上げ
