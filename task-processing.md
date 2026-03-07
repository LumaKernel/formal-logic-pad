## タスク: カバレッジ改善 (parser.ts parseTokensAsTerm, EdgeScrollIndicator, ConnectorPortComponent)

出典: カバレッジレポート分析（特定のPRDなし、カバレッジ改善イテレーション）

### 改善対象

1. **parser.ts (Stmts 97.82%)** - `parseTokensAsTerm` 関数のテストが不足
   - 未カバー行: 718-722 (peek/advance定義), その他エラーパス
   - parseTermString 経由でも良い
2. **EdgeScrollIndicator.tsx (Stmts 88.88%)** - visible=true のレンダリング分岐
3. **ConnectorPortComponent.tsx (Stmts 96.66%)** - line 31, 109

### テスト計画

- **parser.test.ts**: `parseTokensAsTerm` / `parseTermString` のテスト追加
  - 正常ケース: 変数、定数、関数適用 `S(x)`, `f(x, y)`
  - エラーケース: 閉じ括弧不足 `f(x`, 不正トークン
  - 空入力、EOF
- **EdgeScrollIndicator.test.tsx**: visible=true のケースを追加（既にあるか確認）
- **ConnectorPortComponent.test.tsx**: onClick ハンドラーのテスト追加

### ストーリー計画

- UI変更なし。テスト追加のみ。
