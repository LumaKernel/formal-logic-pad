# 述語論理の基礎（一階述語論理）

命題論理（[02-propositional-logic.md](./02-propositional-logic.md)）を拡張し、個体・述語・量化子を導入する。Logic Core (`src/lib/logic-core/`) の述語論理実装の根拠となるリファレンスである。記号・記法の詳細は [01-notation.md](./01-notation.md) を参照。

## 1. 項（Term）の定義

**項**は個体（対象）を表す式である。再帰的に定義する。

### 定義

1. **変数（Variable）**: $x , y , z$, ... は項である
2. **定数（Constant）**: a , $b , c , 0 , 1$, ... は項である
3. **関数適用（Function Application）**: f が n 引数の関数記号で $t_1, \ldots, t_n$ が項ならば、$f(t_1, \ldots, t_n)$ は項である
4. **二項演算（Binary Operation）**: $t_1 , t_2$ が項で $\circ$ が二項演算子（$+ , - , \times , \div , \hat{}$）ならば、$t_1 \circ t_2$ は項である
5. **項メタ変数（Term Meta Variable）**: $\tau , \sigma$, ... は項スキーマを表す

上記以外は項ではない。

### AST対応

| 種別       | AST型名            | 構造                                            | 例                   |
| ---------- | ------------------ | ----------------------------------------------- | -------------------- |
| 変数       | `TermVariable`     | `{ name: string }`                              | x , y                |
| 定数       | `Constant`         | `{ name: string }`                              | $0 , a$              |
| 関数適用   | `Function`         | `{ name: string, args: Term[] }`                | $f(x) , g(x, y)$     |
| 二項演算   | `BinaryOperation`  | `{ operator: string, left: Term, right: Term }` | $x + y , x \times z$ |
| 項メタ変数 | `TermMetaVariable` | `{ name: GreekLetter, subscript?: string }`     | $\tau , \sigma_1$    |

### 具体例

- x — 変数（項）
- $0$ — 定数（項）
- f(x) — 関数適用（1引数）
- g(x, y) — 関数適用（2引数）
- $f(g(x, 0))$ — 入れ子の関数適用
- $x + y \times z$ — 二項演算（$x + (y \times z)$ と解釈、01-notation.md の優先順位参照）

## 2. 述語（Predicate）と原子論理式

### 述語の定義

$P$ が n 引数の述語記号で $t_1, \ldots, t_n$ が項ならば、$P(t_1, \ldots, t_n)$ は**原子論理式（atomic formula）** である。

### 等号

$t_1 , t_2$ が項ならば、$t_1 = t_2$ は原子論理式である（等号付き論理が有効な場合。詳細は 05-equality-logic.md を参照）。

### AST対応

| 種別     | AST型名     | 構造                             | 例                 |
| -------- | ----------- | -------------------------------- | ------------------ |
| 述語適用 | `Predicate` | `{ name: string, args: Term[] }` | $P(x) , Q(x, y)$   |
| 等号     | `Equality`  | `{ left: Term, right: Term }`    | $x = y , f(x) = 0$ |

### 識別子の命名規約

- **大文字で始まる** $\to$ 述語記号: $P , Q , R$
- **小文字で始まる** $\to$ 関数記号・変数・定数: f , x , a , $0$

### 具体例

- $P(x)$ — 「 x は性質 $P$ を持つ」（1引数述語）
- $Q(x, y)$ — 「 x と y は関係 $Q$ にある」（2引数述語）
- $R(f(x), g(x, y))$ — 項が入れ子（述語の引数に関数適用）
- x = y — 等号原子論理式
- $f(x) + g(y) = h(x, y)$ — 等号原子論理式（両辺が二項演算を含む項）

## 3. 一階述語論理の論理式

命題論理の論理式に量化子を追加して拡張する。

### 論理式の再帰的定義

1. **原子論理式**: $P(t_1, \ldots, t_n)$ および $t_1 = t_2$ は論理式である
2. **メタ変数**: $\varphi , \psi , \chi$, ... は論理式スキーマである
3. **否定**: $\varphi$ が論理式ならば $\lnot \varphi$ は論理式である
4. **二項結合子**: $\varphi , \psi$ が論理式ならば $\varphi \to \psi , \varphi \land \psi , \varphi \lor \psi , \varphi \leftrightarrow \psi$ は論理式である
5. **全称量化**: $\varphi$ が論理式で x が変数ならば $\forall x. \varphi$ は論理式である
6. **存在量化**: $\varphi$ が論理式で x が変数ならば $\exists x. \varphi$ は論理式である

上記以外は論理式ではない。

### 具体例

- $P(x)$ — 原子論理式
- $P(x) \to Q(x)$ — 含意
- $\forall x. P(x)$ — 全称量化
- $\exists x. (P(x) \land Q(x, y))$ — 存在量化
- $\forall x. (P(x) \to \exists y. Q(x, y))$ — 入れ子の量化
- $\forall x. \forall y. (Q(x, y) \to Q(y, x))$ — 複数の全称量化

## 4. 自由変数と束縛変数

### 直感的な説明

- **束縛変数（bound variable）**: 量化子によって束縛されている変数。$\forall x. P(x)$ における x は束縛されている
- **自由変数（free variable）**: 量化子に束縛されていない変数。$P(x) \to Q(y)$ における x , y は自由である

### 自由変数集合 $\text{FV}(\varphi)$ の再帰的定義

**項の自由変数:**

\begin{aligned}
\text{FV}(x) &= \{x\} & \text{（変数）} \\
\text{FV}(c) &= \emptyset & \text{（定数）} \\
\text{FV}(f(t_1, \ldots, t_n)) &= \text{FV}(t_1) \cup \cdots \cup \text{FV}(t_n) & \text{（関数適用）} \\
\text{FV}(t_1 \circ t_2) &= \text{FV}(t_1) \cup \text{FV}(t_2) & \text{（二項演算）}
\end{aligned}

**論理式の自由変数:**

\begin{aligned}
\text{FV}(P(t_1, \ldots, t_n)) &= \text{FV}(t_1) \cup \cdots \cup \text{FV}(t_n) & \text{（述語）} \\
\text{FV}(t_1 = t_2) &= \text{FV}(t_1) \cup \text{FV}(t_2) & \text{（等号）} \\
\text{FV}(\lnot \varphi) &= \text{FV}(\varphi) & \text{（否定）} \\
\text{FV}(\varphi \to \psi) &= \text{FV}(\varphi) \cup \text{FV}(\psi) & \text{（含意、他の二項結合子も同様）} \\
\text{FV}(\forall x. \varphi) &= \text{FV}(\varphi) \setminus \{x\} & \text{（全称量化）} \\
\text{FV}(\exists x. \varphi) &= \text{FV}(\varphi) \setminus \{x\} & \text{（存在量化）}
\end{aligned}

### 束縛変数集合 $\text{BV}(\varphi)$ の再帰的定義

\begin{aligned}
\text{BV}(P(t_1, \ldots, t_n)) &= \emptyset & \text{（述語）} \\
\text{BV}(t_1 = t_2) &= \emptyset & \text{（等号）} \\
\text{BV}(\lnot \varphi) &= \text{BV}(\varphi) & \text{（否定）} \\
\text{BV}(\varphi \to \psi) &= \text{BV}(\varphi) \cup \text{BV}(\psi) & \text{（含意、他の二項結合子も同様）} \\
\text{BV}(\forall x. \varphi) &= \text{BV}(\varphi) \cup \{x\} & \text{（全称量化）} \\
\text{BV}(\exists x. \varphi) &= \text{BV}(\varphi) \cup \{x\} & \text{（存在量化）}
\end{aligned}

### 具体例

| 論理式                                   | $\text{FV}$ | $\text{BV}$ | 説明                                    |
| ---------------------------------------- | ----------- | ----------- | --------------------------------------- |
| $P(x, y)$                                | $\{x, y\}$  | $\emptyset$ | 変数はすべて自由                        |
| $\forall x. P(x, y)$                     | $\{y\}$     | $\{x\}$     | x は束縛、 y は自由                     |
| $\forall x. \exists y. Q(x, y)$          | $\emptyset$ | $\{x, y\}$  | すべて束縛（**閉論理式**）              |
| $\forall x. P(x) \to Q(x)$               | $\emptyset$ | $\{x\}$     | スコープはドット右全体、両方の x が束縛 |
| $(\forall x. P(x)) \to Q(x)$             | $\{x\}$     | $\{x\}$     | $Q(x)$ の x は自由（スコープ外）        |
| $\forall x. P(x) \to \exists y. Q(x, y)$ | $\emptyset$ | $\{x, y\}$  | 入れ子の量化                            |
| $P(x) \land \forall x. Q(x)$             | $\{x\}$     | $\{x\}$     | 同じ変数が自由にも束縛にも出現          |

### 閉論理式（文、Sentence）

$\text{FV}(\varphi) = \emptyset$ のとき、$\varphi$ を**閉論理式（closed formula）** または**文（sentence）** と呼ぶ。

**例:**

- $\forall x. P(x)$ — 閉論理式
- $\forall x. \exists y. Q(x, y)$ — 閉論理式
- $P(x) \to Q(y)$ — 閉論理式ではない（ x , y が自由）

### 実装上の注意

同じ変数名が自由にも束縛にも出現しうる（例: $P(x) \land \forall x. Q(x)$）。FVとBVの計算は構造（ASTの位置）に基づいて行う必要があり、単に変数名を集めるだけでは不十分である。

## 5. 項の代入と代入可能性

### 項代入の定義

$\varphi[t/x]$ は論理式 $\varphi$ 中の変数 x の自由な出現をすべて項 t で置き換えた結果を表す。

**項に対する代入:**

\begin{aligned}
x[t/x] &= t \\
y[t/x] &= y & \text{（$y \neq x$ のとき）} \\
c[t/x] &= c & \text{（定数）} \\
f(t_1, \ldots, t_n)[t/x] &= f(t_1[t/x], \ldots, t_n[t/x]) \\
(t_1 \circ t_2)[t/x] &= t_1[t/x] \circ t_2[t/x]
\end{aligned}

**論理式に対する代入:**

\begin{aligned}
P(t_1, \ldots, t_n)[t/x] &= P(t_1[t/x], \ldots, t_n[t/x]) \\
(t_1 = t_2)[t/x] &= t_1[t/x] = t_2[t/x] \\
(\lnot \varphi)[t/x] &= \lnot (\varphi[t/x]) \\
(\varphi \to \psi)[t/x] &= \varphi[t/x] \to \psi[t/x] & \text{（他の二項結合子も同様）} \\
(\forall x. \varphi)[t/x] &= \forall x. \varphi & \text{（ x は束縛されているため代入しない）} \\
(\forall y. \varphi)[t/x] &= \forall y. (\varphi[t/x]) & \text{（$y \neq x$ かつ t が y に対して自由に代入可能な場合）}
\end{aligned}

### 「項 t が x に対して自由に代入可能」の定義

項 t が論理式 $\varphi$ 中の変数 x に対して**自由に代入可能（free for / substitutable）** であるとは、代入 $\varphi[t/x]$ を行ったとき、 t 中の自由変数が $\varphi$ の量化子に捕獲されないことをいう。

**再帰的定義:**

t は $\varphi$ 中の x に対して自由に代入可能 $\Leftrightarrow$

1. $\varphi$ が原子論理式 $\to$ 常に代入可能
2. $\varphi = \lnot \psi \to t$ が $\psi$ 中の x に対して自由に代入可能
3. $\varphi = \psi_1 \to \psi_2$（他の二項結合子も同様） $\to t$ が $\psi_1$ 中の x に対して自由に代入可能 **かつ** t が $\psi_2$ 中の x に対して自由に代入可能
4. $\varphi = \forall y. \psi$（$\exists$ も同様）:
   - $x \notin \text{FV}(\forall y. \psi) \to$ 代入可能（ x が出現しないので代入は不要）
   - $x \in \text{FV}(\forall y. \psi)$ かつ $y \notin \text{FV}(t) \to t$ が $\psi$ 中の x に対して自由に代入可能ならば代入可能
   - $x \in \text{FV}(\forall y. \psi)$ かつ $y \in \text{FV}(t) \to$ **代入不可能**（変数捕獲が発生する）

### 具体例: 代入可能

| 論理式 $\varphi$     | 代入 [t/x] | 結果                 | 代入可能?             |
| -------------------- | ---------- | -------------------- | --------------------- |
| $P(x)$               | [f(y)/x]   | $P(f(y))$            | ✓                     |
| $\forall y. Q(x, y)$ | [z/x]      | $\forall y. Q(z, y)$ | ✓（ z は y と異なる） |
| $P(x) \to Q(y)$      | $[0/x]$    | $P(0) \to Q(y)$      | ✓                     |

### 具体例: 代入不可能（変数捕獲）

| 論理式 $\varphi$        | 代入 [t/x] | 問題                                                  |
| ----------------------- | ---------- | ----------------------------------------------------- |
| $\forall y. Q(x, y)$    | [y/x]      | $\forall y. Q(y, y)$ — y が捕獲される                 |
| $\forall y. R(x, y, z)$ | [f(y)/x]   | $\forall y. R(f(y), y, z)$ — f(y) 中の y が捕獲される |
| $\exists y. (x = y)$    | [y/x]      | $\exists y. (y = y)$ — y が捕獲される                 |

**解決方法:** 変数捕獲が発生する場合、束縛変数をリネーム（**$\alpha$変換**）してから代入する。

- $\forall y. Q(x, y)$ を $\forall w. Q(x, w)$ に$\alpha$変換してから [y/x] を適用 $\to \forall w. Q(y, w)$（正しい結果）

$\alpha$変換と代入の詳細は 04-substitution-and-unification.md を参照。

## 6. 述語論理の公理スキーマ

命題論理の公理A1〜A3（[02-propositional-logic.md](./02-propositional-logic.md) 参照）に加え、量化子に関する公理を追加する。

### A4: 全称量化の除去（全称例化、Universal Instantiation）

\forall x. \varphi(x) \to \varphi(t)

ただし、項 t が $\varphi$ 中の x に対して**自由に代入可能**であること。

**直感的な意味:** 「すべての x について $\varphi(x)$ が成り立つ」ならば、具体的な項 t を代入しても $\varphi(t)$ が成り立つ。

**$\varphi(x) , \varphi(t)$ の記法について:** $\varphi(x)$ は $\varphi$ が変数 x を自由変数として含むことを明示する記法であり、$\varphi(t)$ は $\varphi$ 中の x の自由な出現を t で置換した結果 $\varphi[t/x]$ を表す。

**具体例:**

| 代入                                | A4のインスタンス                                 |
| ----------------------------------- | ------------------------------------------------ |
| $\varphi := P(x) , t := a$          | $\forall x. P(x) \to P(a)$                       |
| $\varphi := Q(x, y) , t := f(z)$    | $\forall x. Q(x, y) \to Q(f(z), y)$              |
| $\varphi := P(x) \to Q(x) , t := 0$ | $\forall x. (P(x) \to Q(x)) \to (P(0) \to Q(0))$ |

**不正な例（代入不可能）:**

$\forall x. \forall y. Q(x, y) \to \forall y. Q(y, y)$ — ここで $t := y$ は $\forall y. Q(x, y)$ 中の x に対して自由に代入可能ではない（ y が捕獲される）。

### A5: 全称量化と含意の分配

\forall x. (\varphi \to \psi) \to (\varphi \to \forall x. \psi)

ただし、$x \notin \text{FV}(\varphi)$（ x が $\varphi$ 中に自由に出現しないこと）。

**直感的な意味:** 「すべての x について、$\varphi$ ならば $\psi(x)$」が成り立つとき、$\varphi$ が x に依存しなければ、「$\varphi$ ならば、すべての x について $\psi(x)$」と書き換えられる。

**制約 $x \notin \text{FV}(\varphi)$ の必要性:** もし $\varphi$ が x を自由変数として含むならば、$\varphi$ の真偽は x に依存するため、$\forall x$ のスコープ外に $\varphi$ を移動することはできない。

**具体例:**

| 条件                                                        | A5のインスタンス                                                  |
| ----------------------------------------------------------- | ----------------------------------------------------------------- |
| $\varphi := P(y) , \psi := Q(x) , x \notin \text{FV}(P(y))$ | $\forall x. (P(y) \to Q(x)) \to (P(y) \to \forall x. Q(x))$       |
| $\varphi := R(a) , \psi := S(x, y)$                         | $\forall x. (R(a) \to S(x, y)) \to (R(a) \to \forall x. S(x, y))$ |

**不正な例:**

$\forall x. (P(x) \to Q(x)) \to (P(x) \to \forall x. Q(x))$ — $x \in \text{FV}(P(x))$ なので制約違反。

### 公理の一覧（述語論理全体）

| 公理 | 名称             | スキーマ                                                                        | 制約                                         |
| ---- | ---------------- | ------------------------------------------------------------------------------- | -------------------------------------------- |
| A1   | K公理            | $\varphi \to (\psi \to \varphi)$                                                | なし                                         |
| A2   | S公理            | $(\varphi \to (\psi \to \chi)) \to ((\varphi \to \psi) \to (\varphi \to \chi))$ | なし                                         |
| A3   | 対偶公理         | $(\lnot \varphi \to \lnot \psi) \to (\psi \to \varphi)$                         | なし                                         |
| A4   | 全称例化         | $\forall x. \varphi \to \varphi[t/x]$                                           | t が $\varphi$ 中の x に対して自由に代入可能 |
| A5   | 全称と含意の分配 | $\forall x. (\varphi \to \psi) \to (\varphi \to \forall x. \psi)$               | $x \notin \text{FV}(\varphi)$                |

## 7. 推論規則

### Modus Ponens (MP)

命題論理と同じ。

\frac{\varphi \qquad \varphi \to \psi}{\psi} \quad (\text{MP})

### 汎化規則（Generalization, Gen）

\frac{\varphi}{\forall x. \varphi} \quad (\text{Gen})

**直感的な意味:** $\varphi$ が（特定の x に依存しない形で）証明されているならば、$\forall x. \varphi$ も成り立つ。

**重要な制約:** 汎化規則は仮定に対して自由な変数に適用する場合に注意が必要である。

- 仮定なしの証明（定理の証明）: 自由に適用可能
- 仮定 $\Gamma$ からの証明: x が $\Gamma$ のいずれの仮定にも自由に出現しない場合のみ適用可能

**具体例:**

1. $P(x) \to P(x)$ が定理（仮定なし）として証明済みの場合 $\to \forall x. (P(x) \to P(x))$ を導出可能
2. 仮定 $\{P(x)\}$ から $P(x)$ を導出した場合 $\to \forall x. P(x)$ の導出は**不正**（ x が仮定 $P(x)$ に自由出現している）

### 推論規則の一覧（述語論理全体）

| 規則         | ラベル | 前提数 | 定義                                                   |
| ------------ | ------ | ------ | ------------------------------------------------------ |
| Modus Ponens | MP     | 2      | $\alpha$ と $\alpha \to \beta$ から $\beta$ を導出     |
| 汎化         | Gen    | 1      | $\varphi$ から $\forall x. \varphi$ を導出（制約あり） |

## 8. 述語論理の証明例

### 例1: $\forall x. P(x) \to P(a)$

これはA4の直接のインスタンスである。

\forall x. P(x) \to P(a) \quad \text{（A4: } \varphi := P(x),\ t := a\text{）}

### 例2: $\forall x. (P(x) \to Q(x)) \to (\forall x. P(x) \to \forall x. Q(x)) \forall x$ が含意の両辺に分配できることを示す。

| ステップ | 式                                                                     | 根拠                                              |
| -------- | ---------------------------------------------------------------------- | ------------------------------------------------- |
| 1        | $\forall x. (P(x) \to Q(x)) \to (P(x) \to Q(x))$                       | A4: $\varphi := P(x) \to Q(x) , t := x$           |
| 2        | $\forall x. P(x) \to P(x)$                                             | A4: $\varphi := P(x) , t := x$                    |
| 3        | $\forall x. (P(x) \to Q(x)) \to (\forall x. P(x) \to Q(x))$            | A1, A2, MP を使った組み合わせ（ステップ1と2から） |
| 4        | $\forall x. (P(x) \to Q(x)) \to (\forall x. P(x) \to \forall x. Q(x))$ | A5, Gen を使った帰結（ステップ3から）             |

**注:** 完全な形式的証明は多くのステップを要する。ここでは証明の骨格を示す。

### 例3: 汎化規則の使用

$P(x) \to P(x)$ は命題論理の定理（[02-propositional-logic.md](./02-propositional-logic.md) セクション5参照）であるから：

\frac{P(x) \to P(x)}{\forall x. (P(x) \to P(x))} \quad (\text{Gen})

## 9. 存在量化子の扱い

本プロジェクトでは存在量化子 $\exists$ は否定と全称量化子を用いて定義として導入できる。

### 定義

\exists x. \varphi \equiv \lnot \forall x. \lnot \varphi

**直感的な意味:** 「$\varphi(x)$ を満たす x が存在する」は「すべての x について $\varphi(x)$ でない、ということはない」と同値。

### 存在量化に関する派生的な規則

上記の定義とA1〜A5から以下が導出可能：

- **存在導入:** $\varphi[t/x] \to \exists x. \varphi$（ t が $\varphi$ 中の x に対して自由に代入可能な場合）
- **存在除去:** $\forall x. (\varphi \to \psi) \to (\exists x. \varphi \to \psi)$（$x \notin \text{FV}(\psi)$ の場合）

### 実装上の注意

AST上では `Existential` を独立したノード型として持つ（入力の便宜のため）。公理体系としては $\exists$ は定義として導入されるが、UI上ではユーザーが直接 $\exists$ を使えるようにする。内部的には必要に応じて $\lnot \forall x. \lnot \varphi$ に展開する。

## 参考文献

- [高崎研究室 論理学教材](https://www2.yukawa.kyoto-u.ac.jp/~kanehisa.takasaki/edu/logic/logic6.html) — 述語論理の公理体系の出典
- Enderton, H.B. "A Mathematical Introduction to Logic" (2nd ed., 2001) — 述語論理の厳密な定義、自由変数・束縛変数の再帰的定義
- Mendelson, E. "Introduction to Mathematical Logic" (6th ed., 2015) — Hilbert系述語論理の公理A4, A5と汎化規則の定義
- Shoenfield, J.R. "Mathematical Logic" (1967) — 代入可能性と変数捕獲の詳細な取り扱い
