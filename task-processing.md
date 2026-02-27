## 申し送り事項

**出典**: `tasks/prd-inserted-tasks.md` line 20-22 (タスクは継続中 `[-]`)

### 完了した部分

- `axiomNameLogic.ts` に `isTrivialSubstitution` 判定の純粋ロジックを実装・テスト済み
- A4/A5は `alwaysNonTrivialAxiomIds` で常に非自明
- 100%カバレッジ達成

### 残作業（次イテレーション）

1. **UI層での警告表示**: `ProofWorkspace.tsx` で `isTrivialSubstitution: false` の公理ノードに警告メッセージを表示
   - `proofMessages.ts` に新メッセージ追加
   - 公理ノードの見た目を変える（エラー状態 or 警告状態）
2. **PeanoArithmeticDemoストーリーの修正**: 代入操作ステップを挟んだ正しい証明フローに更新
   - PA3 axiom(スキーマ) → Substitution(τ:=0) → `0 + 0 = 0` ※ただしPA3のterm meta substitutionの扱いを確認
   - A4 instance は `matchAxiomA4` が空マップを返すため、term variable substitution (x:=0) が必要だが、現在の代入操作はformula/term **meta** substitutionのみ対応
3. **A4/A5のスキーマノード**: オブジェクト言語で表現できないため、特別なUI（パラメトリック公理呼び出し）が必要になる可能性
