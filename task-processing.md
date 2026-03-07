## 現在のタスク

**出典:** `tasks/prd-scripted-proof-rewriting.md` US-004
**タスク:** エラー発生時はエディタ上にエラー箇所とメッセージを表示

### 周辺情報

US-004の他の完了済み項目:

- [x] 実行コントロール: 再生（▶）、ステップ（⏭）、一時停止（⏸）、リセット（⏹）
- [x] 実行速度スライダー（自動再生時の速度調整）
- [x] コンソール出力パネル（`console.log` のブリッジ）— 既に実装済み

US-004の他の未完了項目:

- [ ] ステップ実行モード: 1ステップずつコードを進める（Step ボタンは実装済みだが行ハイライトが未）
- [ ] 現在の実行行をエディタ上でハイライト表示
- [ ] 各ステップ後の証明図の状態をキャンバス上にリアルタイム反映

### テスト計画

- `scriptEditorLogic.test.ts`: `extractErrorLine` 純粋関数のテスト追加（行番号の抽出）
- `ScriptEditorComponent.stories.tsx`: エラー発生時のストーリー追加（構文エラー、ランタイムエラー）

### ストーリー計画

- `WithSyntaxError`: 構文エラーを含むコードでRunした場合のUI
- `WithRuntimeError`: ランタイムエラーを含むコードでRunした場合のUI

### 実装方針

1. `scriptEditorLogic.ts` に `extractErrorLine(errorMessage: string): number | null` 純粋関数を追加
   - SyntaxError / RuntimeError のメッセージから行番号を抽出
   - consoleShimCode の1行分のオフセットを差し引く
2. `ScriptEditorComponent.tsx` で Monaco Editor のエディタインスタンスを保持
3. エラー発生時に `monaco.editor.setModelMarkers` でエラー箇所にマーカー（波線）を表示
4. リセット時にマーカーをクリア
