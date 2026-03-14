# シーケント計算の基礎

本ドキュメントでは、カット除去定理を理解するための前提であるシーケント計算（Sequent Calculus）の基本概念と推論規則を解説する。

> **関連:** Hilbert 系の公理・推論規則については [../logic-reference/02-propositional-logic.md](../logic-reference/02-propositional-logic.md) を参照。本ドキュメントでは Hilbert 系とは異なる証明体系であるシーケント計算を扱う。

## 1. シーケント（Sequent）

### 1.1 定義

**シーケント**（sequent）は以下の形をした形式的な表明である:

```
$\Gamma \vdash \Delta$
```

ここで:

- `$\Gamma$`（ガンマ）: **前件**（antecedent） — 論理式の有限多重集合（multiset）
- `$\Delta$`（デルタ）: **後件**（succedent） — 論理式の有限多重集合
- `$\vdash$`（ターンスタイル）: 前件から後件が導けることを表す記号

### 1.2 直感的な意味

シーケント `A₁, A₂, ..., Aₘ $\vdash$ B₁, B₂, ..., Bₙ` は直感的に次を意味する:

> 「A₁ かつ A₂ かつ ... かつ Aₘ が成り立つならば、B₁ または B₂ または ... または Bₙ のいずれかが成り立つ」

すなわち:

```
A₁ $\land$ A₂ $\land ... \land$ Aₘ $\to$ B₁ $\lor$ B₂ $\lor ... \lor$ Bₙ
```

**特殊ケース:**

| シーケント     | 意味                       | 備考             |
| -------------- | -------------------------- | ---------------- |
| `$\vdash$ A`   | `A` は恒真（トートロジー） | 前件なし         |
| `A $\vdash$`   | `A` は矛盾（充足不能）     | 後件なし         |
| `$\vdash$`     | 矛盾（falsum）             | 前件も後件もなし |
| `A $\vdash$ B` | `A $\to$ B` が成り立つ     | 通常の含意       |

### 1.3 多重集合としての扱い

$\Gamma$ と $\Delta$ は**多重集合**（multiset）として扱う。つまり:

- 要素の順序は問わない（交換可能）
- 同じ論理式が複数回出現しうる（重複を区別する）

多重集合表記では `$\Gamma$, A` は多重集合 $\Gamma$ に論理式 A を1つ追加したものを表す。`$\Gamma , \Delta$` は2つの多重集合の合併を表す。

## 2. LK — 古典論理のシーケント計算

**LK**（Logischer Kalkül、Gentzen, 1935）は古典論理のシーケント計算体系である。

### 2.1 公理（Identity / Axiom）

初期シーケント（証明の葉ノード）:

```
────────── (Ax)
  A $\vdash$ A
```

任意の論理式 `A` について、`A $\vdash$ A` は公理として認められる。

**例:** `P $\vdash$ P`, `(A $\to$ B) $\vdash$ (A $\to$ B)`, `$\forall$x.P(x) $\vdash \forall$x.P(x)` はすべて公理。

### 2.2 構造規則（Structural Rules）

構造規則は論理結合子に関わらず、シーケントの構造を変換する規則である。

#### 弱化（Weakening）

使用されていない仮定を追加する。

```
   $\Gamma \vdash \Delta \Gamma \vdash \Delta$
────────────── (WL)     ────────────── (WR)
  $\Gamma$, A $\vdash \Delta \Gamma \vdash \Delta$, A
```

- **(WL)** 左弱化: 前件に任意の論理式を追加
- **(WR)** 右弱化: 後件に任意の論理式を追加

**例（WL）:**

```
    P $\vdash$ P
──────────── (WL)
  P, Q $\vdash$ P
```

「P が成り立つなら P が成り立つ」から「P かつ Q が成り立つなら P が成り立つ」を導出。

#### 縮約（Contraction）

重複した仮定を1つにまとめる。

```
  $\Gamma$, A, A $\vdash \Delta \Gamma \vdash \Delta$, A, A
─────────────── (CL)     ─────────────── (CR)
   $\Gamma$, A $\vdash \Delta \Gamma \vdash \Delta$, A
```

- **(CL)** 左縮約: 前件で重複した論理式を1つにまとめる
- **(CR)** 右縮約: 後件で重複した論理式を1つにまとめる

**例（CL）:**

```
  P, P $\vdash$ P
──────────── (CL)
   P $\vdash$ P
```

#### 交換（Exchange）

多重集合としての扱いを明示する規則。多くの現代的な定式化では、前件・後件を多重集合として扱うため交換規則は暗黙的に含まれる。本ドキュメントでも多重集合として扱うため、交換規則は明示しない。

### 2.3 論理規則（Logical Rules）

各論理結合子について、左規則（前件に導入）と右規則（後件に導入）がある。

#### 否定（Negation）

```
  $\Gamma \vdash \Delta$, A                 A, $\Gamma \vdash \Delta$
────────────── ($\lnot$L)     ────────────── ($\lnot$R)
  $\lnot$A, $\Gamma \vdash \Delta \Gamma \vdash \Delta , \lnot$A
```

- **($\lnot$L)**: 前件の `$\lnot$A` を使うために、後件に `A` を移す
- **($\lnot$R)**: 後件に `$\lnot$A` を導入するために、前件に `A` を移す

**例（$\lnot$R）:** 「`A` を仮定して矛盾（空の後件）を導ける」なら `$\lnot$A` が結論になる:

```
    A $\vdash$ A
──────────── ($\lnot$R)
   $\vdash$ A, $\lnot$A
```

「`A` または `$\lnot$A` のいずれかが成り立つ」（排中律の一例）

#### 含意（Implication）

```
  $\Gamma \vdash \Delta$, A     B, $\Sigma \vdash$ Π           A, $\Gamma \vdash \Delta$, B
──────────────────────── ($\to$L)     ──────────────── ($\to$R)
    A $\to$ B, $\Gamma , \Sigma \vdash \Delta$, Π              $\Gamma \vdash \Delta$, A $\to$ B
```

- **($\to$L)**: 前件の `A $\to$ B` を使うには、`A` を後件で証明し、`B` を前件に仮定する
- **($\to$R)**: 後件に `A $\to$ B` を導入するには、`A` を前件に仮定して `B` を後件で証明する

**例（$\to$R）:** 恒等含意 `A $\to$ A` の証明:

```
   A $\vdash$ A
──────────── ($\to$R)
  $\vdash$ A $\to$ A
```

#### 連言（Conjunction）

```
  A, $\Gamma \vdash \Delta$                 B, $\Gamma \vdash \Delta$
────────────── ($\land$L₁)     ────────────── ($\land$L₂)
  A $\land$ B, $\Gamma \vdash \Delta$             A $\land$ B, $\Gamma \vdash \Delta \Gamma \vdash \Delta$, A     $\Gamma \vdash \Delta$, B
────────────────────────── ($\land$R)
       $\Gamma \vdash \Delta$, A $\land$ B
```

- **($\land$L₁)**: 前件の `A $\land$ B` から `A` を取り出す
- **($\land$L₂)**: 前件の `A $\land$ B` から `B` を取り出す
- **($\land$R)**: 後件に `A $\land$ B` を導入するには、`A` と `B` をそれぞれ証明する

**例（$\land$R）:**

```
  A $\vdash$ A     B $\vdash$ B
────────────────── ($\land$R)  ← ただし $\Gamma$ が一致しないため、先に弱化が必要
```

正確には:

```
   A, B $\vdash$ A          A, B $\vdash$ B
   (WL で B 追加)     (WL で A 追加)
──────────────────────────────── ($\land$R)
         A, B $\vdash$ A $\land$ B
```

#### 選言（Disjunction）

```
  A, $\Gamma \vdash \Delta$     B, $\Sigma \vdash$ Π           $\Gamma \vdash \Delta$, A                 $\Gamma \vdash \Delta$, B
──────────────────────── ($\lor$L)     ────────────── ($\lor$R₁)     ────────────── ($\lor$R₂)
   A $\lor$ B, $\Gamma , \Sigma \vdash \Delta$, Π             $\Gamma \vdash \Delta$, A $\lor$ B             $\Gamma \vdash \Delta$, A $\lor$ B
```

- **($\lor$L)**: 前件の `A $\lor$ B` を場合分け — `A` の場合と `B` の場合をそれぞれ証明する
- **($\lor$R₁)**: 後件に `A $\lor$ B` を導入（`A` を証明）
- **($\lor$R₂)**: 後件に `A $\lor$ B` を導入（`B` を証明）

**例（$\lor$L）:** 選言の可換性 `A $\lor$ B $\vdash$ B $\lor$ A`:

```
    A $\vdash$ A               B $\vdash$ B
──────────── ($\lor$R₂)  ──────────── ($\lor$R₁)
  A $\vdash$ B $\lor$ A           B $\vdash$ B $\lor$ A
──────────────────────────────── ($\lor$L)
         A $\lor$ B $\vdash$ B $\lor$ A
```

#### 全称量化（Universal Quantification）

```
  A[t/x], $\Gamma \vdash \Delta \Gamma \vdash \Delta$, A[y/x]
───────────────── ($\forall$L)          ──────────────────── ($\forall$R)
   $\forall$x.A, $\Gamma \vdash \Delta \Gamma \vdash \Delta , \forall$x.A
```

- **($\forall$L)**: 前件の `$\forall$x.A` を任意の項 `t` で例化する
- **($\forall$R)**: 後件に `$\forall$x.A` を導入するには、`y` が $\Gamma , \Delta$ に自由に出現しない**固有変数**（eigenvariable）であること

**固有変数条件（eigenvariable condition）:** ($\forall$R) において `y` は結論のシーケント `$\Gamma \vdash \Delta , \forall$x.A` に自由に出現してはならない。これにより、`y` が本当に「任意の」対象を表すことが保証される。

**例（$\forall$R）:**

```
     P(y) $\vdash$ P(y)
──────────────────── ($\forall$R)    y は他に出現しないので OK
    P(y) $\vdash \forall$x.P(x)
```

#### 存在量化（Existential Quantification）

```
  A[y/x], $\Gamma \vdash \Delta \Gamma \vdash \Delta$, A[t/x]
───────────────── ($\exists$L)          ──────────────────── ($\exists$R)
   $\exists$x.A, $\Gamma \vdash \Delta \Gamma \vdash \Delta , \exists$x.A
```

- **($\exists$L)**: 前件の `$\exists$x.A` を固有変数 `y` で展開する（`y` は $\Gamma , \Delta$ に自由に出現しない）
- **($\exists$R)**: 後件に `$\exists$x.A` を導入するには、具体的な項 `t` で `A[t/x]` を証明する

**固有変数条件:** ($\exists$L) において `y` は結論のシーケント `$\exists$x.A, $\Gamma \vdash \Delta$` に自由に出現してはならない。

**例（$\exists$R）:**

```
      P(t) $\vdash$ P(t)
────────────────────── ($\exists$R)    t で例化
    P(t) $\vdash \exists$x.P(x)
```

### 2.4 切断規則（Cut Rule）

```
  $\Gamma \vdash \Delta$, A     A, $\Sigma \vdash$ Π
──────────────────────────── (Cut)
       $\Gamma , \Sigma \vdash \Delta$, Π
```

- 左の前提で `A` を後件に証明し、右の前提で `A` を前件として仮定して使う
- `A` を**カット式**（cut formula）と呼ぶ
- カット式は結論のシーケントには出現しない（消える）

**直感的な意味:** 「補題（lemma）を使った証明」に対応する。`A` という補題をまず証明し（左前提）、それを使ってさらに何かを証明する（右前提）。

**例:** `$\vdash$ B $\to$ A, A $\to$ C $\vdash$ C` から `B $\to$ A $\vdash$ C` を導く（`A` をカット式として）:

しかし、この例はやや不正確なので、より単純な例を示す:

```
  $\vdash$ A     A $\vdash$ B
─────────────── (Cut)
      $\vdash$ B
```

「`A` が証明でき、`A` ならば `B` が証明できる」なら「`B` が証明できる」。

**注:** カット除去定理（Hauptsatz）は、LK の任意の証明からカット規則をすべて除去できることを主張する。詳しくは [02-cut-elimination-theorem.md](./02-cut-elimination-theorem.md) を参照。

## 3. LK の推論規則一覧

| 分類     | 規則名   | 略称       | 前提数 | 備考                          |
| -------- | -------- | ---------- | ------ | ----------------------------- |
| **公理** | 恒等公理 | Ax         | 0      | A $\vdash$ A                  |
| **構造** | 左弱化   | WL         | 1      | 前件に論理式を追加            |
|          | 右弱化   | WR         | 1      | 後件に論理式を追加            |
|          | 左縮約   | CL         | 1      | 前件の重複を統合              |
|          | 右縮約   | CR         | 1      | 後件の重複を統合              |
| **否定** | 左否定   | $\lnot$L   | 1      | 後件の A を前件の $\lnot$A に |
|          | 右否定   | $\lnot$R   | 1      | 前件の A を後件の $\lnot$A に |
| **含意** | 左含意   | $\to$L     | 2      | A $\to$ B の分解              |
|          | 右含意   | $\to$R     | 1      | 演繹定理に対応                |
| **連言** | 左連言₁  | $\land$L₁  | 1      | A $\land$ B から A を抽出     |
|          | 左連言₂  | $\land$L₂  | 1      | A $\land$ B から B を抽出     |
|          | 右連言   | $\land$R   | 2      | A と B の両方を証明           |
| **選言** | 左選言   | $\lor$L    | 2      | A $\lor$ B の場合分け         |
|          | 右選言₁  | $\lor$R₁   | 1      | A から A $\lor$ B を導入      |
|          | 右選言₂  | $\lor$R₂   | 1      | B から A $\lor$ B を導入      |
| **全称** | 左全称   | $\forall$L | 1      | $\forall$x.A を項 t で例化    |
|          | 右全称   | $\forall$R | 1      | 固有変数条件あり              |
| **存在** | 左存在   | $\exists$L | 1      | 固有変数条件あり              |
|          | 右存在   | $\exists$R | 1      | $\exists$x.A を項 t で例化    |
| **切断** | カット   | Cut        | 2      | カット式が消える              |

## 4. Hilbert 系との比較

本プロジェクトのメイン機能である Hilbert 系とシーケント計算の主な違い:

| 特徴             | Hilbert 系                      | シーケント計算 (LK)                |
| ---------------- | ------------------------------- | ---------------------------------- |
| **推論規則の数** | 少ない（MP + Gen）              | 多い（各結合子に左右規則）         |
| **公理の数**     | 多い（K, S, 対偶, A4, A5, ...） | 少ない（A $\vdash$ A のみ）        |
| **証明の方向**   | 前方向（公理から出発）          | 後方向（ゴールから分解）           |
| **部分式性**     | なし                            | あり（カット除去後）               |
| **証明探索**     | 困難                            | 比較的容易（規則適用のガイドあり） |
| **証明の自然さ** | 低い（技巧的）                  | 高い（構造的）                     |
| **メタ理論**     | Hilbert 系上の演繹定理等        | カット除去定理                     |

**同値性:** Hilbert 系と LK は（古典命題論理・述語論理において）**同じ定理集合**を証明できる。つまり、一方で証明できる命題は他方でも証明できる。ただし、証明の構造やサイズは大きく異なりうる。

## 5. LJ — 直観主義論理のシーケント計算

**LJ**（Logischer Kalkül für intuitionistische Logik）は直観主義論理のシーケント計算体系である。LK との唯一の違いは:

> **LJ の制約:** すべてのシーケントにおいて、後件は**高々1つ**の論理式しか含まない。

すなわち、LJ のシーケントは以下の形のみ許される:

```
$\Gamma \vdash$ A     （後件が1つ）
$\Gamma \vdash$       （後件が空 = 矛盾の導出）
```

この制約により:

1. **右弱化（WR）** は本質的に使えない（後件に既に式がある場合、追加できない）
2. **右縮約（CR）** は自明（後件は1つしかない）
3. **排中律**（`$\vdash$ A $\lor \lnot$A`）は証明できない

**LK で証明可能だが LJ で証明不可能な例:**

排中律: `$\vdash$ A $\lor \lnot$A`

```
    A $\vdash$ A
──────────── ($\lnot$R)     ← LK: 後件に $\lnot$A を追加可能（後件が A, $\lnot$A の2つ）
  $\vdash$ A, $\lnot$A
──────────── ($\lor$R₁ + $\lor$R₂ の合わせ技)
  $\vdash$ A $\lor \lnot$A
```

LJ では後件に `A` がある状態で `$\lnot$A` を追加できないため、この証明は不可能。

**LK と LJ の関係:**

| 性質          | LK       | LJ         |
| ------------- | -------- | ---------- |
| 後件の最大数  | 制限なし | 1          |
| 排中律        | 証明可能 | 証明不可能 |
| 二重否定除去  | 証明可能 | 証明不可能 |
| Peirce の法則 | 証明可能 | 証明不可能 |
| カット除去    | 成り立つ | 成り立つ   |

> **関連:** 古典論理・直観主義論理・最小論理の関係については [../logic-reference/07-axiom-systems-survey.md](../logic-reference/07-axiom-systems-survey.md) を参照。

## 6. 証明の例

### 6.1 恒等含意: `$\vdash$ A $\to$ A`

```
     A $\vdash$ A     (Ax)
──────────────  ($\to$R)
   $\vdash$ A $\to$ A
```

### 6.2 対偶: `A $\to$ B $\vdash \lnot$B $\to \lnot$A`

```
         B $\vdash$ B     (Ax)                    A $\vdash$ A     (Ax)
         ────────────── ($\lnot$L)
         $\lnot$B, B $\vdash$
                                  A $\vdash$ A     (Ax)
  ──────────────── (WL)     ─────────────── (WL)
  A $\to$ B, $\lnot$B $\vdash$ A            A, A $\to$ B, $\lnot$B $\vdash$ ...
```

より丁寧に:

```
                      A $\vdash$ A, B    (WR)        B, $\lnot$B $\vdash$    (*)
                   ─────────────────────────────────── ($\to$L)
                       A $\to$ B, A, $\lnot$B $\vdash$ B
                   ──────────────────── ($\lnot$L から再構成)

(*) B $\vdash$ B (Ax) $\to \lnot$B, B $\vdash (\lnot$L)
```

対偶の完全な証明は規則の連鎖が長くなるため、ここでは概略のみ示す。完全な証明木は [04-examples.md](./04-examples.md) で扱う。

### 6.3 選言の可換性: `A $\lor$ B $\vdash$ B $\lor$ A`

```
    A $\vdash$ A               B $\vdash$ B
──────────── ($\lor$R₂)  ──────────── ($\lor$R₁)
  A $\vdash$ B $\lor$ A           B $\vdash$ B $\lor$ A
──────────────────────────────── ($\lor$L)
         A $\lor$ B $\vdash$ B $\lor$ A
```

### 6.4 全称例化: `$\forall$x.P(x) $\vdash$ P(t)`

```
  P(t) $\vdash$ P(t)    (Ax)
───────────────── ($\forall$L)    t で例化
  $\forall$x.P(x) $\vdash$ P(t)
```

## 参考文献

- **Gentzen, G.** "Untersuchungen über das logische Schließen" _Mathematische Zeitschrift_ 39, 176-210, 405-431 (1935)
  — シーケント計算（LK, LJ）とカット除去定理の原典

- **Troelstra, A.S. & Schwichtenberg, H.** _Basic Proof Theory_ (2nd ed., Cambridge University Press, 2000)
  — シーケント計算の標準的教科書。LK/LJ の詳細な定式化と性質を解説

- **Girard, J.-Y., Lafont, Y. & Taylor, P.** _Proofs and Types_ (Cambridge University Press, 1989)
  — Chapter 3-4 でシーケント計算の基礎を解説。オンラインで無料公開

- **Takeuti, G.** _Proof Theory_ (2nd ed., North-Holland, 1987)
  — 竹内の証明論。シーケント計算とカット除去の詳細な扱い

- **Buss, S.R.** "An Introduction to Proof Theory" in _Handbook of Proof Theory_ (Elsevier, 1998)
  — シーケント計算の現代的入門

- **nLab** "sequent calculus" — <https://ncatlab.org/nlab/show/sequent+calculus>
  — オンラインリファレンス

- **Stanford Encyclopedia of Philosophy** "Proof Theory" — <https://plato.stanford.edu/entries/proof-theory/>
  — 証明論の哲学的背景
