## 実行中タスク

カバレッジ改善: CustomQuestListComponent.tsx (Stmts: 75.25%, Branch: 76.53%, Lines: 82.85%)

**出典:** カバレッジレポートより（prdタスクではなくカバレッジ改善）

### 未カバー箇所（lcov分析）

**EditForm (行431-627):**
- 431-434: バリデーションエラー時のフォーカス移動
- 488,502-503,522-523,546: description/category/difficulty/system onChange
- 572-575,592,610-613,627-628: goalsText/hints/estimatedSteps/learningPoint onChange

**CreateForm (行709-902):**
- 709-710: バリデーションエラー時のフォーカス移動
- 761-762,776-777,796-797,819-820: description/category/difficulty/system onChange
- 866,884-887,901-902: hints/estimatedSteps/learningPoint onChange

**CustomQuestItem (行965):**
- 965: onMouseLeave

### テスト計画

- `src/lib/quest/CustomQuestListComponent.test.tsx` に追加テストを書く
  1. EditForm: フィールド入力テスト（各onChange）
  2. EditForm: バリデーションエラー時のフォーカス移動
  3. CreateForm: フィールド入力テスト（各onChange）
  4. CreateForm: バリデーションエラー時のフォーカス移動
  5. CustomQuestItem: mouseLeave
- UI変更なし → ストーリー追加不要
