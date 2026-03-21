## 現在のタスク

**出典:** `tasks/inserted-tasks.md` 1行目

> 結局Effect.tsが組込まれているようにスクリプトエディタは構成できないのか

### コンテキスト

- スクリプトエディタはMonaco + js-interpreter でサンドボックス実行
- 現在builtin-api.d.tsに型定義、NativeFunctionBridgeでAPI関数を提供
- Effect.tsはlogic-coreで広く使用されているが、サンドボックスには非公開
- サンドボックスのAPIはJSON互換の plain discriminated union で返している

### 調査結果

Effect.tsをそのままサンドボックスに組み込むのは困難（js-interpreterがgenerator/async未対応、巨大バンドル）。

**実行可能なアプローチ: Effect.ts風ヘルパー関数の提供（Option B）**

- builtin-api.d.tsに`EitherJson<T, E>`型定義を追加
- `isRight`, `isLeft`, `mapRight`, `mapLeft`等のヘルパー関数を追加
- NativeFunctionBridgeでシンプルなJS実装を提供
- 既存APIの戻り値型を`EitherJson`型に統一していく

### テスト計画

- `builtin-api.test.ts` に新ヘルパー関数の型定義存在確認テスト追加
- 新しいブリッジモジュール（eitherBridge.ts）のユニットテスト作成
- 既存のスクリプトテスト（scriptRunner.test.ts等）で新関数の動作確認

### ストーリー計画

- UIの変更なし。スクリプトエディタの内部API拡張のみ
