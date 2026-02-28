## 実行中タスク

**ソース:** `tasks/prd-effect-ts.md` - ET-004

**タスク:** proof-pad エラー型を `Data.TaggedError` に移行

**対象ファイル:**
1. `src/lib/proof-pad/mpApplicationLogic.ts` — `MPApplicationError` (6バリアント)
2. `src/lib/proof-pad/genApplicationLogic.ts` — `GenApplicationError` (5バリアント)
3. `src/lib/proof-pad/substitutionApplicationLogic.ts` — `SubstitutionApplicationError` (5バリアント)

**影響ファイル:**
- 各テストファイル
- `workspaceState.ts` — 結果型の扱い更新
- `ProofWorkspace.tsx` — UI層での結果型の扱い

**受け入れ基準:** proof-padのエラー型が `Data.TaggedError` + `Either` パターンに統一。全テスト通過
