## 実行中タスク

**出典:** `tasks/prd-inserted-tasks.md` - Step 4: UI層の移行

- [ ] EditableProofNode.tsx: 推論規則ノードの描画を廃止
- [ ] ProofWorkspace.tsx: InferenceEdge の描画（接続線上にラベル表示）
- [ ] エッジ上のパラメータ入力UI（Gen変数名、代入エントリ）
- [ ] テスト: コンポーネントテスト + Storybookストーリー更新

### 周辺情報

- Step 3完了: ProofNodeKindから"mp"/"gen"/"substitution"は削除済み
- InferenceEdge型はinferenceEdge.tsに定義済み
- ハイブリッド方式: InferenceEdge(新source of truth) + レガシー接続(後方互換)の両方を生成中
- 現在のProofNodeKind: "blank" | "axiom" | "derived"
