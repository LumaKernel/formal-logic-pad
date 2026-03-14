# 等号付き論理（Equality Logic）

述語論理（[03-predicate-logic.md](./03-predicate-logic.md)）にオプション機能として等号を追加する体系を定義する。等号は項と項の間の関係を表し、専用の公理群によって支配される。記号・記法は [01-notation.md](./01-notation.md)、代入の定義は [04-substitution-and-unification.md](./04-substitution-and-unification.md) を参照。

## 1. 等号の構文的位置づけ

### 1.1 等号は論理式を生成する

等号 $=$ は2つの**項**を受け取り、**論理式**（原子論理式）を生成する。述語とは異なり、等号は特別な扱いを受ける。

 t_1 = t_2 

ここで $t_1 , t_2$ は項（Term）である。

### AST対応

| 構文        | AST型名    | 構造                          | 例                  |
| ----------- | ---------- | ----------------------------- | ------------------- |
| $t_1 = t_2$ | `Equality` | `{ left: Term, right: Term }` |  x = y , $f(x) = 0$ |

**注意:** `Equality` は `Predicate` とは異なるASTノードである。述語 $P(t_1, t_2)$ は引数のリストを受け取るが、等号は常に正確に2つの項を取る。

### 1.2 等号と述語の違い

| 観点         | 等号 ( = )                    | 述語 ($P$)             |
| ------------ | ----------------------------- | ---------------------- |
| AST型名      | `Equality`                    | `Predicate`            |
| 引数         | 常に2つの項                   | 任意個の項             |
| 公理         | 体系に組み込み（下記参照）    | ユーザ定義（公理なし） |
| オプション性 | 体系設定で有効/無効を切り替え | 常に利用可能           |
| 記法         | 中置: $t_1 = t_2$             | 前置: $P(t_1, t_2)$    |

## 2. 等号公理

等号付き論理では、以下の公理スキーマが体系に追加される。これらは推論規則 `EqualityAxiom` として実装される。

### 2.1 反射律（Reflexivity）

 \forall x. \; x = x \tag{E1} 

任意の項は自分自身と等しい。

**具体例:**

- $0 = 0$（定数の場合）
- $f(x) = f(x)$（関数適用の場合）
- $x + y = x + y$（二項演算の場合）

**スキーマとしての使用:** 任意の項  t  に対して、公理A4（全称例化）を用いて  t = t  を導出できる。

 \frac{\forall x. \; x = x}{t = t} \quad (\text{A4, } x \mapsto t) 

### 2.2 対称律（Symmetry）

 \forall x. \forall y. \; x = y \to y = x \tag{E2} 

等号の左辺と右辺を入れ替えても成り立つ。

**具体例:**

- $a = b \to b = a$
- $f(x) = g(y) \to g(y) = f(x)$

### 2.3 推移律（Transitivity）

 \forall x. \forall y. \forall z. \; x = y \land y = z \to x = z \tag{E3} 

等号は推移的な関係である。

**具体例:**

- $a = b \land b = c \to a = c$
- 連鎖: $t_1 = t_2 , t_2 = t_3 , t_3 = t_4$ から $t_1 = t_4$ を導出可能

**注意:** E1, E2, E3 の3つは等号が**同値関係（equivalence relation）**であることを規定する。

### 2.4 関数に関する合同律（Congruence for Functions）

 n  引数の関数記号  f  ごとに:

 \forall x_1. \forall y_1. \cdots \forall x_n. \forall y_n. \; x_1 = y_1 \land \cdots \land x_n = y_n \to f(x_1, \ldots, x_n) = f(y_1, \ldots, y_n) \tag{E4} 

等しい引数に関数を適用すると、結果も等しい。

**具体例（1引数関数）:**

 \forall x. \forall y. \; x = y \to f(x) = f(y) 

- $a = b \to f(a) = f(b)$

**具体例（2引数関数）:**

 \forall x_1. \forall y_1. \forall x_2. \forall y_2. \; x_1 = y_1 \land x_2 = y_2 \to g(x_1, x_2) = g(y_1, y_2) 

- $a = b \land c = d \to g(a, c) = g(b, d)$

**二項演算への適用:** 二項演算子 $\circ \in \{+, -, \times, \div, \hat{}\}$ も2引数の関数と見なせるため、同様の合同律が成り立つ:

 \forall x_1. \forall y_1. \forall x_2. \forall y_2. \; x_1 = y_1 \land x_2 = y_2 \to x_1 \circ x_2 = y_1 \circ y_2 

**具体例:**

- $a = b \land c = d \to a + c = b + d$

### 2.5 述語に関する合同律（Congruence for Predicates）

 n  引数の述語記号 $P$ ごとに:

 \forall x_1. \forall y_1. \cdots \forall x_n. \forall y_n. \; x_1 = y_1 \land \cdots \land x_n = y_n \to (P(x_1, \ldots, x_n) \to P(y_1, \ldots, y_n)) \tag{E5} 

等しい引数を述語に渡すと、述語の真偽が保存される。

**具体例（1引数述語）:**

 \forall x. \forall y. \; x = y \to (P(x) \to P(y)) 

- $a = b \to (P(a) \to P(b))$

**具体例（2引数述語）:**

 \forall x_1. \forall y_1. \forall x_2. \forall y_2. \; x_1 = y_1 \land x_2 = y_2 \to (R(x_1, x_2) \to R(y_1, y_2)) 

- $a = b \land c = d \to (R(a, c) \to R(b, d))$

**注意:** E5 は片方向の含意（$\to$）のみを述べている。逆方向（$P(y_1, \ldots) \to P(x_1, \ldots)$）は E2（対称律）と組み合わせて導出できる。

### 2.6 公理一覧

| 公理 | 名称       | スキーマ                                                          | 対象           |
| ---- | ---------- | ----------------------------------------------------------------- | -------------- |
| E1   | 反射律     | $\forall x. \; x = x$                                             | 等号の基本性質 |
| E2   | 対称律     | $\forall x. \forall y. \; x = y \to y = x$                        | 等号の基本性質 |
| E3   | 推移律     | $\forall x. \forall y. \forall z. \; x = y \land y = z \to x = z$ | 等号の基本性質 |
| E4   | 関数合同律 | 各関数記号  f  ごとに定義（上記参照）                             | 関数記号       |
| E5   | 述語合同律 | 各述語記号 $P$ ごとに定義（上記参照）                             | 述語記号       |

## 3. 代入律（Substitution Law for Equality）

E4 と E5 の合同律を一般化したものが**代入律**（Leibnizの法則とも呼ばれる）である。

### 3.1 定義

 t_1 = t_2 \to \varphi[t_1/x] \to \varphi[t_2/x] \tag{Subst} 

ここで:

- $t_1 , t_2$ は項
- $\varphi$ は論理式
-  x  は項変数
- $\varphi[t/x]$ は $\varphi$ 中の  x  の自由な出現を  t  で置換した論理式（[04-substitution-and-unification.md](./04-substitution-and-unification.md) 参照）

### 3.2 意味

「$t_1$ と $t_2$ が等しいならば、$\varphi$ 中の  x  を $t_1$ で置き換えた式が成り立つとき、$t_2$ で置き換えた式も成り立つ」

### 3.3 E4, E5 との関係

代入律は E4 と E5 を包含する:

- **E4 の導出:** $\varphi$ として $f(\ldots, x, \ldots) = f(\ldots, x, \ldots)$ を選ぶ
- **E5 の導出:** $\varphi$ として $P(\ldots, x, \ldots)$ を選ぶ

逆に、E4 + E5 が与えられれば、構造帰納法により任意の論理式について代入律を証明できる。したがって、以下の2つのアプローチは同値である:

| アプローチ   | 公理                   | 特徴                                |
| ------------ | ---------------------- | ----------------------------------- |
| 個別公理方式 | E1 + E2 + E3 + E4 + E5 | 各記号ごとに公理を列挙。直感的      |
| 代入律方式   | E1 + E2 + E3 + Subst   | 1つの汎用公理。簡潔だが抽象度が高い |

**本プロジェクトでの採用:** 個別公理方式（E1〜E5）を基本とし、代入律は導出可能な定理として扱う。実装上は `EqualityAxiom` の種類として E1〜E5 を列挙する。

### 3.4 具体例

**例1:** $a = b \to (a + c = a + c) \to (a + c = b + c)$

- $\varphi$: $a + c = x + c$（ただし、ここでは右辺の  a  を  x  に一般化）
- より正確には: $t_1 = a , t_2 = b , \varphi = (x + c = d)$ として使う
- 実際には E4 の方が直接的

**例2:** $a = b \to P(a) \to P(b)$

- $\varphi = P(x) , t_1 = a , t_2 = b , x = x$
- $P(x)[a/x] = P(a) , P(x)[b/x] = P(b)$

## 4. 等号を含む証明の具体例

### 4.1 対称律の別証明

反射律 (E1) と代入律 (Subst) を使って対称律 (E2) を導出する。

**目標:** $x = y \to y = x$

**証明:**

1. $\forall z. \; z = z$ — E1（反射律）
2.  x = x  — 1 + A4（全称例化, $z \mapsto x$）
3. $x = y \to (x = x \to y = x)$ — Subst の $\varphi = (z = x) , t_1 = x , t_2 = y$, 変数  z  に対する適用
4.  x = y  — 仮定
5. $x = x \to y = x$ — 3, 4 + MP
6.  y = x  — 2, 5 + MP

### 4.2 等号の推移性を使った証明

**目標:**  a = b ,  b = c ,  c = d  から  a = d  を導出する。

**証明:**

1.  a = b  — 仮定
2.  b = c  — 仮定
3.  c = d  — 仮定
4. $a = b \land b = c \to a = c$ — E3（推移律, 全称例化）
5.  a = c  — 1, 2, 4 + MP（連言導入 + MP）
6. $a = c \land c = d \to a = d$ — E3（推移律, 全称例化）
7.  a = d  — 5, 3, 6 + MP（連言導入 + MP）

### 4.3 関数適用への等号伝播

**目標:**  a = b  から $f(a) = f(b)$ を導出する。

**証明:**

1.  a = b  — 仮定
2. $\forall x. \forall y. \; x = y \to f(x) = f(y)$ — E4（1引数関数  f  の合同律）
3. $a = b \to f(a) = f(b)$ — 2 + A4（二重の全称例化, $x \mapsto a , y \mapsto b$）
4. $f(a) = f(b)$ — 1, 3 + MP

### 4.4 算術的な例

**目標:**  x = y  から $x + z = y + z$ を導出する（加法の右辺が同じ場合）。

**証明:**

1.  x = y  — 仮定
2. $\forall u. \forall v. \forall w_1. \forall w_2. \; u = v \land w_1 = w_2 \to u + w_1 = v + w_2$ — E4（$+$ の合同律）
3. $x = y \land z = z \to x + z = y + z$ — 2 + A4（$u \mapsto x , v \mapsto y , w_1 \mapsto z , w_2 \mapsto z$）
4.  z = z  — E1 + A4（反射律の例化）
5. $x = y \land z = z$ — 1, 4（連言導入）
6. $x + z = y + z$ — 3, 5 + MP

## 5. オプション機能としての設計指針

### 5.1 体系設定（LogicSystem）

等号付き論理は体系設定で有効/無効を切り替える。

```
LogicSystem {
  equalityEnabled: boolean  // 等号公理を含むかどうか
  // ... 他の設定
}
```

### 5.2 有効/無効による違い

| 機能                 | `equalityEnabled: true` | `equalityEnabled: false`   |
| -------------------- | ----------------------- | -------------------------- |
| `Equality` ASTノード | 使用可能                | **構文エラー**として拒否   |
| 等号公理 E1〜E5      | 推論規則として利用可能  | 利用不可                   |
| `EqualityAxiom` 規則 | 有効                    | **検証エラー**として拒否   |
| DSLでの `=` 記号     | 等号として解析          | **パースエラー**として拒否 |
| フォーマッター       | `=` を出力              | 出現しない                 |

### 5.3 実装上の注意

1. **ASTレベルでの制御:** `Equality` ノードは AST の型定義には常に含まれるが、体系設定が無効の場合はバリデーション段階で拒否する。型定義から除外すると等号なし/ありで異なるAST型が必要になり複雑化する
2. **公理スキーマの動的生成:** E4 と E5 は体系に登場する関数記号・述語記号ごとに生成する必要がある。体系に含まれるシグネチャ（関数記号と述語記号の一覧とアリティ）に基づいて公理を生成する
3. **証明検証:** 等号公理が無効な体系で `EqualityAxiom` を使った証明ステップがあれば、検証エラーとする
4. **段階的導入:** まず等号なしの体系を完全に実装し、その後等号公理を追加する形で拡張する

### 5.4 シグネチャとの関係

E4, E5 の公理は体系のシグネチャに依存する:

```
Signature {
  functions: Map<string, number>   // 関数記号 $\to$ アリティ
  predicates: Map<string, number>  // 述語記号 $\to$ アリティ
}
```

各関数記号  f  の合同律（E4）:

-  f  のアリティが  n  のとき、$2n$ 個の全称量化子を持つ公理を生成

各述語記号 $P$ の合同律（E5）:

- $P$ のアリティが  n  のとき、$2n$ 個の全称量化子を持つ公理を生成

**二項演算子の扱い:** 二項演算子（$+ , - , \times , \div , \hat{}$）はアリティ2の関数記号として扱う。シグネチャに個別に登録してもよいし、組み込みとして自動的に合同律を生成してもよい。

## 6. 等号付き論理の理論的背景

### 6.1 等号付き一階述語論理の完全性

Gödel の完全性定理は等号付き一階述語論理にも拡張される。ただし、モデル理論的意味論では等号は**常に恒等関係として解釈**される（正規モデル）。

### 6.2 等号と他のアプローチ

| アプローチ               | 等号の扱い                | 特徴                       |
| ------------------------ | ------------------------- | -------------------------- |
| 公理的（本プロジェクト） | 専用公理 E1〜E5 で規定    | 証明系に自然に統合         |
| 組み込み等号             | 推論規則レベルで組み込み  | パラモジュレーション等     |
| 等号なし                 | 等号を2引数述語として定義 | 合同律は個別に公理化が必要 |

本プロジェクトでは公理的アプローチを採用し、等号を特別なASTノード + 専用公理として扱う。

## 参考文献

- Enderton, H.B. "A Mathematical Introduction to Logic" (2nd ed., 2001), Chapter 2.7 — 等号付き一階述語論理の公理
- Mendelson, E. "Introduction to Mathematical Logic" (6th ed., 2015), Chapter 2 — 等号公理の体系的な扱い
- [高崎研究室 論理学教材](https://www2.yukawa.kyoto-u.ac.jp/~kanehisa.takasaki/edu/logic/logic6.html) — Hilbert系の等号公理
- [Stanford Encyclopedia of Philosophy - Identity](https://plato.stanford.edu/entries/identity/) — 等号（同一性）の哲学的・論理学的背景
