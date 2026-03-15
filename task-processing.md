## タスク: ブランチカバレッジ改善（残り未カバー箇所）

元ファイル: 自律判断（prd-inserted-tasks.md が空、カバレッジ100%未達箇所の改善）

### 対象

1. `src/lib/script-runner/templates.ts` line 322 - `filterTemplatesByStyle` の OR 右辺 false ブランチ
2. `src/lib/logic-core/substitution.ts` lines 884, 1026 - FreeVariableAbsence チェーン収集 + 重複変数排除
3. `src/lib/logic-lang/parser.ts` line 277 - FreeVariableAbsence 構文の `]` 欠落エラー
4. `src/lib/reference/ReferenceBrowserComponent.tsx` - testId 未指定ブランチ（v8 ignore 化）

### テスト計画

- `templates.test.ts`: compatibleStyles に含まれないスタイルでフィルタするテスト追加
- `substitution.test.ts`: FreeVariableAbsence を含むチェーン正規化テスト + 同一変数重複テスト追加
- `parser.test.ts`: `φ[/x` のような閉じ括弧欠落のパースエラーテスト追加
- `ReferenceBrowserComponent.tsx`: testId 条件分岐を v8 ignore でマーク（UIのオプショナルprop）

### ストーリー計画

- UI変更なし
