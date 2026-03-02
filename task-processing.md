# 現在のタスク

## タスク（prd-inserted-tasks.md より）

- [ ] ビルトインのクエストには模範解答も付属できるようにしよう。ビルトインのものは、ノート自体ではなく、証明図の構造で保持して、ノートにcompletedなものとして変換する。(自動整列などを利用して、ノートの具体的な内容もcomputedに)
  - [ ] 証明図の正しさ自体はテストで保証。(purelyに)
  - [ ] ビルトインのものはすべて網羅。

## スコープ（このイテレーション）

115問すべてを1イテレーションで実装するのは過大。まずは基盤構築 + propositional-basics（7問: prop-01〜prop-07）の模範解答を実装する。

## テスト計画

- `src/lib/quest/modelAnswer.test.ts` — 模範解答の型定義・ビルダー・バリデーション
  - 各模範解答がゴールを達成するか（checkQuestGoalsWithAxioms）
  - 各模範解答が正当な推論のみで構成されているか
  - applyTreeLayout で位置が計算されるか
- `src/lib/quest/builtinModelAnswers.test.ts` — prop-01〜prop-07 のすべての模範解答を検証

## ストーリー計画

UIの変更はこのイテレーションではなし（模範解答の表示UIは後続タスク）。

## 設計

### ModelAnswer 型（純粋データ）

```typescript
type ModelAnswerStep =
  | { readonly _tag: "axiom"; readonly formulaText: string }
  | {
      readonly _tag: "mp";
      readonly leftIndex: number;
      readonly rightIndex: number;
    }
  | {
      readonly _tag: "gen";
      readonly premiseIndex: number;
      readonly variableName: string;
    }
  | {
      readonly _tag: "substitution";
      readonly premiseIndex: number;
      readonly entries: SubstitutionEntries;
    };

type ModelAnswer = {
  readonly questId: QuestId;
  readonly steps: readonly ModelAnswerStep[];
};
```

ステップはインデックスベースで前のステップを参照する（DAG構造）。

### ビルダー: buildModelAnswerWorkspace

ModelAnswer → WorkspaceState を純粋に構築する関数。

1. resolveSystemPreset でDeductionSystemを取得
2. createQuestWorkspace でゴール付きワークスペースを作成
3. ステップを順に適用（addNode + applyMPAndConnect etc.）
4. applyTreeLayout で自動配置
5. checkQuestGoalsWithAxioms でゴール達成を検証

### バリデータ: validateModelAnswer

模範解答がクエストのゴールを正しく達成しているか検証する純粋関数。テストから呼ばれる。
