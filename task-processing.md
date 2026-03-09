## タスク: 模範解答ノートを開くためのストーリーを追加する

出典: `tasks/prd-inserted-tasks.md`

### 問題

模範解答をProofWorkspaceで表示するためのストーリーがない。巨大証明を含むストーリーもない。

### 修正計画

1. `src/lib/proof-pad/ModelAnswerDemo.stories.tsx` を新規作成
   - `buildModelAnswerWorkspace` で模範解答からWorkspaceStateを生成
   - 複数のクエストの模範解答をストーリーとして表示
   - 小規模(prop-01: 1ステップ), 中規模(prop-04: 14ステップ), 巨大(prop-16: 107ステップ)をカバー
   - play関数でノード表示・ズーム・fit to content等を確認

### テスト計画

- ストーリーのplay関数がインタラクションテストとして機能
- 既存テストが引き続きpassすること

### ストーリー計画

- `ModelAnswerDemo.stories.tsx` を新規作成:
  - `SmallProof`: prop-01 (1ステップ)
  - `MediumProof`: prop-04 (14ステップ, Hypothetical Syllogism)
  - `LargeProof`: prop-16 (107ステップ, Modus Tollens)
