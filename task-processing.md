## 現在のタスク

**出典:** `tasks/prd-advanced.md` B4

- [ ] B4. **TAB と LK-CUT の等価性の解説リファレンス** - TAB ⊆ LK-CUT (定理12.13) および LK-CUT ⊆ TAB (定理12.15) の等価性の解説と意義 (bekki Ch.12.4)

### 周辺情報

- リファレンスシステムは `src/lib/reference/` にある
- referenceEntry.ts(型・検索ロジック) + referenceContent.ts(コンテンツデータ) + referenceUILogic.ts(UIロジック)
- リファレンスエントリ追加時は `allReferenceEntries` 配列 + `referenceContent.test.ts` のエントリ数を更新
- bekki.pdf の Ch.12.4 が主要参考文献
