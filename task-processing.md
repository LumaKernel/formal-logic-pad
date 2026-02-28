## 現在のタスク

**ソース:** `tasks/prd-effect-ts.md` ET-011

**タスク:** ET-011: app層のエラーバウンダリ整備

**内容:**

- ProofWorkspace.tsx で Effect化されたロジック層の呼び出しをUI層境界で `Effect.runSync` / `Either.match` に統一
- エラー → ユーザー向けメッセージ変換パターンの統一
- MP/Gen/Substitution の3つの検証結果処理の共通化

**調査結果:**

- MP/Gen/Subst の3つのバリデーション結果処理パターンが構造的に同一
- `Either.isRight()` チェック → 成功時メッセージ / 失敗時エラーキー変換の繰り返しパターン
- proofMessages.ts に3つの `get*ErrorMessageKey` 関数がある（構造同一）
- Substitution だけ `|| entries.length > 0` の追加条件がある
- quest の Error ハンドリングは既に Effect.runSync + Layer で統一済み
