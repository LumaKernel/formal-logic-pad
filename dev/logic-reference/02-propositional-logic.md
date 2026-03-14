# 命題論理の基礎（Hilbert系）

本プロジェクトで採用するHilbert系命題論理の公理系と推論規則を定義する。Logic Core (`src/lib/logic-core/`) の公理・推論規則実装の根拠となるリファレンスである。

## 1. 論理式と論理式スキーマの区別

### 論理式（Formula）

**論理式**とは、具体的な命題変数のみを含む式である。メタ変数を含まない。

**例:**

- $p \to (q \to p)$ — 命題変数  p ,  q  を含む論理式
- $\lnot p \to (p \to q)$ — 命題変数  p ,  q  を含む論理式

### 論理式スキーマ（Formula Schema）

**論理式スキーマ**とは、メタ変数（ギリシャ文字 $\varphi , \psi , \chi$ 等）を含む式のパターンである。メタ変数に任意の論理式を代入することで具体的な論理式のクラスを表す。

**例:**

- $\varphi \to (\psi \to \varphi)$ — メタ変数 $\varphi , \psi$ を含むスキーマ

このスキーマにおいて $\varphi$ に  p , $\psi$ に  q  を代入すると論理式 $p \to (q \to p)$ が得られる。同じスキーマに $\varphi$ に $p \to q , \psi$ に  r  を代入すると $(p \to q) \to (r \to (p \to q))$ が得られる。

### 本プロジェクトでの扱い

**重要:** 本プロジェクトでは一貫して**論理式スキーマ**を扱う。公理はスキーマとして定義され、メタ変数への代入操作（`Substitution`）が推論規則の一つとして機能する。実装上のAST型名は `MetaVariable`（論理式メタ変数）である。

| 概念           | メタ変数を含む | 代入操作の対象 | AST上の表現                   |
| -------------- | -------------- | -------------- | ----------------------------- |
| 論理式         | ✗              | ✗              | メタ変数なしの Formula        |
| 論理式スキーマ | ✓              | ✓              | `MetaVariable` を含む Formula |

## 2. Hilbert系の公理スキーマ

本プロジェクトではŁukasiewicz（ウカシェヴィチ）による最小限の公理体系を採用する。含意 `$\to$` と否定 `$\lnot$` を基本結合子とし、3つの公理スキーマからなる。

### A1: K公理（含意の導入）

 \varphi \to (\psi \to \varphi) 

**直感的な意味:** $\varphi$ が真ならば、$\psi$ が何であっても $\psi \to \varphi$ が成り立つ。「すでに分かっていることは、余分な仮定を付けても成り立つ」。

**AST対応:** `Implication($\varphi$, Implication($\psi , \varphi$))`

**コンビネータ対応:** K combinator ($K = \lambda x. \lambda y. x$)

**具体例（代入によるインスタンス）:**

| 代入                              | 得られる論理式                    |
| --------------------------------- | --------------------------------- |
| $\varphi := p , \psi := q$       | $p \to (q \to p)$                 |
| $\varphi := p \to q , \psi := r$ | $(p \to q) \to (r \to (p \to q))$ |
| $\varphi := \lnot p , \psi := p$ | $\lnot p \to (p \to \lnot p)$     |

### A2: S公理（含意の分配）

 (\varphi \to (\psi \to \chi)) \to ((\varphi \to \psi) \to (\varphi \to \chi)) 

**直感的な意味:** 「$\varphi$ から $\psi$ を経由して $\chi$ に至る」ことと「$\varphi$ から $\psi$ に至る」ことから、「$\varphi$ から直接 $\chi$ に至る」ことが導ける。含意の推移性の一般化。

**AST対応:** `Implication(Implication($\varphi$, Implication($\psi , \chi$)), Implication(Implication($\varphi , \psi$), Implication($\varphi , \chi$)))`

**コンビネータ対応:** S combinator ($S = \lambda x. \lambda y. \lambda z. (x\ z)\ (y\ z)$)

**具体例:**

| 代入                                           | 得られる論理式                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| $\varphi := p , \psi := p , \chi := p$       | $(p \to (p \to p)) \to ((p \to p) \to (p \to p))$                 |
| $\varphi := p , \psi := q \to p , \chi := p$ | $(p \to ((q \to p) \to p)) \to ((p \to (q \to p)) \to (p \to p))$ |

### A3: 対偶公理（否定と含意の関係）

 (\lnot \varphi \to \lnot \psi) \to (\psi \to \varphi) 

**直感的な意味:** 「$\varphi$ でないならば $\psi$ でない」が成り立つならば、対偶として「$\psi$ ならば $\varphi$」が成り立つ。古典論理の本質（排中律と同値の性質）を規定する公理。

**AST対応:** `Implication(Implication(Negation($\varphi$), Negation($\psi$)), Implication($\psi , \varphi$))`

**具体例:**

| 代入                              | 得られる論理式                                    |
| --------------------------------- | ------------------------------------------------- |
| $\varphi := p , \psi := q$       | $(\lnot p \to \lnot q) \to (q \to p)$             |
| $\varphi := \lnot p , \psi := p$ | $(\lnot \lnot p \to \lnot p) \to (p \to \lnot p)$ |

### 公理の選択根拠

この3公理の体系はŁukasiewiczによるもので、Hilbert系命題論理として**最小限の公理体系**である。他の結合子（$\land , \lor , \leftrightarrow$）は定義として導入できる：

| 結合子                         | 定義                                          |
| ------------------------------ | --------------------------------------------- |
| $\varphi \land \psi$           | $\lnot (\varphi \to \lnot \psi)$              |
| $\varphi \lor \psi$            | $\lnot \varphi \to \psi$                      |
| $\varphi \leftrightarrow \psi$ | $(\varphi \to \psi) \land (\psi \to \varphi)$ |

**実装上の注意:** 本プロジェクトのASTでは $\land , \lor , \leftrightarrow$ も独立したノード型を持つ（`Conjunction`, `Disjunction`, `Biconditional`）。これらは入力の便宜のためであり、公理体系としてはA1〜A3のみで完結する。将来的に $\land , \lor , \leftrightarrow$ の公理を追加するかどうかは体系設定で選択可能にする。

## 3. 推論規則: Modus Ponens (MP)

### 定義

 \frac{\varphi \qquad \varphi \to \psi}{\psi} \quad (\text{MP}) 

**前提（premises）:** $\varphi$ と $\varphi \to \psi$ の2つ

**結論（conclusion）:** $\psi$

**直感的な意味:** $\varphi$ が証明済みであり、$\varphi \to \psi$ も証明済みであれば、$\psi$ を導出できる。

### 厳密な定義

Modus Ponensは以下の条件を満たす推論規則である：

1. 前提1として論理式（スキーマ）$\alpha$ が与えられる
2. 前提2として論理式（スキーマ）$\alpha \to \beta$ が与えられる（前提2が含意の形であること）
3. 前提2の左辺 $\alpha$ が前提1と**構造的に一致**すること
4. 結論は前提2の右辺 $\beta$ である

**AST対応:**

```
premises: [$\alpha$, Implication($\alpha , \beta$)]
conclusion: $\beta$
```

**重要:** MPは唯一の推論規則である。公理のインスタンス化（メタ変数への代入）は別個の操作（`Substitution`）として扱う。

### 具体例

**例1:**  p  と $p \to q$ から  q  を導出

 \frac{p \qquad p \to q}{q} \quad (\text{MP}) 

**例2:** $p \to q$ と $(p \to q) \to (r \to (p \to q))$ から $r \to (p \to q)$ を導出

 \frac{p \to q \qquad (p \to q) \to (r \to (p \to q))}{r \to (p \to q)} \quad (\text{MP}) 

## 4. 証明図（木構造）の表記法

### 証明の定義

Hilbert系における**証明**とは、公理のインスタンスとModus Ponensの適用の系列である。木構造として表現し、根が最終結論、葉が公理インスタンスとなる。

### 表記法

証明図は上から下へ構築する。横線の上が前提、下が結論、右にラベル（適用された規則）を記す。

```
                前提1        前提2
               ─────────────────── (規則名)
                    結論
```

複数段の場合はネストする：

```
             [公理]        [公理]
            ──────── (A1)  ──────── (A2)
              式1            式2
            ────────────────────── (MP)
                    式3
```

### 葉ノードの種類

| 種類             | ラベル     | 説明                                     |
| ---------------- | ---------- | ---------------------------------------- |
| 公理インスタンス | A1, A2, A3 | 公理スキーマにメタ変数代入して得た論理式 |

### 内部ノードの種類

| 種類         | ラベル | 前提数 | 説明                                                       |
| ------------ | ------ | ------ | ---------------------------------------------------------- |
| Modus Ponens | MP     | 2      | 前提1: $\alpha$, 前提2: $\alpha \to \beta \to$ 結論: $\beta$ |

## 5. 具体例: $\varphi \to \varphi$ の証明（I combinator）

$\varphi \to \varphi$ は公理に含まれていないが、A1, A2, MPのみで証明できる。これはSK基底からI combinatorを構成することに対応する。

### ステップごとの証明

| ステップ | 式                                                                                                                      | 根拠                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1        | $(\varphi \to ((\varphi \to \varphi) \to \varphi)) \to ((\varphi \to (\varphi \to \varphi)) \to (\varphi \to \varphi))$ | A2: $\psi := \varphi \to \varphi , \chi := \varphi$ |
| 2        | $\varphi \to ((\varphi \to \varphi) \to \varphi)$                                                                       | A1: $\psi := \varphi \to \varphi$                    |
| 3        | $(\varphi \to (\varphi \to \varphi)) \to (\varphi \to \varphi)$                                                         | MP: 2, 1                                             |
| 4        | $\varphi \to (\varphi \to \varphi)$                                                                                     | A1: $\psi := \varphi$                                |
| 5        | $\varphi \to \varphi$                                                                                                   | MP: 4, 3                                             |

### 証明図（木構造）

```
  A2[$\psi$:=$\varphi \to \varphi , \chi$:=$\varphi$]                       A1[$\psi$:=$\varphi \to \varphi$]
─────────────────────────────────────    ──────────────────────
($\varphi \to ((\varphi \to \varphi) \to \varphi)) \to ((\varphi \to (\varphi \to \varphi)) \to (\varphi \to \varphi)) \varphi \to ((\varphi \to \varphi) \to \varphi$)          A1[$\psi$:=$\varphi$]
──────────────────────────────────────────────────────── (MP)   ──────────────
        ($\varphi \to (\varphi \to \varphi)) \to (\varphi \to \varphi) \varphi \to (\varphi \to \varphi$)
        ───────────────────────────────────────────────── (MP)
                            $\varphi \to \varphi$
```

### 代入の詳細

- **ステップ1:** A2スキーマ $(\varphi \to (\psi \to \chi)) \to ((\varphi \to \psi) \to (\varphi \to \chi))$ に $\psi := \varphi \to \varphi , \chi := \varphi$ を代入
- **ステップ2:** A1スキーマ $\varphi \to (\psi \to \varphi)$ に $\psi := \varphi \to \varphi$ を代入
- **ステップ3:** ステップ2の結論 $\varphi \to ((\varphi \to \varphi) \to \varphi)$ とステップ1の結論を前提として MP を適用。ステップ2がステップ1の含意の左辺と一致
- **ステップ4:** A1スキーマに $\psi := \varphi$ を代入
- **ステップ5:** ステップ4の結論 $\varphi \to (\varphi \to \varphi)$ とステップ3の結論 $(\varphi \to (\varphi \to \varphi)) \to (\varphi \to \varphi)$ を前提としてMPを適用

## 6. 具体例: $\lnot \lnot \varphi \to \varphi$（二重否定除去）

二重否定除去は古典論理の重要な定理である。A3（対偶公理）が本質的に使われる。

### ステップごとの証明

| ステップ | 式                                                                                                                                                            | 根拠                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1        | $(\lnot \varphi \to \lnot \lnot \lnot \varphi) \to (\lnot \lnot \varphi \to \varphi)$                                                                         | A3: $\varphi := \varphi , \psi := \lnot \lnot \varphi$                                      |
| 2        | $\lnot \varphi \to (\lnot \lnot \lnot \varphi \to \lnot \varphi)$                                                                                             | A1: $\varphi := \lnot \varphi , \psi := \lnot \lnot \lnot \varphi$                          |
| 3        | $(\lnot \varphi \to (\lnot \lnot \lnot \varphi \to \lnot \varphi)) \to ((\lnot \varphi \to \lnot \lnot \lnot \varphi) \to (\lnot \varphi \to \lnot \varphi))$ | A2: $\varphi := \lnot \varphi , \psi := \lnot \lnot \lnot \varphi , \chi := \lnot \varphi$ |
| 4        | $(\lnot \varphi \to \lnot \lnot \lnot \varphi) \to (\lnot \varphi \to \lnot \varphi)$                                                                         | MP: 2, 3                                                                                     |
| 5        | $(\lnot \lnot \lnot \varphi \to \lnot \lnot \varphi) \to (\lnot \varphi \to \lnot \lnot \lnot \varphi)$                                                       | A3: $\varphi := \lnot \lnot \varphi , \psi := \lnot \varphi \to$ 結果を変形                   |

この証明は比較的長くなるため、要点を示す。完全な証明は以下の中間定理を経由する：

### 中間定理: $\varphi \to \varphi$（上記セクション5を参照）

二重否定除去の証明戦略:

1. A3 のインスタンス $(\lnot \varphi \to \lnot \lnot \lnot \varphi) \to (\lnot \lnot \varphi \to \varphi)$ を得る（ステップ1）
2. $\lnot \varphi \to \lnot \lnot \lnot \varphi$ を証明する（二重否定導入 $\alpha \to \lnot \lnot \alpha$ の $\alpha := \lnot \varphi$ を利用）
3. MPで結合して $\lnot \lnot \varphi \to \varphi$ を得る

### 補題: 二重否定導入 $\varphi \to \lnot \lnot \varphi$

| ステップ | 式                                                                                 | 根拠             |
| -------- | ---------------------------------------------------------------------------------- | ---------------- |
| 1        | $(\lnot \lnot \varphi \to \lnot \varphi) \to (\varphi \to \lnot \varphi \to ...)$ | A3のインスタンス |

**注:** 完全な形式的証明は十数ステップに及ぶ。ここでは証明戦略と鍵となるステップを示す。完全な証明はMendelson "Introduction to Mathematical Logic" の Proposition 1.12 を参照。

### 実装上の注意

二重否定除去の証明は、Hilbert系での証明が**非常に冗長**になることの典型例である。これはHilbert系が最小限の規則しか持たないことの裏返しであり、本プロジェクトのUI（パズルとしての証明構築）において重要な設計考慮点となる。

## 7. 演繹定理（Deduction Theorem）

Hilbert系での証明を効率的に構築するための重要なメタ定理を紹介する。

### 定理の主張

$\Gamma \cup \{\varphi \} \vdash \psi$ ならば $\Gamma \vdash \varphi \to \psi$

つまり、仮定 $\varphi$ を追加して $\psi$ を証明できるならば、仮定なしで $\varphi \to \psi$ を証明できる。

### 直感的な意味

「仮定 $\varphi$ のもとで $\psi$ を示せた」ことを「$\varphi \to \psi$ が定理である」に変換できる。

### 実装との関係

演繹定理自体はメタ定理であり、推論規則ではない。しかし、証明構築を補助する機能として将来的にUI側で「仮定を導入し、後で演繹定理で discharge する」ワークフローを提供することが考えられる。

**注意:** 演繹定理の証明（メタ証明）自体がA1, A2, MPを使った帰納法で構成されており、セクション5の $\varphi \to \varphi$ の証明はその基底ケースに対応する。

## 8. 体系の完全性と健全性

### 健全性（Soundness）

公理A1〜A3はすべて恒真式（トートロジー）であり、MPは恒真式を保存する。したがって、この体系で証明可能な命題はすべてトートロジーである。

### 完全性（Completeness）

任意のトートロジーはA1〜A3とMPから証明可能である（完全性定理）。

この2つの性質により、「A1〜A3 + MPで証明可能」⇔「トートロジー」が成り立つ。

### 実装上の注意

完全性により、任意のトートロジーに対して証明が存在することが保証されるが、その証明を**見つける**ことは別問題である。本プロジェクトはユーザーが手動で証明を構築するため、自動証明探索は実装しない。

## 参考文献

- [高崎研究室 論理学教材](https://www2.yukawa.kyoto-u.ac.jp/~kanehisa.takasaki/edu/logic/logic6.html) — A1〜A3の公理体系の出典
- Mendelson, E. "Introduction to Mathematical Logic" (6th ed., 2015) — Hilbert系命題論理の詳細な展開。Proposition 1.12で二重否定除去の完全な証明を収録
- Enderton, H.B. "A Mathematical Introduction to Logic" (2nd ed., 2001) — 健全性・完全性定理の証明
- Łukasiewicz, J. and Tarski, A. "Untersuchungen über den Aussagenkalkül" (1930) — 本公理体系の原典
- Hindley, J.R. and Seldin, J.P. "Lambda-Calculus and Combinators: An Introduction" (2008) — SKI combinator との対応関係
