## タスク: ND/SC/TAB/AT向けの制約設定

**出典:** `tasks/inserted-tasks.md` — 「他の流派についても検討（ND/SC/TAB/AT向けの制約設定）」

### 実施内容

1. **ND**: 全35クエストに `allowedRuleIds` を設定 ✅
   - 模範解答から使用ルールを自動抽出し、各ゴールに設定
2. **SC**: 通常クエスト29問に `disallowedScRuleIds: ["cut"]` を設定 ✅
   - プレースホルダ(sc-23,24,27,30,34)は除外
   - sc-ce-\*（カット使用）は設定しない
   - sc-cer-01 は既に設定済み
   - sc-ap-\*（自動証明）はスクリプトがカット使用可能性あるため除外
3. **TAB**: インフラ不足のため見送り
   - InferenceRuleId が `tab-single/tab-branching/tab-axiom` の3種のみで粗い
   - `getNodeTabRuleIds` のような依存関係追跡関数が未実装
   - 将来: `allowedTabRuleIds?: readonly TabRuleId[]` + 追跡関数の追加が必要
4. **AT**: 模範解答が全プレースホルダのためスキップ
