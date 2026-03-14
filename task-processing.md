# 実行中タスク

**元ファイル:** `tasks/prd-scripted-proof.md`
**タスク:** 実行を開始すればデバッガ用のUIも表れてステップ実行したり確認しながら進められたり

## 周辺情報

- スクリプトエディタは既に Run/Step/Play/Pause/Reset ボタン、コンソール出力、行ハイライト、速度スライダーを持つ
- JS-Interpreter の stateStack から位置情報は取得済み
- 不足しているのは「変数ウォッチ」パネル（ステップ実行中に変数の値を確認できる機能）

## テスト計画

- `scriptRunner.test.ts`: `getScope()` メソッドのテスト（ユーザー定義変数の取得）
- `scriptEditorLogic.test.ts`: `recordStepWithVariables` の状態更新テスト
- `ScriptEditorComponent.stories.tsx`: 変数パネル表示のストーリー更新

## ストーリー計画

- `ScriptEditorComponent.stories.tsx`: ステップ実行中に変数パネルが表示されるストーリーを確認

## 実装計画

1. `scriptRunner.ts`: `ScriptRunnerInstance` に `getScope()` を追加（グローバルスコープのユーザー定義変数を返す）
2. `scriptEditorLogic.ts`: `ScriptEditorState` に `variables` フィールドを追加、ステップ時に更新
3. `ScriptEditorComponent.tsx`: 変数ウォッチパネルUIを追加（ステップ実行中に表示）
