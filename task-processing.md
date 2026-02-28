## 現在のタスク

**ソース:** `tasks/prd-effect-ts.md` - ET-007

- [-] **ET-007: パース結果型を `Either` に統一**

### 周辺情報

- `src/lib/logic-lang/token.ts` — `LexResult` を `Either` に変換
- `src/lib/logic-lang/lexer.ts` — 内部更新
- `src/lib/logic-lang/parser.ts` — `ParseResult`, `TermParseResult` を `Either` に変換
- 呼び出し元（editorLogic, inputCompletion, mpApplicationLogic, genApplicationLogic, substitutionApplicationLogic, goalCheckLogic, workspaceState）を一括更新
- 型エラーで変更漏れを検出可能
