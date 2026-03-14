# 代入とユニフィケーション

本プロジェクトの証明検証・公理インスタンス化で中心的な役割を果たす代入（Substitution）操作と、パターンマッチに使われるユニフィケーション（Unification）を定義する。記号・記法は [01-notation.md](./01-notation.md)、自由変数・束縛変数の定義は [03-predicate-logic.md](./03-predicate-logic.md) を参照。

## 1. 代入の2つのレベル

本プロジェクトでは**2種類の代入**を扱う。この区別は実装上きわめて重要である。

### 1.1 メタ変数代入（Schema-level Substitution）

**メタ変数**（ギリシャ文字 $\varphi , \psi , \tau$ 等）に論理式スキーマや項スキーマを代入する操作。公理スキーマから具体的な公理インスタンスを生成する際に使用する。

- **論理式メタ変数代入:** $\varphi[\psi/\alpha]$ — メタ変数 $\alpha$ を論理式スキーマ $\psi$ で置換
- **項メタ変数代入:** $t[\sigma/\tau]$ — 項メタ変数 $\tau$ を項スキーマ $\sigma$ で置換

### 1.2 項変数代入（Object-level Substitution）

**項変数**（ x ,  y ,  z  等）に項を代入する操作。全称量化の除去（公理A4）で使用する。

- **項変数代入:** $\varphi[t/x]$ — 項変数  x  の自由な出現を項  t  で置換

### 区別の一覧

| 種別           | 記法                   | 対象               | 使用場面                     | 変数捕獲のリスク |
| -------------- | ---------------------- | ------------------ | ---------------------------- | ---------------- |
| 論理式メタ代入 | $\varphi[\psi/\alpha]$ | `MetaVariable`     | 公理スキーマのインスタンス化 | なし             |
| 項メタ代入     | $t[\sigma/\tau]$       | `TermMetaVariable` | 公理スキーマのインスタンス化 | なし             |
| 項変数代入     | $\varphi[t/x]$         | `TermVariable`     | 公理A4（全称例化）           | **あり**         |

**重要:** メタ変数代入では変数捕獲は発生しない（メタ変数は量化子のスコープと無関係に機械的に置換される）。変数捕獲が問題になるのは項変数代入のみ。

## 2. メタ変数代入の再帰的定義

### 2.1 論理式メタ変数代入 $\varphi[\psi/\alpha]$

論理式スキーマ $\varphi$ 中のメタ変数 $\alpha$ の**すべての出現**を論理式スキーマ $\psi$ で置換する。

 
\begin{aligned}
\alpha[\psi/\alpha] &= \psi \\
\beta[\psi/\alpha] &= \beta & \text{（$\beta \neq \alpha$ のとき、メタ変数）} \\
(\lnot \varphi)[\psi/\alpha] &= \lnot (\varphi[\psi/\alpha]) \\
(\varphi_1 \to \varphi_2)[\psi/\alpha] &= \varphi_1[\psi/\alpha] \to \varphi_2[\psi/\alpha] & \text{（他の二項結合子も同様）} \\
(\forall x. \varphi)[\psi/\alpha] &= \forall x. (\varphi[\psi/\alpha]) & \text{（量化子を素通りする）} \\
(\exists x. \varphi)[\psi/\alpha] &= \exists x. (\varphi[\psi/\alpha]) \\
P(t_1, \ldots, t_n)[\psi/\alpha] &= P(t_1, \ldots, t_n) & \text{（述語は論理式メタ変数を含まない）} \\
(t_1 = t_2)[\psi/\alpha] &= t_1 = t_2 & \text{（等号も同様）}
\end{aligned}
 

**ポイント:** メタ変数代入は量化子のスコープを**無視**して機械的に置換する。束縛変数との衝突を考慮する必要はない。

### 2.2 項メタ変数代入

項中の項メタ変数 $\tau$ を項 $\sigma$ で置換する。論理式中の項にも再帰的に適用する。

 
\begin{aligned}
\tau[\sigma/\tau] &= \sigma \\
\upsilon[\sigma/\tau] &= \upsilon & \text{（$\upsilon \neq \tau$ のとき、項メタ変数）} \\
x[\sigma/\tau] &= x & \text{（項変数は変化しない）} \\
c[\sigma/\tau] &= c & \text{（定数は変化しない）} \\
f(t_1, \ldots, t_n)[\sigma/\tau] &= f(t_1[\sigma/\tau], \ldots, t_n[\sigma/\tau]) \\
(t_1 \circ t_2)[\sigma/\tau] &= t_1[\sigma/\tau] \circ t_2[\sigma/\tau]
\end{aligned}
 

論理式中の項メタ変数代入は、論理式のASTを走査し、項を含むノード（述語、等号、量化子の束縛変数を除く）の中で上記を適用する。

### 2.3 具体例

**例1: 公理A1のインスタンス化**

A1スキーマ: $\varphi \to (\psi \to \varphi)$

代入 $\sigma = \{\varphi \mapsto P(x),\ \psi \mapsto Q(x, y)\}$:

 (\varphi \to (\psi \to \varphi))[\sigma] = P(x) \to (Q(x, y) \to P(x)) 

**例2: 項メタ変数を含むスキーマ**

スキーマ: $P(\tau) \to P(\tau)$

代入 $\{\tau \mapsto f(x, 0)\}$:

 P(\tau) \to P(\tau) \xrightarrow{\tau \mapsto f(x,0)} P(f(x, 0)) \to P(f(x, 0)) 

**例3: 複合代入**

A4スキーマ: $\forall x. \varphi \to \varphi[t/x]$

まずメタ変数代入 $\{\varphi \mapsto P(x) \land Q(x)\}$、次に項変数代入  [a/x] :

 \forall x. (P(x) \land Q(x)) \to (P(a) \land Q(a)) 

## 3. 項変数代入の再帰的定義

03-predicate-logic.md セクション5で基本を定義した。ここでは全ASTノードについて完全な定義を与える。

### 3.1 項に対する代入  t[s/x] 

 
\begin{aligned}
x[s/x] &= s \\
y[s/x] &= y & \text{（$y \neq x$）} \\
c[s/x] &= c & \text{（定数）} \\
\tau[s/x] &= \tau & \text{（項メタ変数は項変数代入の対象外）} \\
f(t_1, \ldots, t_n)[s/x] &= f(t_1[s/x], \ldots, t_n[s/x]) \\
(t_1 \circ t_2)[s/x] &= t_1[s/x] \circ t_2[s/x]
\end{aligned}
 

### 3.2 論理式に対する代入 $\varphi[s/x]$

 
\begin{aligned}
\alpha[s/x] &= \alpha & \text{（論理式メタ変数は項変数代入の対象外）} \\
P(t_1, \ldots, t_n)[s/x] &= P(t_1[s/x], \ldots, t_n[s/x]) \\
(t_1 = t_2)[s/x] &= t_1[s/x] = t_2[s/x] \\
(\lnot \varphi)[s/x] &= \lnot (\varphi[s/x]) \\
(\varphi_1 \to \varphi_2)[s/x] &= \varphi_1[s/x] \to \varphi_2[s/x] & \text{（他の二項結合子も同様）} \\
(\forall x. \varphi)[s/x] &= \forall x. \varphi & \text{（ x  は束縛$\to$代入しない）} \\
(\forall y. \varphi)[s/x] &= \forall y. (\varphi[s/x]) & \text{（$y \neq x$、 s  が  y  に対して代入可能な場合）} \\
(\exists x. \varphi)[s/x] &= \exists x. \varphi & \text{（ x  は束縛$\to$代入しない）} \\
(\exists y. \varphi)[s/x] &= \exists y. (\varphi[s/x]) & \text{（$y \neq x$、 s  が  y  に対して代入可能な場合）}
\end{aligned}
 

## 4. 変数捕獲（Variable Capture）

### 4.1 問題の説明

項変数代入 $\varphi[t/x]$ を行う際、 t  に含まれる自由変数が $\varphi$ の量化子に**捕獲**される危険がある。

**具体例:**

$\forall y. (x = y)$ に  [y/x]  を素朴に適用すると:

 \forall y. (x = y) \xrightarrow{[y/x]} \forall y. (y = y) 

- **代入前:** 「すべての  y  について、 x  は  y  に等しい」（ x  は自由、外部から与えられる特定の値）
- **代入後:** 「すべての  y  について、 y  は  y  に等しい」（恒真式になってしまう）

意味が変わってしまう。これが**変数捕獲**である。

### 4.2 代入可能性の判定アルゴリズム

項  t  が論理式 $\varphi$ 中の  x  に対して自由に代入可能かどうかを判定する再帰的アルゴリズム（03-predicate-logic.md セクション5.2 の再帰的定義に対応）:

```
isFreeFor(t, x, $\varphi$):
  match $\varphi$:
    // 原子論理式: 常に代入可能
    case Predicate(_, _) | Equality(_, _):
      return true

    // 論理式メタ変数: 常に代入可能（項変数を含まない）
    case MetaVariable(_):
      return true

    // 否定: 内部を再帰的にチェック
    case Negation($\psi$):
      return isFreeFor(t, x, $\psi$)

    // 二項結合子: 両方を再帰的にチェック
    case Implication($\psi$₁, $\psi$₂) | Conjunction(...) | Disjunction(...) | Biconditional(...):
      return isFreeFor(t, x, $\psi$₁) && isFreeFor(t, x, $\psi$₂)

    // 量化子: 核心部分
    case Universal(y, $\psi$) | Existential(y, $\psi$):
      if x ∉ FV($\varphi$):
        return true       // x が出現しないので代入不要
      if y ∈ FV(t):
        return false      // 変数捕獲が発生する
      return isFreeFor(t, x, $\psi$)
```

### 4.3 $\alpha$変換（$\alpha$-conversion / $\alpha$-renaming）

変数捕獲を回避するため、束縛変数をリネームする操作を**$\alpha$変換**と呼ぶ。

 \forall y. \varphi \equiv_\alpha \forall z. \varphi[z/y] 

ただし  z  は $\varphi$ に出現しない**新鮮な変数（fresh variable）** である。

**例:**

$\forall y. (x = y)$ に  [y/x]  を適用したい場合:

1. $\alpha$変換: $\forall y. (x = y) \to \forall w. (x = w)$（ w  は新鮮）
2. 代入: $\forall w. (x = w)[y/x] = \forall w. (y = w)$（正しい結果）

### 4.4 具体例一覧

| 論理式                             | 代入          | 捕獲? | 説明                                                                    |
| ---------------------------------- | ------------- | ----- | ----------------------------------------------------------------------- |
| $P(x) \to Q(y)$                    |  [z/x]        | ✗     | 量化子なし                                                              |
| $\forall y. Q(x, y)$               |  [z/x]        | ✗     | $z \notin \{y\}$                                                        |
| $\forall y. Q(x, y)$               |  [y/x]        | ✓     | $y \in \text{FV}(y) = \{y\}$、束縛変数と衝突                            |
| $\forall y. Q(x, y)$               |  [f(y)/x]     | ✓     | $y \in \text{FV}(f(y)) = \{y\}$                                         |
| $\forall y. \exists z. R(x, y, z)$ |  [g(y, z)/x]  | ✓     | $\{y, z\} \cap \{y, z\} \neq \emptyset$                                 |
| $\forall y. P(y) \to Q(x)$         |  [y/x]        | ✓     | $P(y)$ 中の  x  はないが $Q(x)$ 中の  x  を代入する際に  y  が捕獲      |
| $(\forall y. P(y)) \to Q(x)$       |  [y/x]        | ✗     | $x \notin \text{FV}(\forall y. P(y))$ なので $\forall y$ の中に入らない |

**最後の2例の違いに注意:** スコープの違いにより結果が異なる。$\forall y. P(y) \to Q(x)$ では $Q(x)$ が $\forall y$ のスコープ内だが、$(\forall y. P(y)) \to Q(x)$ では $Q(x)$ がスコープ外。

## 5. 代入の表現と合成

### 5.1 代入の表現

代入を変数から式へのマッピングとして表現する。

**メタ変数代入:**

 \sigma = \{\alpha_1 \mapsto \psi_1,\ \alpha_2 \mapsto \psi_2,\ \ldots,\ \alpha_n \mapsto \psi_n\} 

$\sigma$ の**定義域（domain）**: $\text{dom}(\sigma) = \{\alpha_1, \ldots, \alpha_n\}$

**項変数代入:**

 \theta = \{x_1 \mapsto t_1,\ x_2 \mapsto t_2,\ \ldots,\ x_m \mapsto t_m\} 

**空代入:** $\epsilon = \{\}$ — すべての変数を変化させない恒等代入。

### 5.2 代入の適用

代入 $\sigma$ を式 $\varphi$ に適用する記法:

- $\varphi \sigma$ または $\sigma(\varphi)$

複数のメタ変数を含む代入は同時に適用する:

 (\varphi \to (\psi \to \varphi))\{\varphi \mapsto P(x),\ \psi \mapsto Q(y)\} = P(x) \to (Q(y) \to P(x)) 

**重要:** 同時適用であって、逐次適用ではない。逐次適用すると結果が異なる場合がある。

**例（逐次適用との違い）:**

$\sigma_1 = \{\varphi \mapsto \psi \}$、$\sigma_2 = \{\psi \mapsto P(x)\}$

- 同時適用 $\{\varphi \mapsto \psi,\ \psi \mapsto P(x)\}$ を $(\varphi \to \psi)$ に適用: $\psi \to P(x)$
- 逐次適用 $\sigma_1$ 後 $\sigma_2$: $(\varphi \to \psi) \xrightarrow{\sigma_1} (\psi \to \psi) \xrightarrow{\sigma_2} (P(x) \to P(x))$ — **異なる結果**

### 5.3 代入の合成

2つの代入 $\sigma_1$ と $\sigma_2$ の**合成** $\sigma_1 \circ \sigma_2$ は、まず $\sigma_2$ を適用し、次に $\sigma_1$ を適用することに相当する:

 (\sigma_1 \circ \sigma_2)(\varphi) = \sigma_1(\sigma_2(\varphi)) 

**構成方法:**

$\sigma_1 = \{\alpha_1 \mapsto \psi_1, \ldots, \alpha_m \mapsto \psi_m\}$、$\sigma_2 = \{\beta_1 \mapsto \chi_1, \ldots, \beta_n \mapsto \chi_n\}$ のとき:

 \sigma_1 \circ \sigma_2 = \{\beta_j \mapsto \sigma_1(\chi_j) \mid j = 1, \ldots, n\} \cup \{\alpha_i \mapsto \psi_i \mid \alpha_i \notin \{\beta_1, \ldots, \beta_n\}\} 

ただし $\beta_j \mapsto \sigma_1(\chi_j)$ で $\sigma_1(\chi_j) = \beta_j$ となるものは除外する。

**具体例:**

$\sigma_1 = \{\varphi \mapsto P(x)\}$、$\sigma_2 = \{\psi \mapsto \varphi \to \varphi \}$

 \sigma_1 \circ \sigma_2 = \{\psi \mapsto P(x) \to P(x),\ \varphi \mapsto P(x)\} 

検算: $(\varphi \to \psi)$ に $\sigma_2$ を適用: $\varphi \to (\varphi \to \varphi)$。次に $\sigma_1$ を適用: $P(x) \to (P(x) \to P(x))$。合成代入を直接適用しても同じ結果が得られる。

### 5.4 代入の合成の結合性

代入の合成は**結合的**である:

 (\sigma_1 \circ \sigma_2) \circ \sigma_3 = \sigma_1 \circ (\sigma_2 \circ \sigma_3) 

**恒等代入の性質:**

 \sigma \circ \epsilon = \epsilon \circ \sigma = \sigma 

## 6. ユニフィケーション（Unification）

### 6.1 問題の定義

2つの式  s （source）と  t （target）が与えられたとき、$\sigma(s) = t$ となる代入 $\sigma$ を見つける問題。

本プロジェクトでは主に以下の場面で使用する:

- **Modus Ponens の適用時:** 前提1の式 $\alpha$ と、前提2の含意 $\alpha' \to \beta$ の左辺 $\alpha'$ がマッチするかの検証
- **公理スキーマのマッチング:** ある式が公理スキーマのインスタンスかどうかの判定

### 6.2 ユニフィケーションの種類

| 種類                   | source                 | target               | 代入対象             | 使用場面             |
| ---------------------- | ---------------------- | -------------------- | -------------------- | -------------------- |
| パターンマッチ         | メタ変数を含むスキーマ | 具体的な式（ground） | sourceのメタ変数のみ | 公理インスタンス検証 |
| 対称ユニフィケーション | メタ変数を含む式       | メタ変数を含む式     | 両方のメタ変数       | MP前提の一致検証     |

### 6.3 Martelli-Montanari アルゴリズム

ユニフィケーション問題を方程式の集合として扱い、変換規則を繰り返し適用して解（代入）を求めるアルゴリズム。

**入力:** 方程式の集合 $E = \{s_1 \doteq t_1, \ldots, s_n \doteq t_n\}$、代入 $\sigma = \{\}$

**変換規則:**

1. **Delete（削除）:** $t \doteq t \to$ 削除（同一式の方程式は除去）
2. **Decompose（分解）:** $f(s_1, \ldots, s_n) \doteq f(t_1, \ldots, t_n) \to \{s_1 \doteq t_1, \ldots, s_n \doteq t_n\}$
   - 最外側の構造が同じ場合、引数に分解
   - 構造が異なる場合 $\to$ **失敗**
3. **Eliminate（消去）:** $\alpha \doteq t$（$\alpha$ はメタ変数、$\alpha \notin \text{vars}(t)$）
   - $\sigma$ に $\alpha \mapsto t$ を追加
   - $E$ 中の残りの方程式すべてに $[\alpha \mapsto t]$ を適用
4. **Orient（整向）:** $t \doteq \alpha$（ t  がメタ変数でない、$\alpha$ がメタ変数）$\to \alpha \doteq t$ に書き換え
5. **Occurs Check（出現チェック）:** $\alpha \doteq t$ で $\alpha \in \text{vars}(t)$（$t \neq \alpha$）$\to$ **失敗**

**終了条件:**

- $E = \emptyset \to$ 成功、$\sigma$ が解
- 失敗規則に該当 $\to$ ユニフィケーション不可能

### 6.4 Occurs Check の説明と必要性

**Occurs check** とは、メタ変数 $\alpha$ を項  t  にマッピングしようとする際に、 t  中に $\alpha$ 自身が出現していないかを確認するチェックである。

**なぜ必要か:** $\alpha \doteq f(\alpha)$ を許すと、$\alpha = f(f(f(\ldots)))$ という無限構造が必要になり、有限の項では表現できない。

**具体例:**

$\varphi \doteq \varphi \to \psi$ — $\varphi$ が右辺に出現しているため、occurs check で失敗。

### 6.5 最汎単一化子（Most General Unifier, MGU）

代入 $\sigma$ がユニフィケーション問題 $s \doteq t$ の**単一化子（unifier）** であるとは、$\sigma(s) = \sigma(t)$ を満たすこと。

単一化子 $\sigma$ が**最汎単一化子（MGU）** であるとは、任意の単一化子 $\theta$ に対してある代入 $\lambda$ が存在して $\theta = \lambda \circ \sigma$ が成り立つこと。つまり $\sigma$ は最も制約の少ない（最も一般的な）解である。

**Martelli-Montanari アルゴリズムが返す解はMGUである。**

### 6.6 具体例

**例1: 成功（単純なマッチング）**

source: $\varphi \to (\psi \to \varphi)$
target: $P(x) \to (Q(y) \to P(x))$

 E = \{\varphi \to (\psi \to \varphi) \doteq P(x) \to (Q(y) \to P(x))\} 

1. Decompose: $\{\varphi \doteq P(x),\ \psi \to \varphi \doteq Q(y) \to P(x)\}$
2. Eliminate: $\varphi \mapsto P(x)$, 残り: $\{\psi \to P(x) \doteq Q(y) \to P(x)\}$
3. Decompose: $\{\psi \doteq Q(y),\ P(x) \doteq P(x)\}$
4. Eliminate: $\psi \mapsto Q(y)$
5. Delete: $P(x) \doteq P(x)$

**MGU:** $\{\varphi \mapsto P(x),\ \psi \mapsto Q(y)\}$

**例2: 成功（変数が複数箇所に出現）**

source: $\varphi \to \varphi$
target: $P(x) \to P(x)$

1. Decompose: $\{\varphi \doteq P(x),\ \varphi \doteq P(x)\}$
2. Eliminate: $\varphi \mapsto P(x)$, 残り: $\{P(x) \doteq P(x)\}$
3. Delete

**MGU:** $\{\varphi \mapsto P(x)\}$

**例3: 失敗（構造不一致）**

source: $\varphi \to \varphi$
target: $P(x) \to Q(y)$

1. Decompose: $\{\varphi \doteq P(x),\ \varphi \doteq Q(y)\}$
2. Eliminate: $\varphi \mapsto P(x)$, 残り: $\{P(x) \doteq Q(y)\}$
3. Decompose: $P$ と $Q$ が異なる $\to$ **失敗**

**例4: 失敗（occurs check）**

source: $\varphi$
target: $\varphi \to \psi$

 E = \{\varphi \doteq \varphi \to \psi\} 

Occurs check: $\varphi \in \text{vars}(\varphi \to \psi) \to$ **失敗**

**例5: 成功（入れ子）**

source: $(\varphi \to (\psi \to \chi)) \to ((\varphi \to \psi) \to (\varphi \to \chi))$（A2スキーマ）
target: $(P(x) \to ((P(x) \to P(x)) \to P(x))) \to ((P(x) \to (P(x) \to P(x))) \to (P(x) \to P(x)))$

**MGU:** $\{\varphi \mapsto P(x),\ \psi \mapsto P(x) \to P(x),\ \chi \mapsto P(x)\}$

## 7. 実装上の注意点

### 7.1 メタ変数と項変数の厳密な区別

- `MetaVariable`（論理式メタ変数）と `TermMetaVariable`（項メタ変数）はメタレベルの変数。ギリシャ文字で表記
- `TermVariable` はオブジェクトレベルの変数。ラテン小文字で表記
- 代入操作は**レベルを混同してはならない**。メタ変数代入中に項変数代入が誤って実行されることがないよう、型システムで区別する

### 7.2 代入の実行順序

公理A4のインスタンス化は2段階:

1. メタ変数代入でスキーマを具体化
2. 項変数代入で $\varphi[t/x]$ を計算

この順序を逆にすることはできない（メタ変数が残った状態で項変数代入を適用しても意味がない）。

### 7.3 添字付きメタ変数の同一性

添字は**文字列として比較**する（[01-notation.md](./01-notation.md) セクション6.2 参照）:

- $\varphi_1 \neq \varphi_{01}$（添字 `"1"` と `"01"` は異なる）
- $\varphi \neq \varphi_0$（添字なしと添字 `"0"` は異なる）

ユニフィケーション時にメタ変数の一致判定は名前と添字の**両方**が一致する場合のみ。

### 7.4 新鮮な変数の生成

$\alpha$変換で必要な**新鮮な変数**の生成方法:

- 式中に出現するすべての変数名を収集
- それと衝突しない新しい変数名を生成（例: `x` が使用済みなら `x'`, `x''`, `x_0` など）
- 実装上は式全体の変数集合を保持し、そこに含まれない名前を選ぶ

## 参考文献

- Enderton, H.B. "A Mathematical Introduction to Logic" (2nd ed., 2001) — 代入の形式的定義
- Mendelson, E. "Introduction to Mathematical Logic" (6th ed., 2015) — Hilbert系における代入の取り扱い
- Martelli, A. and Montanari, U. "An Efficient Unification Algorithm" (1982) — ユニフィケーションアルゴリズムの原典
- Robinson, J.A. "A Machine-Oriented Logic Based on the Resolution Principle" (1965) — ユニフィケーションの原初的定義
- Baader, F. and Snyder, W. "Unification Theory" in _Handbook of Automated Reasoning_ (2001) — ユニフィケーション理論の包括的レビュー
