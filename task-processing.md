## 実行中タスク

**出典**: `tasks/prd-advanced.md` B2

B2. **TAB の証明木構築UI** - シーケント右辺が常に空（Γ ⇒）という特徴を活かした専用UI。閉じた枝の視覚化

### このイテレーションのスコープ

B2は大きいため、段階的に実装。本イテレーションでは TAB を deductionSystem に統合するインフラ部分:

1. `deductionSystem.ts` に `"tableau-calculus"` スタイル追加、`TabRuleId` 定義
2. `inferenceEdge.ts` に TAB 用エッジ型追加
3. TAB 用ルールパレットの作成
4. `workspaceState.ts` への統合（TAB 用のワークスペース作成・基本操作）
5. `workspaceExport.ts` へのシリアライゼーション追加

### 周辺情報

- TAB の推論規則は `tableauCalculus.ts` に14種定義済み（B1完了）
- シーケント右辺が常に空（Γ ⇒）というのが最大の特徴
- 分岐規則が3つ（¬∧, ∨, →）: これらは証明木が2つに分岐する
- 固有変数条件がある規則が2つ（¬∀, ∃）
