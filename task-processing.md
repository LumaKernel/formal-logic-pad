## 実行中タスク（tasks/prd-inserted-tasks.md より）

- [ ] http://localhost:13006/?path=/story/proofpad-editableproofnode--interactive
      このあたりでホバーすると、白背景に白文字で見えなくなる。コントラストチェックというか、写真で判断したり、computed values基準で色の差がちゃんとしてるかとかもチェックしよう。

### 周辺情報

- EditableProofNode は `src/lib/proof-pad/EditableProofNode.tsx` に配置
- スタイル定義は `src/lib/proof-pad/proofNodeUI.ts` に分離
- テーマはCSS変数で管理、lightテーマで白背景・白文字のコントラスト問題の可能性
