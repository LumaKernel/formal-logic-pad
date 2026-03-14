# DSL言語仕様 (Logic Schema Language)

本プロジェクトで使用する論理式スキーマ記述用DSL（Logic Schema Language）の文法仕様を定義する。Logic Lang (`src/lib/logic-lang/`) の Lexer/Parser 実装の正式な仕様として参照する。

## 1. トークン一覧

### 1.1 論理演算子トークン

| トークン種別 | Unicode入力 | ASCII入力       | 備考           |
| ------------ | ----------- | --------------- | -------------- |
| `NOT`        | `$\lnot$`         | `~`, `not`      | 前置単項演算子 |
| `AND`        | `$\land$`         | `/\`, `and`     | 二項演算子     |
| `OR`         | `$\lor$`         | `\/`, `or`      | 二項演算子     |
| `IMPLIES`    | `$\to$`         | `->`, `implies` | 二項演算子     |
| `IFF`        | `$\leftrightarrow$`         | `<->`, `iff`    | 二項演算子     |

### 1.2 量化子トークン

| トークン種別 | Unicode入力 | ASCII入力       |
| ------------ | ----------- | --------------- |
| `FORALL`     | `$\forall$`         | `all`, `forall` |
| `EXISTS`     | `$\exists$`         | `ex`, `exists`  |

### 1.3 等号トークン

| トークン種別 | 入力 | 備考                       |
| ------------ | ---- | -------------------------- |
| `EQUALS`     | `=`  | 項と項を繋ぐ。論理式を生成 |

### 1.4 項の二項演算子トークン

| トークン種別 | Unicode入力  | ASCII入力 | 備考 |
| ------------ | ------------ | --------- | ---- |
| `PLUS`       | `+`          | `+`       |      |
| `MINUS`      | `−` (U+2212) | `-`       |      |
| `TIMES`      | `×` (U+00D7) | `*`       |      |
| `DIVIDE`     | `÷` (U+00F7) | `/`       |      |
| `POWER`      | `^`          | `^`       |      |

### 1.5 区切り文字トークン

| トークン種別 | 入力 | 備考                   |
| ------------ | ---- | ---------------------- |
| `LPAREN`     | `(`  | 左括弧                 |
| `RPAREN`     | `)`  | 右括弧                 |
| `DOT`        | `.`  | 量化子のスコープ区切り |
| `COMMA`      | `,`  | 関数・述語の引数区切り |

### 1.6 識別子トークン

| トークン種別    | パターン                            | 例                         |
| --------------- | ----------------------------------- | -------------------------- |
| `META_VARIABLE` | ギリシャ文字（Unicode/ASCII）+ 添字 | `$\varphi$`, `phi`, `$\varphi$1`, `phi_01` |
| `UPPER_IDENT`   | 大文字英字で始まる英数字列          | `P`, `Q`, `Rel`            |
| `LOWER_IDENT`   | 小文字英字で始まる英数字列          | `x`, `f`, `zero`           |

### 1.7 特殊トークン

| トークン種別 | 備考     |
| ------------ | -------- |
| `EOF`        | 入力終端 |

## 2. 識別子の命名規約と解決規則

### 2.1 メタ変数

**パターン:** ギリシャ文字（Unicode直接入力またはASCII名）にオプションで添字を付けたもの。

使用可能なギリシャ文字は `01-notation.md` セクション6を参照。ο（オミクロン）は除外。

**添字の記法:**

```
$\varphi \to$ MetaVariable(name="$\varphi$", subscript=None)
$\varphi$1        $\to$ MetaVariable(name="$\varphi$", subscript="1")
phi1      $\to$ MetaVariable(name="$\varphi$", subscript="1")
$\varphi$01       $\to$ MetaVariable(name="$\varphi$", subscript="01")
phi_01    $\to$ MetaVariable(name="$\varphi$", subscript="01")
$\varphi$₁        $\to$ MetaVariable(name="$\varphi$", subscript="1")   ※Unicode下付き数字
```

**添字の範囲:** 1桁 `0`〜`9`、2桁 `00`〜`99`、3桁 `000`〜`999`。

**重要:** `01` と `1` は文字列として**異なる添字**。`phi1` ≠ `phi01` ≠ `phi001`。

**ASCII入力でのアンダースコア:** `phi_01` のようにアンダースコアを区切りに使える。`phi01` と `phi_01` は同値。

### 2.2 大文字で始まる識別子

**解決:** 述語（Predicate）として解釈される。

```
P         $\to$ 引数なし述語: Predicate(name="P", args=[])
P(x)      $\to$ 単項述語: Predicate(name="P", args=[TermVariable("x")])
Q(x, y)   $\to$ 二項述語: Predicate(name="Q", args=[TermVariable("x"), TermVariable("y")])
```

### 2.3 小文字で始まる識別子

**解決:**

- 後続に `(` がある $\to$ 関数適用（Function）
- それ以外 $\to$ 項変数（TermVariable）

定数（`0`, `1` 等の数字リテラルや特定の名前）も `LOWER_IDENT` と同じカテゴリで扱い、文脈に応じて Constant として解釈する。ただし、引数付き形式 `c(...)` は Function となる。

```
x         $\to$ TermVariable(name="x")
f(x)      $\to$ Function(name="f", args=[TermVariable("x")])
g(x, y)   $\to$ Function(name="g", args=[TermVariable("x"), TermVariable("y")])
```

**数字リテラル:** `0`, `1`, `2`, ... は `Constant` として扱う。

```
0         $\to$ Constant(name="0")
42        $\to$ Constant(name="42")
```

### 2.4 キーワードとの衝突回避

以下のASCII名はキーワードとして予約されており、識別子としては使用できない:

- 論理演算子キーワード: `not`, `and`, `or`, `implies`, `iff`
- 量化子キーワード: `all`, `forall`, `ex`, `exists`
- ギリシャ文字ASCII名: `phi`, `psi`, `chi`, `alpha`, `beta`, ... （メタ変数として解釈）

小文字識別子が偶然これらと衝突しないよう、lexerはキーワードを先に判定する。

## 3. 正式な文法定義 (EBNF)

```ebnf
(* ==== 最上位規則 ==== *)
input       = formula , EOF ;

(* ==== 論理式 (Formula) ==== *)
formula     = iff_expr ;

iff_expr    = impl_expr , { "$\leftrightarrow$" , impl_expr } ;         (* 右結合 *)
impl_expr   = or_expr , [ "$\to$" , impl_expr ] ;            (* 右結合 *)
or_expr     = and_expr , { "$\lor$" , and_expr } ;             (* 左結合 *)
and_expr    = not_expr , { "$\land$" , not_expr } ;             (* 左結合 *)

not_expr    = "$\lnot$" , not_expr                              (* 前置単項 *)
            | quantified
            ;

quantified  = ( "$\forall$" | "$\exists$" ) , LOWER_IDENT , "." , formula  (* 量化 *)
            | equality
            ;

equality    = term_expr , "=" , term_expr                 (* 等号 *)
            | atom_formula
            ;

atom_formula = META_VARIABLE                               (* メタ変数 *)
             | UPPER_IDENT , [ "(" , term_list , ")" ]     (* 述語 *)
             | "(" , formula , ")"                         (* 括弧 *)
             ;

(* ==== 項 (Term) ==== *)
term_expr   = add_expr ;

add_expr    = mul_expr , { ( "+" | "−" ) , mul_expr } ;    (* 左結合 *)
mul_expr    = power_expr , { ( "×" | "÷" ) , power_expr } ;(* 左結合 *)
power_expr  = unary_term , [ "^" , power_expr ] ;          (* 右結合 *)

unary_term  = atom_term ;

atom_term   = META_VARIABLE                                (* 項メタ変数 *)
            | LOWER_IDENT , [ "(" , term_list , ")" ]      (* 変数/関数 *)
            | NUMBER                                       (* 定数 *)
            | "(" , term_expr , ")"                        (* 括弧 *)
            ;

term_list   = term_expr , { "," , term_expr } ;

(* ==== トークン（字句レベル） ==== *)
META_VARIABLE = greek_letter , [ subscript ] ;
greek_letter  = "$\alpha$" | "$\beta$" | "$\gamma$" | "$\delta$" | "ε" | "ζ" | "η" | "$\theta$"
              | "ι" | "κ" | "$\lambda$" | "μ" | "ν" | "ξ" | "π" | "ρ"
              | "$\sigma$" | "$\tau$" | "υ" | "$\varphi$" | "$\chi$" | "$\psi$" | "ω"
              | "alpha" | "beta" | "gamma" | "delta" | "epsilon"
              | "zeta" | "eta" | "theta" | "iota" | "kappa"
              | "lambda" | "mu" | "nu" | "xi" | "pi" | "rho"
              | "sigma" | "tau" | "upsilon" | "phi" | "chi"
              | "psi" | "omega"
              ;
subscript     = [ "_" ] , digit , { digit } ;              (* 最大3桁 *)
digit         = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
NUMBER        = digit , { digit } ;
UPPER_IDENT   = upper_letter , { letter | digit | "_" } ;
LOWER_IDENT   = lower_letter , { letter | digit | "_" } ;
upper_letter  = "A" | "B" | ... | "Z" ;
lower_letter  = "a" | "b" | ... | "z" ;
letter        = upper_letter | lower_letter ;
```

### 3.1 文法上の注意点

1. **$\leftrightarrow$ の結合性:** 右結合として扱う。`$\varphi \leftrightarrow \psi \leftrightarrow \chi$` は `$\varphi \leftrightarrow (\psi \leftrightarrow \chi)$` と解釈する。
2. **量化子のスコープ:** ドットの右側全体が量化子のスコープ。`$\forall$x. P(x) $\to$ Q(x)` は `$\forall$x. (P(x) $\to$ Q(x))`。
3. **等号の優先順位:** 等号は項の二項演算より弱く、論理結合子より強い。`x + y = z` は `(x + y) = z`、`x = y $\to$ P(x)` は `(x = y) $\to$ P(x)` と解釈する。
4. **メタ変数の文脈依存性:** メタ変数は論理式の位置では `MetaVariable`、項の位置では `TermMetaVariable` として解釈する。パーサーが文脈に応じて判定する。

## 4. 演算子の優先順位と結合性（統合表）

### 4.1 論理式レベル

| 優先順位 | 演算子 | 記法 | 結合性   | AST型名         |
| -------- | ------ | ---- | -------- | --------------- |
| 1 (最高) | $\lnot$      | 前置 | 前置単項 | `Negation`      |
| 2        | $\land$      | 中置 | 左結合   | `Conjunction`   |
| 3        | $\lor$      | 中置 | 左結合   | `Disjunction`   |
| 4        | $\to$      | 中置 | 右結合   | `Implication`   |
| 5 (最低) | $\leftrightarrow$      | 中置 | 右結合   | `Biconditional` |

量化子 `$\forall$`, `$\exists$` は演算子ではなくバインダーとして扱い、否定と同じ位置（not_expr）でパースする。

### 4.2 項レベル

| 優先順位 | 演算子 | 記法 | 結合性 | AST型名           |
| -------- | ------ | ---- | ------ | ----------------- |
| 1 (最高) | ^      | 中置 | 右結合 | `BinaryOperation` |
| 2        | ×, ÷   | 中置 | 左結合 | `BinaryOperation` |
| 3 (最低) | +, −   | 中置 | 左結合 | `BinaryOperation` |

### 4.3 等号

等号 `=` は項と項を結び、論理式（`Equality`）を生成する。

- 等号の結合力は論理結合子より強く、項の演算子より弱い。
- `x + y = z + w` $\to$ `Equality(BinaryOperation("+", x, y), BinaryOperation("+", z, w))`
- 等号は連鎖しない（`x = y = z` はパースエラー）。

## 5. 入力例と期待されるAST出力の対応表

### 例1: `$\varphi \to \varphi$`

```
Implication(
  left: MetaVariable(name="$\varphi$"),
  right: MetaVariable(name="$\varphi$")
)
```

### 例2: `$\forall$ζ. P(ζ) $\land \exists$ξ. Q(ξ)`

注意: 量化子のスコープはドットの右側全体。

```
入力: $\forall$ζ. P(ζ) $\land \exists$ξ. Q(ξ)
解釈: $\forall$ζ. (P(ζ) $\land (\exists$ξ. Q(ξ)))

Universal(
  variable: TermVariable(name="ζ"),
  formula: Conjunction(
    left: Predicate(name="P", args=[TermVariable(name="ζ")]),
    right: Existential(
      variable: TermVariable(name="ξ"),
      formula: Predicate(name="Q", args=[TermVariable(name="ξ")])
    )
  )
)
```

### 例3: `f(x) + g(y) = h(z)`

```
Equality(
  left: BinaryOperation(
    operator: "+",
    left: Function(name="f", args=[TermVariable(name="x")]),
    right: Function(name="g", args=[TermVariable(name="y")])
  ),
  right: Function(name="h", args=[TermVariable(name="z")])
)
```

### 例4: `$\forall$x. x + 0 = x`

```
Universal(
  variable: TermVariable(name="x"),
  formula: Equality(
    left: BinaryOperation(
      operator: "+",
      left: TermVariable(name="x"),
      right: Constant(name="0")
    ),
    right: TermVariable(name="x")
  )
)
```

### 例5: `phi1 -> phi_1`

`phi1` と `phi_1` はどちらも `MetaVariable(name="$\varphi$", subscript="1")` に解釈される。つまり同じメタ変数。

```
Implication(
  left: MetaVariable(name="$\varphi$", subscript="1"),
  right: MetaVariable(name="$\varphi$", subscript="1")
)
```

### 例6: `phi1 -> phi01`

`phi1` は `subscript="1"`、`phi01` は `subscript="01"`。これらは**異なる**メタ変数。

```
Implication(
  left: MetaVariable(name="$\varphi$", subscript="1"),
  right: MetaVariable(name="$\varphi$", subscript="01")
)
```

### 例7: `$\lnot$P(x) $\lor$ Q(x, y)`

```
Disjunction(
  left: Negation(
    formula: Predicate(name="P", args=[TermVariable(name="x")])
  ),
  right: Predicate(name="Q", args=[TermVariable(name="x"), TermVariable(name="y")])
)
```

### 例8: `($\varphi \to \psi) \to (\varphi \to \chi) \to (\varphi \to (\psi \to \chi)$)`

$\to$ は右結合。

```
解釈: ($\varphi \to \psi) \to ((\varphi \to \chi) \to (\varphi \to (\psi \to \chi))$)

Implication(
  left: Implication(
    left: MetaVariable(name="$\varphi$"),
    right: MetaVariable(name="$\psi$")
  ),
  right: Implication(
    left: Implication(
      left: MetaVariable(name="$\varphi$"),
      right: MetaVariable(name="$\chi$")
    ),
    right: Implication(
      left: MetaVariable(name="$\varphi$"),
      right: Implication(
        left: MetaVariable(name="$\psi$"),
        right: MetaVariable(name="$\chi$")
      )
    )
  )
)
```

### 例9: `x ^ y ^ z`

^ は右結合。

```
BinaryOperation(
  operator: "^",
  left: TermVariable(name="x"),
  right: BinaryOperation(
    operator: "^",
    left: TermVariable(name="y"),
    right: TermVariable(name="z")
  )
)
```

### 例10: `$\forall x. \exists$y. x + y = 0`

```
Universal(
  variable: TermVariable(name="x"),
  formula: Existential(
    variable: TermVariable(name="y"),
    formula: Equality(
      left: BinaryOperation(
        operator: "+",
        left: TermVariable(name="x"),
        right: TermVariable(name="y")
      ),
      right: Constant(name="0")
    )
  )
)
```

### 例11: `P(f(x, g(y)), z)`

ネストした関数適用。

```
Predicate(
  name: "P",
  args: [
    Function(name="f", args=[
      TermVariable(name="x"),
      Function(name="g", args=[TermVariable(name="y")])
    ]),
    TermVariable(name="z")
  ]
)
```

### 例12: `$\varphi \leftrightarrow \psi \leftrightarrow \chi$`

$\leftrightarrow$ は右結合。

```
Biconditional(
  left: MetaVariable(name="$\varphi$"),
  right: Biconditional(
    left: MetaVariable(name="$\psi$"),
    right: MetaVariable(name="$\chi$")
  )
)
```

## 6. エラーケースと期待されるエラーメッセージの指針

### 6.1 構文エラー

| 入力        | エラー種別         | エラーメッセージの指針                                |
| ----------- | ------------------ | ----------------------------------------------------- |
| `$\varphi \to$`       | 予期しないEOF      | `Unexpected end of input: expected formula after '$\to$'` |
| `$\to \varphi$`       | 予期しないトークン | `Unexpected '$\to$' at 1:1: expected formula`             |
| `$\varphi \land \land \psi$`   | 予期しないトークン | `Unexpected '$\land$' at 1:5: expected formula after '$\land$'`   |
| `($\varphi \to \psi$`    | 括弧の不一致       | `Expected ')' at 1:8: unclosed '(' at 1:1`            |
| `$\forall$. P(x)`   | 変数の欠落         | `Expected variable after '$\forall$' at 1:2`                  |
| `$\forall$x P(x)`   | ドットの欠落       | `Expected '.' after bound variable at 1:4`            |
| `P(x,)`     | 末尾のカンマ       | `Unexpected ')' at 1:5: expected term after ','`      |
| `x = y = z` | 等号の連鎖         | `Chained equality is not allowed at 1:8`              |

### 6.2 字句エラー

| 入力      | エラー種別     | エラーメッセージの指針                                |
| --------- | -------------- | ----------------------------------------------------- |
| `$\varphi$ § $\psi$`   | 不正な文字     | `Unexpected character '§' at 1:3`                     |
| `phi0001` | 添字が長すぎる | `Subscript too long at 1:4: maximum 3 digits allowed` |

### 6.3 エラー報告の要件

- すべてのエラーに**行番号と列番号**を付ける
- エラーメッセージは英語で統一
- パースエラーは**期待されるもの**を明示（`expected formula`, `expected ')'` など）
- 可能であれば**複数のエラー**をまとめて報告（リカバリ可能なパーサー）
- エラー位置は**1-indexed**（行1、列1から始まる）

## 7. Unicode出力フォーマット仕様

ASTからUnicode文字列への変換規則。最小限の括弧のみを出力する。

### 7.1 論理式のフォーマット

| AST型名         | フォーマット              | 例               |
| --------------- | ------------------------- | ---------------- |
| `MetaVariable`  | `名前[₍添字₎]`            | `$\varphi$`, `$\varphi$₁`, `$\varphi$₀₁` |
| `Negation`      | `$\lnot$` + 内部式              | `$\lnot \varphi$`, `$\lnot (\varphi \to \psi)$` |
| `Implication`   | 左 `$\to$` 右                 | `$\varphi \to \psi$`          |
| `Conjunction`   | 左 `$\land$` 右                 | `$\varphi \land \psi$`          |
| `Disjunction`   | 左 `$\lor$` 右                 | `$\varphi \lor \psi$`          |
| `Biconditional` | 左 `$\leftrightarrow$` 右                 | `$\varphi \leftrightarrow \psi$`          |
| `Universal`     | `$\forall$` + 変数 + `.` + 内部式 | `$\forall$x.P(x)`        |
| `Existential`   | `$\exists$` + 変数 + `.` + 内部式 | `$\exists$x.P(x)`        |
| `Predicate`     | 名前 + `(` + 引数 + `)`   | `P(x, y)`        |
| `Equality`      | 左 `=` 右                 | `x = y`          |

### 7.2 項のフォーマット

| AST型名            | フォーマット            | 例                |
| ------------------ | ----------------------- | ----------------- |
| `TermVariable`     | 名前                    | `x`, `y`          |
| `TermMetaVariable` | `名前[₍添字₎]`          | `$\tau$`, `$\sigma$₁`         |
| `Constant`         | 名前                    | `0`, `1`          |
| `Function`         | 名前 + `(` + 引数 + `)` | `f(x)`, `g(x, y)` |
| `BinaryOperation`  | 左 `演算子` 右          | `x + y`, `x × y`  |

### 7.3 括弧の省略規則

括弧を出力するのは以下の場合のみ:

1. **優先順位逆転:** 子の優先順位が親より低い場合。例: `$\varphi \land (\psi \lor \chi)$`
2. **結合性逆転:** 右結合演算子の左辺が同じ演算子の場合。例: `$(\varphi \to \psi) \to \chi$`
3. **否定の内部が複合式:** `$\lnot (\varphi \to \psi)$` （原子式や述語には不要: `$\lnot \varphi$`, `$\lnot$P(x)`）
4. **量化子のスコープ限定:** `($\forall$x.P(x)) $\to$ Q` （括弧なしだと `$\forall$x.(P(x) $\to$ Q)` と解釈される）

### 7.4 添字のUnicode出力

添字はUnicode下付き数字を使う:

| 数字 | Unicode | コードポイント |
| ---- | ------- | -------------- |
| 0    | ₀       | U+2080         |
| 1    | ₁       | U+2081         |
| 2    | ₂       | U+2082         |
| 3    | ₃       | U+2083         |
| 4    | ₄       | U+2084         |
| 5    | ₅       | U+2085         |
| 6    | ₆       | U+2086         |
| 7    | ₇       | U+2087         |
| 8    | ₈       | U+2088         |
| 9    | ₉       | U+2089         |

例: `$\varphi$₁`, `$\psi$₀₁`, `$\chi$₁₂₃`

## 8. LaTeX出力フォーマット仕様

ASTからLaTeX文字列への変換規則。KaTeXでのレンダリングを想定する。

### 8.1 論理式のフォーマット

| AST型名         | LaTeXフォーマット               | 出力例                         |
| --------------- | ------------------------------- | ------------------------------ |
| `MetaVariable`  | `\LaTeX名[_{添字}]`             | `\varphi`, `\varphi_{1}`       |
| `Negation`      | `\lnot` + 内部式                | `\lnot \varphi`                |
| `Implication`   | 左 `\to` 右                     | `\varphi \to \psi`             |
| `Conjunction`   | 左 `\land` 右                   | `\varphi \land \psi`           |
| `Disjunction`   | 左 `\lor` 右                    | `\varphi \lor \psi`            |
| `Biconditional` | 左 `\leftrightarrow` 右         | `\varphi \leftrightarrow \psi` |
| `Universal`     | `\forall` + 変数 + `.` + 内部式 | `\forall x . P(x)`             |
| `Existential`   | `\exists` + 変数 + `.` + 内部式 | `\exists x . P(x)`             |
| `Predicate`     | 名前 + `(` + 引数 + `)`         | `P(x, y)`                      |
| `Equality`      | 左 `=` 右                       | `x = y`                        |

### 8.2 項のフォーマット

| AST型名            | LaTeXフォーマット       | 出力例                |
| ------------------ | ----------------------- | --------------------- |
| `TermVariable`     | 名前                    | `x`, `y`              |
| `TermMetaVariable` | `\LaTeX名[_{添字}]`     | `\tau`, `\sigma_{1}`  |
| `Constant`         | 名前                    | `0`, `1`              |
| `Function`         | 名前 + `(` + 引数 + `)` | `f(x)`, `g(x, y)`     |
| `BinaryOperation`  | 左 + LaTeX演算子 + 右   | `x + y`, `x \times y` |

### 8.3 演算子のLaTeX対応

| 演算子 | LaTeX    |
| ------ | -------- |
| +      | `+`      |
| −      | `-`      |
| ×      | `\times` |
| ÷      | `\div`   |
| ^      | `^`      |

注意: `^` は LaTeX のべき乗記法と一致するため、`x^{y}` の形式で出力する。ネストする場合は `x^{y^{z}}`。

### 8.4 括弧のLaTeX出力

括弧は `\left(` と `\right)` で出力する。省略規則はUnicodeフォーマッターと同じ。

### 8.5 メタ変数のLaTeX対応

| ギリシャ文字 | LaTeXコマンド |
| ------------ | ------------- |
| $\alpha$            | `\alpha`      |
| $\beta$            | `\beta`       |
| $\gamma$            | `\gamma`      |
| $\delta$            | `\delta`      |
| ε            | `\varepsilon` |
| ζ            | `\zeta`       |
| η            | `\eta`        |
| $\theta$            | `\theta`      |
| ι            | `\iota`       |
| κ            | `\kappa`      |
| $\lambda$            | `\lambda`     |
| μ            | `\mu`         |
| ν            | `\nu`         |
| ξ            | `\xi`         |
| π            | `\pi`         |
| ρ            | `\rho`        |
| $\sigma$            | `\sigma`      |
| $\tau$            | `\tau`        |
| υ            | `\upsilon`    |
| $\varphi$            | `\varphi`     |
| $\chi$            | `\chi`        |
| $\psi$            | `\psi`        |
| ω            | `\omega`      |

添字付き: `\varphi_{1}`, `\psi_{01}`, `\chi_{123}`

## 9. Lexerの実装指針

### 9.1 トークン化の優先順位

1. 空白のスキップ
2. EOF判定
3. 単一文字のUnicode記号（`$\lnot$`, `$\land$`, `$\lor$`, `$\to$`, `$\leftrightarrow$`, `$\forall$`, `$\exists$`, `=`, `+`, `−`, `×`, `÷`, `^`, `(`, `)`, `.`, `,`）
4. 複数文字のASCII演算子（`->`, `<->`, `/\`, `\/`）
5. ギリシャ文字のUnicode直接入力（U+03B1〜U+03C9、ο除外）+ 下付き数字
6. 英字で始まる識別子 $\to$ キーワード判定
7. 数字で始まるリテラル
8. 不正な文字のエラー

### 9.2 位置情報

各トークンに以下の位置情報を付与:

```typescript
interface Position {
  readonly line: number; // 1-indexed
  readonly column: number; // 1-indexed
}

interface Span {
  readonly start: Position;
  readonly end: Position;
}

interface Token {
  readonly kind: TokenKind;
  readonly span: Span;
  readonly value?: string; // 識別子名、数値リテラルなど
}
```

## 10. Parserの実装指針

### 10.1 推奨アルゴリズム

**Pratt parser（トップダウン演算子優先順位パーサー）** を推奨する。理由:

- 演算子の優先順位と結合性を数値で表現でき、拡張が容易
- 中置・前置・後置の混在に自然に対応
- 再帰下降パーサーと組み合わせて量化子やアトムのパースに対応

### 10.2 パース戦略の概要

```
parseFormula(minBP = 0):
  lhs = parsePrefix()      // $\lnot , \forall , \exists$, アトム
  while nextToken の binding power > minBP:
    op = consumeToken()
    rhs = parseFormula(rightBP(op))
    lhs = InfixNode(op, lhs, rhs)
  return lhs
```

### 10.3 等号のパース

等号は特殊な位置にある:

- 項レベルの式をまずパースする
- `=` が続けば等号式を生成
- `=` が続かなければ、パースした項が実際に論理式として妥当か文脈に応じて判断

パーサーは等号の位置でバックトラックが必要になる可能性がある。あるいは、`atom_formula` の中で項をまず試みて、`=` があれば等号、なければ述語/メタ変数に戻す。

### 10.4 メタ変数の文脈依存

同じギリシャ文字が論理式位置と項位置の両方に出現しうる:

- `$\varphi \to \psi$` の `$\varphi$` は `MetaVariable`（論理式メタ変数）
- `f($\tau$)` の `$\tau$` は `TermMetaVariable`（項メタ変数）

パーサーは現在のパースコンテキスト（論理式パース中 vs 項パース中）に基づいて判定する。

## 参考文献

- [01-notation.md](./01-notation.md) — 記号・記法の一覧、AST型定義
- [02-propositional-logic.md](./02-propositional-logic.md) — 公理スキーマの定義（パース対象の式の例）
- [03-predicate-logic.md](./03-predicate-logic.md) — 量化子・述語・項の定義
- [04-substitution-and-unification.md](./04-substitution-and-unification.md) — メタ変数代入の定義
- [05-equality-logic.md](./05-equality-logic.md) — 等号の構文的位置づけ
- Pratt, V. "Top Down Operator Precedence" (1973) — Pratt parserの原論文
- Matklad, "Simple but Powerful Pratt Parsing" — Pratt parserの現代的な解説
