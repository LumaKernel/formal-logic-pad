## 現在のタスク

**出典:** tasks/prd-inserted-tasks.md
**タスク:** Apply系、モーダルじゃなくて、エッジ上のパラメータ入力という形にしてもいいかなと思う。

### このイテレーションのスコープ

Step 7: InferenceEdgeBadge をインタラクティブ化 — Gen バッジクリックでポップオーバー編集

- InferenceEdgeBadge コンポーネントにクリックハンドラを追加
- Gen バッジをクリックするとポップオーバーが表示され、変数名を編集できる
- 変数名変更時にworkspaceStateのInferenceEdgeを更新し、結論を再計算
- 純粋ロジック（edgeBadgeEditLogic.ts）とUI（InferenceEdgeBadge.tsx拡張）の分離
- テスト: ポップオーバーの表示・編集・確定・キャンセル
