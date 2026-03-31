## 現在のタスク

**出典:** `tasks/inserted-tasks.md` 最初のバグ

**タスク:** バグ: 最初の phi-phi (恒等律 Identity) のクエストにて、phiを公理として、phi:=phi->phiで置換すれば成功してしまう。公理リストにない公理を使っていたらprovedになってはいけない。

### 根本原因

`checkQuestGoalsWithAxiomsEffect` (questCompletionLogic.ts) が `hasUnknownRootNodes` フラグを計算しているが、最終判定に使っていない。未知のルートノード（公理テンプレートに一致しないルート）があっても `AllAchieved` を返してしまう。

### テスト計画

- `questCompletionLogic.test.ts` にリグレッションテストを追加:
  - ルートノードが公理テンプレートに一致しない場合、`AllAchievedButAxiomViolation` を返すことを検証
  - 具体的には `phi` をルートに置いて置換で `phi -> phi` を導出するケース

### ストーリー計画

- UI変更なし（ロジック修正のみ）。既存のストーリーで `AllAchievedButAxiomViolation` 表示は実装済み

### 修正計画

- `questCompletionLogic.ts` の `checkQuestGoalsWithAxiomsEffect` で `hasUnknownRootNodes` を `hasAxiomViolation` 判定に含める
