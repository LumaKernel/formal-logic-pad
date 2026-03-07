## 実行中のタスク

**出典:** `tasks/prd-scripted-proof-rewriting.md` 追加指示 L7

> 処理が重たくなったり、無限ループになっているときに適切に止めたり気付けたりできるように、多少ゆっくりの実行になってもいいから、ユーザーが介入することができるように、数万ステップごとにちょっと時間おいたり、だんだん実行がゆっくりになるようになったり、とか工夫してほしい

### 周辺情報

- 現在の実装:
  - `scriptRunner.ts`: `DEFAULT_MAX_STEPS=10000`, `DEFAULT_MAX_TIME_MS=5000`。step()で1ステップ実行、checkLimits()で制限チェック
  - `scriptEditorLogic.ts`: autoPlayIntervalMs (10-2000ms) でsetInterval制御
  - `ScriptEditorComponent.tsx`: handleRun()でrunner.run()一括実行、handlePlay()でauto-step
- 問題点: `handleRun()`は同期的にrun()を完了するため、無限ループ時にUIがフリーズする。ユーザーは停止ボタンを押せない

### テスト計画

1. **scriptRunner.test.ts**: `run()` に yield（中断ポイント）機能がある場合のテスト追加
2. **scriptEditorLogic.test.ts**: プログレッシブスローダウンのロジックテスト
   - ステップ数に基づくインターバル増加のテスト
   - 段階的スローダウンの閾値テスト
3. **ScriptEditorComponent.stories.tsx**: 長時間実行のストーリーは不要（既存ストーリーで確認）

### ストーリー計画

- UI変更あり: Run実行が非同期化されるため、既存のストーリーで動作確認する
- 新規ストーリーは不要（既存のDefaultストーリーで十分確認可能）

### 実装方針

1. **Run実行の非同期化**: `runner.run()` を一括同期から「チャンク実行+yield」に変更
   - N ステップごとに `setTimeout(0)` で制御を返す → UIスレッドが応答可能に
   - 停止ボタンが押せるようになる
2. **プログレッシブスローダウン（auto-play時）**: ステップ数に応じてインターバルを自動的に拡大
   - 例: 10,000ステップ超で2倍、50,000ステップ超で4倍
3. **Run時のチャンクサイズ制御**: 段階的にチャンクサイズを縮小してUI応答性を高める
