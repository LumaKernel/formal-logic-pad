# 現在のタスク

**元ファイル:** `tasks/inserted-tasks.md`

## タスク

- [x] スクリプトエディタによって実行されるスクリプトの世界にEffect.tsが事前ロードされておくようにする方法を探ろう。

## 調査結果

### 前提: JS-Interpreter の制約

JS-Interpreter (v6.0.1) は **ES5 のみ** をサポート:

- ❌ `let`/`const`、アロー関数、クラス、テンプレートリテラル
- ❌ デストラクチャリング、for-of、スプレッド演算子
- ❌ ジェネレータ、async/await、Promise、Symbol
- ❌ モジュールシステム（import/require）

Effect.ts は `class`、ジェネレータ (`function*`)、`Symbol`、`const`/`let` を多用しており、 **ES5 にトランスパイルしてサンドボックスに直接ロードすることは事実上不可能**。

### 現在のアーキテクチャ

```
サンドボックス (ES5)                        ホスト (TypeScript)
┌──────────────────┐                    ┌────────────────────┐
│ var r = parseF() │──bridge.fn()────→│ Effect.ts Either   │
│ isRight(r)       │──bridge.fn()────→│ JSON互換変換       │
│ getOrThrow(r)    │──bridge.fn()────→│ ネイティブ実装     │
└──────────────────┘                    └────────────────────┘
```

ブリッジ: NativeFunctionBridge (`{ name: string, fn: (...unknown[]) => unknown }`)
現在 ~70 関数が 7 カテゴリで登録済み。

### 選択肢の評価

#### A. ES5トランスパイル＋サンドボックス内ロード ❌

- Effect.ts はジェネレータ・Symbol・WeakMapなどES6+機能に本質的に依存
- Babel等でES5化してもサイズが巨大（数百KB）、パフォーマンス劣悪
- JS-Interpreterの実行ステップ制限 (100K) では到底足りない
- **結論: 非現実的**

#### B. サンドボックスエンジンの変更 (QuickJS / embedded V8) ⚠️

- QuickJS (WebAssembly版) なら ES2023 まで対応、Effect.ts をそのまま実行可能
- 既存の NativeFunctionBridge アーキテクチャの全面書き換えが必要
- セキュリティモデルの再設計（メモリ制限、CPU制限等）
- **結論: 大規模リファクタ。将来的な選択肢としては最も正当だが、現時点ではコスト大**

#### C. ブリッジ関数の拡充（現行アーキテクチャの延長）✅ 推奨

- Effect.ts の主要操作をブリッジ関数として追加
- サンドボックス内では JSON 互換の `{ _tag: "Right", right: value }` 形式で統一（既存）
- ホスト側で Effect.ts を使い、結果のみをサンドボックスに返す
- **追加候補:**
  - `Either.map`/`Either.flatMap` 相当（関数を受け取れないため、組み込み操作として提供）
  - `Option` 系: `some(v)`, `none()`, `isSome()`, `isNone()`, `getOrNull()`
  - `pipe` 相当: 関数チェーンを文字列/配列で記述するDSL（ただし複雑になりすぎるリスク）
- **結論: 最も現実的。既存パターンに完全に沿う**

#### D. プリロードされたユーティリティコード (ES5) ✅ 補助的に有効

- ES5 で書いたヘルパー関数群を `consoleShimCode` と同様に自動プリペンド
- 例: `function eitherMap(e, fn) { return isRight(e) ? createRight(fn(getOrThrow(e))) : e; }`
- ブリッジ関数（C案）と組み合わせ可能
- **結論: C案の補助として、簡単なコンビネータをES5コードで提供するのは有効**

### 推奨アプローチ: C + D の組み合わせ

1. **短期（C案）**: よく使う Effect.ts パターンをブリッジ関数として追加
   - Option 系ブリッジ（`createSome`, `createNone`, `isSome`, `getOrNull`）
   - Either の `map`/`flatMap` は関数をサンドボックスから渡せない制約があるため、プリロードコード（D案）で対応
2. **短期（D案）**: ES5 ユーティリティコードのプリロード
   - `eitherMap(either, fn)`, `eitherFlatMap(either, fn)` 等のヘルパー
   - `consoleShimCode` と同じパターンで `effectUtilsCode` をプリペンド
3. **長期（B案）**: サンドボックスエンジンをQuickJS等に置き換え、Effect.ts を直接ロード可能にする

### 結論

**Effect.ts をサンドボックスに直接ロードすることはJS-Interpreterの制約上不可能。** 代わりに:

- ブリッジ関数の拡充（ネイティブ側でEffect.ts操作を実行）
- ES5ユーティリティコードのプリロード（サンドボックス側のコンビネータ）

の組み合わせが現実的な解。将来的にはサンドボックスエンジン自体の刷新が正道。
