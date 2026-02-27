## 申し送り事項

**出典**: `tasks/prd-inserted-tasks.md` line 20-26 (タスクは継続中 `[-]`)

### 完了した部分

- `axiomNameLogic.ts` に `isTrivialSubstitution` 判定の純粋ロジックを実装・テスト済み
- A4/A5は `alwaysNonTrivialAxiomIds` で常に非自明
- UI層で非自明公理ノードに "Needs substitution step" 警告を表示（`EditableProofNode` に `"warning"` statusType追加）
- 100%カバレッジ維持

### 残作業（次イテレーション）

1. **PeanoArithmeticDemoストーリーの修正**: 代入操作ステップを挟んだ正しい証明フローに更新
   - PA3 axiom(スキーマ) → Substitution(τ:=0) → `0 + 0 = 0` ※ただしPA3のterm meta substitutionの扱いを確認
   - A4 instance は `matchAxiomA4` が空マップを返すため、term variable substitution (x:=0) が必要だが、現在の代入操作はformula/term **meta** substitutionのみ対応
2. **A4/A5のスキーマノード**: オブジェクト言語で表現できないため、特別なUI（パラメトリック公理呼び出し）が必要になる可能性
