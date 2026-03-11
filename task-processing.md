## 実行中タスク

**ソース:** `tasks/prd-inserted-tasks.md` > pragmatic 模範解答（49件）を正しい証明に書き換える

### 今回のスコープ: 理論公理テンプレートの Constant/TermVariable 不一致修正 + group 系模範解答修正

### 発見したバグ

`matchTheoryAxiom` の `matchMode: "exact"` で `equalFormula` を使って比較しているが:

- 理論公理テンプレート（inferenceRule.ts）: `e` を `Constant("e")` として構築
- パーサー（parser.ts）: `e` を `TermVariable("e")` としてパース
- `equalFormula` → `equalTerm` は `_tag` を最初にチェック → `Constant !== TermVariable` で不一致

**影響範囲:**

- G2L `∀x. e × x = x`, G2R `∀x. x × e = x`, G3L `∀x. i(x) × x = e`, G3R `∀x. x × i(x) = e` の全てで `e` が `Constant` として構築されている
- group 系クエスト (group-02〜05 等) でルートノードの理論公理マッチが失敗する
- A4 インスタンス経由の group-07〜23 でもルートに G2L/G3L 等を置く際に影響

**PA 系は影響なし**: パーサーは `0` を `Constant("0")` としてパースする（数字は特別扱い）

### 修正計画

1. **inferenceRule.ts**: `constant("e")` → `termVariable("e")` に変更（groupIdentity の定義）
2. **group 系模範解答の書き換え**:
   - group-02〜05: ゴール式 = 理論公理そのもの → 1ステップの axiom で OK（テンプレートが修正されれば theory-schema として認識される）
   - group-07, 08, 10: 理論公理 + A4 インスタンス + MP の3ステップ（既存のままでOK）
   - group-12〜23: 複数A4 + MP のチェーンが必要。既存の構造を確認して修正
3. **スキップリスト更新**: 修正完了した group クエストを knownPragmaticQuests から削除

### テスト計画

- `inferenceRule.test.ts`: group 理論公理のマッチングテスト追加（identifyAxiom で G2L/G3L/G2R/G3R を検証）
- `builtinModelAnswers.test.ts`: スキップリスト縮小（group 系の修正完了分を削除）
- 既存テスト全パスを確認

### ストーリー計画

- UI 変更なし（ロジック層のみ）
