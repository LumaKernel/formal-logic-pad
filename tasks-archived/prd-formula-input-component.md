# PRD: 論理式スキーマ入力コンポーネント (Formula Input Component)

## はじめに

論理式スキーマを**DSLテキストで入力・編集**しつつ、**美しくレンダリング**されるReactコンポーネントを構築する。
ユーザーは専用言語（Logic Schema Language）で論理式を書き、リアルタイムでUnicodeまたはLaTeX（KaTeX）表示を確認しながら編集できる。

## 前提条件

| 依存先         | パス                       | 状態    | 必要な理由                            |
| -------------- | -------------------------- | ------- | ------------------------------------- |
| Logic Core     | `src/lib/logic-core/`      | ✅ 完了 | Formula/Term AST型定義                |
| Logic Lang     | `src/lib/logic-lang/`      | ✅ 完了 | Lexer/Parser/Formatter（US-015〜018） |
| InfiniteCanvas | `src/lib/infinite-canvas/` | ✅ 完了 | ノード内に配置する際の統合            |

> **Logic Lang (US-015〜018) の実装が先行して必要。** 入力コンポーネントはLogic Langのparse/formatに依存する。
> US-015〜018は `tasks/prd-formal-logic-pad.md` フェーズ2Bに定義済み。

## 設計原則

1. **コンポーネントの独立性**: 入力コンポーネントは `src/lib/formula-input/` に配置し、InfiniteCanvasとは独立にテスト可能
2. **Logic Lang経由のAST変換**: テキスト入力 → Logic Lang parse → AST → Logic Lang format → 表示
3. **リアルタイムフィードバック**: 入力中にパースエラーの位置と内容をインラインで表示
4. **2つのモード**: 編集モード（テキスト入力）と表示モード（レンダリング済み表示）
5. **Storybook駆動**: 各段階をストーリーで確認・テスト可能にする

## ユーザーストーリー

### フェーズA: レンダリング層（Logic Lang完成後すぐに着手可能）

#### FI-001: Unicode論理式レンダラー [x]

**説明:** 開発者として、Logic CoreのFormula ASTをUnicode文字列で美しく表示するReactコンポーネントがほしい。

**受け入れ基準:**

- [x] `<FormulaDisplay formula={ast} />` コンポーネントを作成
- [x] Logic Lang の `formatUnicode()` を使用してAST→Unicode変換
- [x] 論理記号（→, ∧, ∨, ¬, ∀, ∃）と添字（₀₁₂...）を正しく表示
- [x] 等号、二項演算子、関数/述語も対応
- [x] 最小限の括弧のみ表示（優先順位考慮）
- [x] フォントサイズ・色をpropsで調整可能
- [x] Storybookストーリー（各種論理式パターン）を追加
- [x] play関数でレンダリング結果を検証
- [x] 型チェック/lintが通る

#### FI-002: KaTeX論理式レンダラー [x]

**説明:** 開発者として、Formula ASTをKaTeXで数式として美しくレンダリングしたい。

**受け入れ基準:**

- [x] `<FormulaKaTeX formula={ast} />` コンポーネントを作成
- [x] Logic Lang の `formatLaTeX()` を使用してAST→LaTeX変換
- [x] KaTeXライブラリでLaTeX文字列をレンダリング
- [x] インラインモード（`$...$`相当）とブロックモード（`$$...$$`相当）を切替可能
- [x] フォントサイズをpropsで調整可能
- [x] Storybookストーリーを追加
- [x] play関数でKaTeX出力の存在・内容を検証
- [x] 型チェック/lintが通る

#### FI-003: Term（項）レンダラー [x]

**説明:** 開発者として、Term ASTを単独でレンダリングしたい。

**受け入れ基準:**

- [x] `<TermDisplay term={ast} />` コンポーネント（Unicode版）を作成
- [x] `<TermKaTeX term={ast} />` コンポーネント（KaTeX版）を作成
- [x] 二項演算子（+, −, ×, ÷, ^）、関数適用、定数、変数を正しく表示
- [x] Storybookストーリーを追加
- [x] 型チェック/lintが通る

### フェーズB: テキスト入力層（Logic Lang Parser完成後）

#### FI-004: 論理式テキスト入力（基本） [x]

**説明:** ユーザーとして、テキストボックスにDSLで論理式を入力し、パース結果を確認したい。

**受け入れ基準:**

- [x] `<FormulaInput value={text} onChange={handler} />` コンポーネントを作成
- [x] テキスト入力でリアルタイムにパースを実行
- [x] パース成功時: 入力欄の下にUnicode表示でプレビュー
- [x] パースエラー時: エラー位置（行:列）とメッセージをインライン表示
- [x] エラー位置の該当テキストにアンダーラインハイライト
- [x] `onParsed` コールバックでパース成功時のFormulaASTを親に通知
- [x] debounce付き（入力中の過剰なパースを防止）
- [x] Storybookストーリー（正常入力、エラー入力、リアルタイム編集）を追加
- [x] play関数で入力→パース→表示のフローを検証
- [x] 型チェック/lintが通る

#### FI-005: 項テキスト入力 [x]

**説明:** ユーザーとして、項（Term）のみをテキスト入力したい。代入パラメータの入力などに使う。

**受け入れ基準:**

- [x] `<TermInput value={text} onChange={handler} />` コンポーネントを作成
- [x] Logic Langのterm用パーサーを使用
- [x] パース成功/エラー表示はFormulaInputと同様
- [x] `onParsed` コールバックでTermASTを通知
- [x] Storybookストーリーを追加
- [x] 型チェック/lintが通る

#### FI-006: 入力補完・ショートカット [x]

**説明:** ユーザーとして、入力を効率化するショートカットや補完がほしい。

**受け入れ基準:**

- [x] ASCII入力からUnicode変換のリアルタイム候補表示（例: `->` 入力中に `→` を候補表示）
- [x] ギリシャ文字のASCII名→Unicode変換候補（例: `phi` → `φ`）
- [x] Tab/Enterで候補選択
- [x] 量化子テンプレート挿入（`all` → `∀.` のスケルトン）
- [x] Storybookストーリーで補完動作を確認
- [x] 型チェック/lintが通る

### フェーズC: 統合編集モード

#### FI-007: 編集/表示モード切替コンポーネント [x]

**説明:** ユーザーとして、論理式を美しいレンダリングで見つつ、クリックして編集モードに入りたい。

**受け入れ基準:**

- [x] `<FormulaEditor value={ast} onChange={handler} />` コンポーネントを作成
- [x] 表示モード: KaTeXまたはUnicodeでレンダリング表示
- [x] クリックで編集モードに切替: テキスト入力欄が表示される
- [x] 編集完了（blur/Enter/Escape）で表示モードに戻る
- [x] パースエラー時は編集モードに留まる（エラー表示）
- [x] 編集→表示のトランジションアニメーション
- [x] Storybookストーリー（モード切替、エラー時の挙動）を追加
- [x] play関数でモード切替フローを検証
- [x] 型チェック/lintが通る

#### FI-008: InfiniteCanvasノード内統合 [x]

**説明:** ユーザーとして、InfiniteCanvas上のノード内で論理式を編集したい。

**受け入れ基準:**

- [x] FormulaEditorをCanvasItemのchildren内に配置可能
- [x] ノードのドラッグとテキスト編集が干渉しない
- [x] 編集モード中はノードのドラッグを無効化
- [x] ノードサイズが編集内容に合わせて調整される
- [x] Storybookストーリー（CanvasItem + FormulaEditor統合デモ）を追加
- [x] play関数でノード内編集の動作を検証
- [x] 型チェック/lintが通る

## 依存関係とフェーズの順序

```
Logic Core (完了)
    ↓
Logic Lang US-015 (Lexer) ← まずこれを実装
    ↓
Logic Lang US-016 (Parser)
    ↓
Logic Lang US-017 (Unicode Formatter) → FI-001 (Unicode Renderer)
Logic Lang US-018 (LaTeX Formatter)   → FI-002 (KaTeX Renderer)
                                        FI-003 (Term Renderer)
    ↓
FI-004 (Formula Text Input)
FI-005 (Term Text Input)
    ↓
FI-006 (Input Completion)
    ↓
FI-007 (Edit/Display Mode Toggle)
    ↓
FI-008 (InfiniteCanvas Integration)
```

## 技術的考慮事項

- **KaTeX**: npm パッケージ `katex` を使用。SSR対応のため `renderToString` も検討
- **debounce**: パースの呼び出し頻度制御。React 19の `useDeferredValue` や `useTransition` を活用する可能性
- **テスト戦略**: レンダラー系はSnapshot testまたはDOM内容検証。入力系はユーザー操作シミュレーション
- **アクセシビリティ**: 入力欄のaria属性、エラーメッセージの `aria-live`
- **パフォーマンス**: KaTeXのレンダリングは比較的重いため、メモ化を活用

## ディレクトリ構成

```
src/lib/formula-input/
├── FormulaDisplay.tsx       # Unicode renderer
├── FormulaKaTeX.tsx         # KaTeX renderer
├── TermDisplay.tsx          # Term Unicode renderer
├── TermKaTeX.tsx            # Term KaTeX renderer
├── FormulaInput.tsx         # Text input with parsing
├── TermInput.tsx            # Term text input
├── FormulaEditor.tsx        # Edit/display mode toggle
├── InputCompletion.tsx      # Autocomplete popup
├── index.ts                 # Public exports
├── *.test.tsx               # Unit tests
└── *.stories.tsx            # Storybook stories
```

## 非目標

- LaTeX直接入力（DSLのみをサポート。LaTeXは出力のみ）
- ビジュアルエディタ（ブロックベースの式組み立て）は将来検討
- IMEとの高度な統合（基本的なASCII/Unicode入力のみ）
