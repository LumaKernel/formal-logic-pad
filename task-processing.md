## 実行中タスク

**出典:** `tasks/prd-inserted-tasks.md`

- [ ] Depends Onはノード内には書かなくていいかな。詳細サイドパネルの中になど入れておきたいか。
  - [ ] いや、ノード内のやつも設定でオンオフできるようにしよう。

### 周辺情報

- 現在 `Depends on:` は `EditableProofNode.tsx` 内で表示（line 443-461）
- `DetailVisibility.showDependencies` で zoom レベルにより自動制御されている
- `levelOfDetail.ts` に DetailVisibility 型と判定ロジック
- ユーザーがオンオフできる設定（workspaceレベル or グローバル設定）を追加する必要がある
- 詳細サイドパネルは未実装のため、まず「ノード内表示のオンオフ設定」を実装する
