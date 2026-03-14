# 記法・記号の一覧

本プロジェクトで扱う論理記号・メタ変数・項の記法を一覧する。Logic Core (`src/lib/logic-core/`) の AST 定義と対応付けて参照できるようにする。

## 1. 論理結合子

| 記号              | 名称                   | Unicode                      | LaTeX             | ASCII入力       | AST型名         | 優先順位 | 結合性   |
| ----------------- | ---------------------- | ---------------------------- | ----------------- | --------------- | --------------- | -------- | -------- |
| $\lnot$           | 否定 (Negation)        | `$\lnot$` (U+00AC)           | `\lnot`           | `~`, `not`      | `Negation`      | 1 (最高) | 前置単項 |
| $\land$           | 連言 (Conjunction)     | `$\land$` (U+2227)           | `\land`           | `/\`, `and`     | `Conjunction`   | 2        | 左結合   |
| $\lor$            | 選言 (Disjunction)     | `$\lor$` (U+2228)            | `\lor`            | `\/`, `or`      | `Disjunction`   | 3        | 左結合   |
| $\to$             | 含意 (Implication)     | `$\to$` (U+2192)             | `\to`             | `->`, `implies` | `Implication`   | 4        | 右結合   |
| $\leftrightarrow$ | 双条件 (Biconditional) | `$\leftrightarrow$` (U+2194) | `\leftrightarrow` | `<->`, `iff`    | `Biconditional` | 5 (最低) | 右結合   |

**優先順位:** 数値が小さいほど結合が強い。`$\lnot$` > `$\land$` > `$\lor$` > `$\to$` > `$\leftrightarrow$`

**例:**

- `$\lnot \varphi \land \psi$` は `$(\lnot \varphi) \land \psi$` と解釈される
- `$\varphi \land \psi \to \chi$` は `$(\varphi \land \psi) \to \chi$` と解釈される
- `$\varphi \to \psi \to \chi$` は `$\varphi \to (\psi \to \chi)$` と解釈される（右結合）

## 2. 量化子

| 記号      | 名称                   | Unicode              | LaTeX     | ASCII入力       | AST型名       | スコープ         |
| --------- | ---------------------- | -------------------- | --------- | --------------- | ------------- | ---------------- |
| $\forall$ | 全称量化 (Universal)   | `$\forall$` (U+2200) | `\forall` | `all`, `forall` | `Universal`   | ドットの右側全体 |
| $\exists$ | 存在量化 (Existential) | `$\exists$` (U+2203) | `\exists` | `ex`, `exists`  | `Existential` | ドットの右側全体 |

**スコープ規則:** 量化子のスコープはドット `.` の右側全体に及ぶ。

- `$\forall$x. P(x) $\to$ Q(x)` は `$\forall$x. (P(x) $\to$ Q(x))` と解釈される
- 入れ子: `$\forall x. \exists$y. R(x, y)` は `$\forall$x. ($\exists$y. (R(x, y)))` と解釈される
- スコープを限定する場合は括弧を使う: `($\forall$x. P(x)) $\to$ Q`

## 3. 等号（オプション機能）

| 記号 | 名称            | Unicode      | LaTeX | ASCII入力 | AST型名    | 備考                       |
| ---- | --------------- | ------------ | ----- | --------- | ---------- | -------------------------- |
| =    | 等号 (Equality) | `=` (U+003D) | `=`   | `=`       | `Equality` | 項と項を繋ぐ。論理式を生成 |

- `t₁ = t₂` は `Equality(t₁, t₂)` を生成する
- 等号付き論理は体系設定（`LogicSystem`）で有効/無効を選択する

## 4. 項の二項演算子

| 記号 | 名称 | Unicode      | LaTeX    | ASCII入力 | AST型名           | 優先順位 | 結合性 |
| ---- | ---- | ------------ | -------- | --------- | ----------------- | -------- | ------ |
| +    | 加算 | `+`          | `+`      | `+`       | `BinaryOperation` | 3        | 左結合 |
| −    | 減算 | `−` (U+2212) | `-`      | `-`       | `BinaryOperation` | 3        | 左結合 |
| ×    | 乗算 | `×` (U+00D7) | `\times` | `*`       | `BinaryOperation` | 2        | 左結合 |
| ÷    | 除算 | `÷` (U+00F7) | `\div`   | `/`       | `BinaryOperation` | 2        | 左結合 |
| ^    | 冪乗 | `^`          | `^`      | `^`       | `BinaryOperation` | 1 (最高) | 右結合 |

**優先順位:** `^` > `×`, `÷` > `+`, `−`

**重要:** これらの演算子に意味は与えられていない。純粋に構文的なものである。

**例:**

- `x + y * z` は `x + (y * z)` と解釈される
- `x ^ y ^ z` は `x ^ (y ^ z)` と解釈される（右結合）

## 5. 項の構成要素

| 種別                     | 説明                       | AST型名            | 例                   |
| ------------------------ | -------------------------- | ------------------ | -------------------- |
| 変数 (Variable)          | 項変数。小文字英字で始まる | `TermVariable`     | `x`, `y`, `z`        |
| メタ変数 (Meta Variable) | 項メタ変数。ギリシャ文字   | `TermMetaVariable` | `$\tau$`, `$\sigma$` |
| 定数 (Constant)          | 定数記号                   | `Constant`         | `0`, `1`, `a`, `b`   |
| 関数適用 (Function)      | 関数記号と引数列           | `Function`         | `f(x)`, `g(x, y)`    |

**識別子の命名規約:**

- **大文字で始まる** $\to$ 述語（Predicate）: `P(x)`, `Q(x, y)`
- **小文字で始まる** $\to$ 関数 / 変数 / 定数: `f(x)`, `x`, `c`
- **ギリシャ文字** $\to$ メタ変数: `$\varphi$`, `$\psi$`, `$\tau$`

## 6. メタ変数の命名規則

### 使用可能なギリシャ文字

| 小文字    | 大文字   | Unicode | LaTeX         | ASCII入力 | 用途              |
| --------- | -------- | ------- | ------------- | --------- | ----------------- |
| $\alpha$  | Α        | U+03B1  | `\alpha`      | `alpha`   | 論理式/項メタ変数 |
| $\beta$   | Β        | U+03B2  | `\beta`       | `beta`    | 論理式/項メタ変数 |
| $\gamma$  | $\Gamma$ | U+03B3  | `\gamma`      | `gamma`   | 論理式/項メタ変数 |
| $\delta$  | $\Delta$ | U+03B4  | `\delta`      | `delta`   | 論理式/項メタ変数 |
| ε         | Ε        | U+03B5  | `\varepsilon` | `epsilon` | 論理式/項メタ変数 |
| ζ         | Ζ        | U+03B6  | `\zeta`       | `zeta`    | 論理式/項メタ変数 |
| η         | Η        | U+03B7  | `\eta`        | `eta`     | 論理式/項メタ変数 |
| $\theta$  | Θ        | U+03B8  | `\theta`      | `theta`   | 論理式/項メタ変数 |
| ι         | Ι        | U+03B9  | `\iota`       | `iota`    | 論理式/項メタ変数 |
| κ         | Κ        | U+03BA  | `\kappa`      | `kappa`   | 論理式/項メタ変数 |
| $\lambda$ | Λ        | U+03BB  | `\lambda`     | `lambda`  | 論理式/項メタ変数 |
| μ         | Μ        | U+03BC  | `\mu`         | `mu`      | 論理式/項メタ変数 |
| ν         | Ν        | U+03BD  | `\nu`         | `nu`      | 論理式/項メタ変数 |
| ξ         | Ξ        | U+03BE  | `\xi`         | `xi`      | 論理式/項メタ変数 |
| π         | Π        | U+03C0  | `\pi`         | `pi`      | 論理式/項メタ変数 |
| ρ         | Ρ        | U+03C1  | `\rho`        | `rho`     | 論理式/項メタ変数 |
| $\sigma$  | $\Sigma$ | U+03C3  | `\sigma`      | `sigma`   | 論理式/項メタ変数 |
| $\tau$    | Τ        | U+03C4  | `\tau`        | `tau`     | 論理式/項メタ変数 |
| υ         | Υ        | U+03C5  | `\upsilon`    | `upsilon` | 論理式/項メタ変数 |
| $\varphi$ | Φ        | U+03C6  | `\varphi`     | `phi`     | 論理式/項メタ変数 |
| $\chi$    | Χ        | U+03C7  | `\chi`        | `chi`     | 論理式/項メタ変数 |
| $\psi$    | Ψ        | U+03C8  | `\psi`        | `psi`     | 論理式/項メタ変数 |
| ω         | Ω        | U+03C9  | `\omega`      | `omega`   | 論理式/項メタ変数 |

**除外:** ο (オミクロン, U+03BF) — ラテン文字の `o` と紛らわしいため除外。

### 添字規則

メタ変数にはオプションで添字を付けることができる。

| 添字パターン | 範囲         | 例                             | 備考     |
| ------------ | ------------ | ------------------------------ | -------- |
| なし         | —            | `$\varphi$`, `$\psi$`          | 添字なし |
| 1桁          | `0`〜`9`     | `$\varphi$1`, `$\varphi$0`     |          |
| 2桁          | `00`〜`99`   | `$\varphi$01`, `$\varphi$12`   |          |
| 3桁          | `000`〜`999` | `$\varphi$001`, `$\varphi$123` |          |

**重要:** 添字は**文字列として扱う**。`01` と `1` は**異なる添字**である。

- `$\varphi$1` ≠ `$\varphi$01` ≠ `$\varphi$001`（すべて異なるメタ変数）
- `$\varphi$0` ≠ `$\varphi$00` ≠ `$\varphi$000`（すべて異なるメタ変数）

**入力方法:**

- Unicode直接入力: `$\varphi$₁` (下付き数字 U+2081〜U+2089, U+2080)
- ASCII入力: `phi1`, `phi01`, `phi_1`, `phi_01`
- LaTeX出力: `\varphi_{1}`, `\varphi_{01}`

## 7. 括弧の省略規則

括弧は優先順位と結合性に基づいて省略できる。

**省略可能な場合:**

1. 外側の演算子より優先順位が高い部分式: `$\lnot \varphi \land \psi$` = `$(\lnot \varphi) \land \psi$`
2. 結合性に従う結合: `$\varphi \to \psi \to \chi$` = `$\varphi \to (\psi \to \chi)$`

**省略不可能な場合:**

1. 優先順位に逆らう結合: `$\varphi \land (\psi \lor \chi)$` — 括弧が必要
2. 結合性に逆らう結合: `$(\varphi \to \psi) \to \chi$` — 括弧が必要

**フォーマッター出力:** Unicode/LaTeXフォーマッターは最小限の括弧のみを出力する。

## 8. 論理式（Formula）のAST型一覧

| AST型名         | 説明           | 構造                                           |
| --------------- | -------------- | ---------------------------------------------- |
| `MetaVariable`  | 論理式メタ変数 | `{ name: GreekLetter, subscript?: string }`    |
| `Negation`      | 否定           | `{ formula: Formula }`                         |
| `Implication`   | 含意           | `{ left: Formula, right: Formula }`            |
| `Conjunction`   | 連言           | `{ left: Formula, right: Formula }`            |
| `Disjunction`   | 選言           | `{ left: Formula, right: Formula }`            |
| `Biconditional` | 双条件         | `{ left: Formula, right: Formula }`            |
| `Universal`     | 全称量化       | `{ variable: TermVariable, formula: Formula }` |
| `Existential`   | 存在量化       | `{ variable: TermVariable, formula: Formula }` |
| `Predicate`     | 述語適用       | `{ name: string, args: Term[] }`               |
| `Equality`      | 等号           | `{ left: Term, right: Term }`                  |

## 9. 項（Term）のAST型一覧

| AST型名            | 説明       | 構造                                            |
| ------------------ | ---------- | ----------------------------------------------- |
| `TermVariable`     | 項変数     | `{ name: string }`                              |
| `TermMetaVariable` | 項メタ変数 | `{ name: GreekLetter, subscript?: string }`     |
| `Constant`         | 定数       | `{ name: string }`                              |
| `Function`         | 関数適用   | `{ name: string, args: Term[] }`                |
| `BinaryOperation`  | 二項演算   | `{ operator: string, left: Term, right: Term }` |

## 参考文献

- [高崎研究室 論理学教材](https://www2.yukawa.kyoto-u.ac.jp/~kanehisa.takasaki/edu/logic/logic6.html) — Hilbert系公理の定義
- Enderton, H.B. "A Mathematical Introduction to Logic" (2nd ed., 2001) — 記号・記法の標準的定義
- Mendelson, E. "Introduction to Mathematical Logic" (6th ed., 2015) — Hilbert系の詳細な定義
