# PRD: Hilbert系模範解答の公理制約違反修正

## 背景

全Hilbert系クエストの模範解答で「公理制約違反（AllAchievedButAxiomViolation）」が発生している。
原因は `hasInstanceRoots` — `axiom` ステップが公理のインスタンス（代入済み式）を直接ルートノードに配置しているが、
バリデーションでは公理スキーマ → SubstitutionEdge → インスタンスの導出チェーンを期待する。

## 現状（check-model-answers.local.ts で確認済み）

| カテゴリ | プリセット | 合計 | AllAchieved | 失敗 | 原因 |
|---|---|---|---|---|---|
| propositional-basics | lukasiewicz | 15 | 1 | 14 | INSTANCE_ROOTS |
| propositional-intermediate | lukasiewicz | 13 | 2 | 11 | INSTANCE_ROOTS |
| propositional-negation | lukasiewicz | 12 | 1 | 11 | INSTANCE_ROOTS |
| propositional-advanced | lukasiewicz | 10 | 0 | 10 | INSTANCE_ROOTS |
| equality-basics | equality | 10 | 3 | 7 | INSTANCE_ROOTS |
| peano-basics | peano | 10 | 10 | 0 | — |
| peano-arithmetic | peano | 10 | 1 | 9 | INSTANCE_ROOTS |
| group-basics | group-full | 10 | 7 | 3 | INSTANCE_ROOTS |
| group-proofs | group-full | 13 | 0 | 13 | INSTANCE_ROOTS |
| predicate-basics | predicate | 10 | 0 | 10 | INSTANCE_ROOTS |
| predicate-advanced | predicate | 14 | 1 | 13 | INSTANCE_ROOTS |
| nd-basics | nd-nm | 35 | 35 | 0 | — |
| tab-basics | tab-prop | 26 | 26 | 0 | — |
| at-basics | at-prop | 19 | 19 | 0 | — |
| sc-basics | sc-lk | 34 | 34 | 0 | — |
| sc-cut-elimination | sc-lk | 14 | 14 | 0 | — |
| sc-auto-proof | sc-lk | 3 | — | — | 模範解答なし |

**合計: 101/127 Hilbert系が INSTANCE_ROOTS で失敗**

## 根本原因

`buildModelAnswerWorkspace` の `axiom` ステップは `addNode(ws, "axiom", "Axiom", pos, formulaText)` でノードを配置する。
この式が公理スキーマ自体（例: `φ → (ψ → φ)`）であれば OK だが、
代入済みインスタンス（例: `(P → Q) → ((R → S) → (P → Q))`）だと `validateRootNodes` が "instance" と判定し、
`hasInstanceRoots = true` → `AllAchievedButAxiomViolation` となる。

## 解決方針

`buildModelAnswerWorkspace` の `axiom` ステップ処理を改修し、
公理インスタンスの場合は自動的に「公理スキーマノード + SubstitutionEdge + インスタンスノード」の導出チェーンを生成する。

### 実装方法

1. `axiom` ステップで式をパースし、どの公理スキーマのインスタンスかを特定する（`identifyAxiomSchema` を利用）
2. スキーマに完全一致する場合はそのまま1ノード配置（現状通り）
3. インスタンスの場合:
   a. 公理スキーマのテキストでスキーマノードを配置
   b. `applySubstitutionAndConnect` でSubstitutionEdgeを作成
   c. 結果のインスタンスノードをステップのノードIDとして記録
4. 理論公理（theory axiom）の場合も同様に処理

## タスクリスト

### Phase 1: axiom ステップの自動展開 [x]

- [x] `identifyAxiom` + `isTrivialAxiomSubstitution` で公理インスタンスを特定
- [x] `buildModelAnswerWorkspace` の `axiom` ケースを改修: `expandAxiomStepIfNeeded` ヘルパーで自動展開
  - スキーマ完全一致: 現状通り（1ノード）
  - インスタンス: スキーマノード + SubstitutionEdge + インスタンスノード（formulaText強制上書き）
  - 述語公理（A4等）: SubstitutionEntriesが不完全でもInferenceEdgeの存在でルート判定をパス
- [x] 理論公理: matchMode:"exact"のため非自明代入にならず、自動的に対応済み
- [x] テスト: 全1149テスト（builtinModelAnswers.test.ts含む）がパス
- [x] Storybook: WorkspacePageView QuestCompleteProp01 のアサーションを更新（Proved!に変更）

### Phase 2: sc-auto-proof の模範解答（後続）

- [ ] sc-auto-01, sc-auto-02, sc-auto-03 の模範解答を作成

## 成功基準

- `check-model-answers.local.ts` で全カテゴリが AllAchieved
- `builtinModelAnswers.test.ts` の全テストがパス
- 既存の passing クエスト（peano-basics等）がリグレッションしない
