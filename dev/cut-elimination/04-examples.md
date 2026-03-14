# カット除去の具体例

本ドキュメントでは、カット除去アルゴリズム（[03-algorithm.md](./03-algorithm.md)）の動作を具体的な証明で追跡する。各ステップでどの変換ケース（Case 1〜4）が適用されたかを明記し、アルゴリズムの理解を確認する。

> **前提知識:**
>
> - シーケント計算（LK）の推論規則: [01-sequent-calculus.md](./01-sequent-calculus.md)
> - カット除去定理の概要: [02-cut-elimination-theorem.md](./02-cut-elimination-theorem.md)
> - カット除去アルゴリズムの疑似コード: [03-algorithm.md](./03-algorithm.md)

> **推論規則のリマインダー（本ドキュメントで使用するもの）:**
>
> ```
> ─────── (Ax)          $\Gamma \vdash \Delta \Gamma \vdash \Delta$
> A $\vdash$ A              ────────── (WL)          ────────── (WR)
>                     A, $\Gamma \vdash \Delta \Gamma \vdash \Delta$, A
>
>   $\Gamma$, B $\vdash \Delta \Gamma \vdash \Delta$, B     C, $\Sigma \vdash$ Π
> ──────────── ($\to$R)         ────────────────────────────── ($\to$L)
> $\Gamma \vdash \Delta$, B$\to$C                  B$\to$C, $\Gamma , \Sigma \vdash \Delta$, Π
>
> $\Gamma \vdash \Delta$, B    $\Gamma \vdash \Delta$, C          B, $\Gamma \vdash \Delta$
> ──────────────────────── ($\land$R)  ──────────── ($\land$L₁)
>     $\Gamma \vdash \Delta$, B$\land$C               B$\land$C, $\Gamma \vdash \Delta$
>
>   A[t/x], $\Gamma \vdash \Delta \Gamma \vdash \Delta$, A[y/x]
> ──────────────────── ($\forall$L)    ──────────────────── ($\forall$R, y は $\Gamma , \Delta$ に自由でない)
>  $\forall$x.A, $\Gamma \vdash \Delta \Gamma \vdash \Delta , \forall$x.A
>
> $\Gamma \vdash \Delta$, A    A, $\Sigma \vdash$ Π
> ─────────────────────── (Cut)
>      $\Gamma , \Sigma \vdash \Delta$, Π
> ```

---

## 1. 例1: 公理とのカット（Case 1 $\to$ Case 2a $\to$ Case 1a）

### 1.1 証明対象

```
A $\vdash$ B $\to$ A
```

### 1.2 カットを含む証明

原子式 `A` をカット式として、不必要にカットを経由する:

```
                        A $\vdash$ A (Ax)
                     ────────────── (WL)
  A $\vdash$ A (Ax)         B, A $\vdash$ A
────────────── (WR) ────────────── ($\to$R)
A $\vdash$ A, B $\to$ A        A $\vdash$ B $\to$ A
──────────────────────────────────── (Cut: A)
            A $\vdash$ B $\to$ A
```

- **カット式:** `A`（原子式、複雑度 0）
- **カット階数:** 0

### 1.3 カット除去の実行

#### ステップ1: カットの分析

- **カット式:** `A`（原子式）
- **左前提の最終規則:** `WR`（後件に `B $\to$ A` を追加）
- カット式 `A` は WR で追加された式ではなく、WR の前提 `A $\vdash$ A` の後件にある元の式
- **適用ケース:** **Case 2a（非主式、左を上に持ち上げ）**

WR はカット式 `A` に触れていないため、WR をカットの外側に持ち上げる。

#### ステップ2: Case 2a の適用

WR の前提 `A $\vdash$ A` を新たな左前提としてカットを構成し、WR を外側に移す:

```
A $\vdash$ A (Ax)     A $\vdash$ B $\to$ A
──────────────────────────── (Cut: A)
         A $\vdash$ B $\to$ A
     ─────────────────── (WR: B $\to$ A を追加)
     A $\vdash$ B $\to$ A, B $\to$ A
```

ここで新しいカット `A $\vdash$ A` と `A $\vdash$ B $\to$ A` のカットが残っている。

#### ステップ3: Case 1a の適用

新しいカットの左前提は公理 `A $\vdash$ A`:

```
A $\vdash$ A (Ax)     A $\vdash$ B $\to$ A
──────────────────────────── (Cut: A)
         A $\vdash$ B $\to$ A
```

- **左前提:** `A $\vdash$ A` — 公理
- **適用ケース:** **Case 1a（左が公理）**

Case 1a: 左前提が公理の場合、右前提の証明がそのまま結果になる。

結果: `A $\vdash$ B $\to$ A`（右前提の証明がそのまま）

#### 最終結果: カットなし証明

```
   A $\vdash$ A (Ax)
────────────── (WL)
  B, A $\vdash$ A
────────────── ($\to$R)
 A $\vdash$ B $\to$ A
```

カットを除去した結果、元の右前提の証明そのものが得られた。

**まとめ:**

| ステップ | 適用ケース                          | カット式 | 複雑度 |
| -------- | ----------------------------------- | -------- | ------ |
| 1        | Case 2a（非主式、左を上に持ち上げ） | A        | 0      |
| 2        | Case 1a（公理とのカット）           | A        | 0      |

---

## 2. 例2: 含意の主式カット（Case 3.2）

### 2.1 証明対象

```
A $\vdash$ A
```

### 2.2 カットを含む証明

`A $\to$ A` をカット式として、不必要にカットを経由する:

```
                                     A $\vdash$ A (Ax)
                                   ────────────── (WL)
  A $\vdash$ A (Ax)              A $\vdash$ A (Ax)    A, A $\vdash$ A
────────────── ($\to$R)      ──────────────────────────── ($\to$L: A $\to$ A)
 $\vdash$ A $\to$ A                      A $\to$ A, A $\vdash$ A
──────────────────────────────────────────────── (Cut: A $\to$ A)
                    A $\vdash$ A
```

**$\to$L の確認:**

`$\to$L` で `B $\to$ C = A $\to$ A`（B = A, C = A）を分解:

- 左前提: `A $\vdash$ A`（$\Gamma$ = {A}, $\Delta$ = ∅。B = A が後件にある）
- 右前提: `A, A $\vdash$ A`（C = A が前件、$\Sigma$ = {A}, Π = ∅）
- 結論: `A $\to$ A, A $\vdash$ A`

- **カット式:** `A $\to$ A`（含意、複雑度 1）

### 2.3 カット除去の実行

#### ステップ1: カットの分析

- **カット式:** `A $\to$ A`（含意、複雑度 1）
- **左前提の最終規則:** `$\to$R` — カット式 `A $\to$ A` は `$\to$R` で導入 $\to$ **主式**
- **右前提の最終規則:** `$\to$L` — カット式 `A $\to$ A` は `$\to$L` で分解 $\to$ **主式**
- 両方で主式 $\to$ **Case 3.2（含意の主式カット）**

#### ステップ2: Case 3.2 の適用

カット式 `B $\to$ C`（B = A, C = A）の分解:

```
左の $\to$R の前提:   A $\vdash$ A        ($\Gamma$ = ∅, B = A, $\Delta$ = ∅, C = A)
右の $\to$L の左前提: A $\vdash$ A        ($\Sigma$ = {A}, Π = ∅, B が後件にある)
右の $\to$L の右前提: A, A $\vdash$ A     (C = A が前件, $\Sigma$' = {A}, Π' = ∅)
```

Case 3.2 の変換: 2つの小さいカットに分解

```
第1カット Cut(C = A):
  左:  $\to$R の前提      = A $\vdash$ A
  右:  $\to$L の右前提    = A, A $\vdash$ A

第2カット Cut(B = A):
  左:  $\to$L の左前提    = A $\vdash$ A
  右:  第1カットの結果
```

**変換後の証明:**

```
                    A $\vdash$ A (Ax)    A, A $\vdash$ A (WL of Ax)
                  ──────────────────────────────────── (Cut: A)
A $\vdash$ A (Ax)                    A $\vdash$ A
──────────────────────────────────────── (Cut: A)
               A $\vdash$ A
```

両方のカット式は `A`（原子式、複雑度 0）。元のカット式 `A $\to$ A` は複雑度 1 だったので、カット式の複雑度が **厳密に減少**。

#### ステップ3: 第1カットの除去（Case 1a）

```
A $\vdash$ A (Ax)    A, A $\vdash$ A
──────────────────────── (Cut: A)
         A $\vdash$ A
```

- **左前提:** `A $\vdash$ A` — 公理
- **適用ケース:** **Case 1a（左が公理）**

Case 1a: 右前提の前件からカット式 `A` の1つの出現を取り除いた証明が結果。
`A, A $\vdash$ A` は `A $\vdash$ A` の WL なので、取り除くと `A $\vdash$ A`。

結果: `A $\vdash$ A`

#### ステップ4: 第2カットの除去（Case 1a）

```
A $\vdash$ A (Ax)    A $\vdash$ A
──────────────────────── (Cut: A)
         A $\vdash$ A
```

- **左前提:** `A $\vdash$ A` — 公理
- **適用ケース:** **Case 1a（左が公理）**

結果: `A $\vdash$ A`

#### 最終結果: カットなし証明

```
A $\vdash$ A (Ax)
```

**まとめ:**

| ステップ | 適用ケース                   | カット式  | 複雑度 |
| -------- | ---------------------------- | --------- | ------ |
| 1        | Case 3.2（含意の主式カット） | A $\to$ A | 1      |
| 2        | Case 1a（公理とのカット）    | A         | 0      |
| 3        | Case 1a（公理とのカット）    | A         | 0      |

カット式の複雑度: 1 $\to$ 0 $\to$ 0（単調減少）。3ステップで完了。

---

## 3. 例3: 全称量化子を含むカット除去（Case 2b $\to$ Case 3.5）

### 3.1 証明対象

```
$\forall$x.P(x) $\vdash \forall$x.P(x)
```

### 3.2 カットを含む証明

`$\forall$x.P(x)` をカット式として、同じシーケントを2つの別々の証明から合成する:

**左前提の証明:**

```
  P(y) $\vdash$ P(y) (Ax)
──────────────────── ($\forall$L: t = y)
 $\forall$x.P(x) $\vdash$ P(y)
──────────────────── ($\forall$R: 固有変数 y — $\forall$x.P(x) に y は自由でない ✓)
$\forall$x.P(x) $\vdash \forall$x.P(x)
```

**右前提の証明:**

```
  P(z) $\vdash$ P(z) (Ax)
──────────────────── ($\forall$L: t = z)
 $\forall$x.P(x) $\vdash$ P(z)
──────────────────── ($\forall$R: 固有変数 z — $\forall$x.P(x) に z は自由でない ✓)
$\forall$x.P(x) $\vdash \forall$x.P(x)
```

**カットを含む証明図:**

```
$\forall$x.P(x) $\vdash \forall$x.P(x)        $\forall$x.P(x) $\vdash \forall$x.P(x)
────────────────────────────────────────────────── (Cut: $\forall$x.P(x))
              $\forall$x.P(x) $\vdash \forall$x.P(x)
```

- **カット式:** `$\forall$x.P(x)`（全称量化式、複雑度 1）

### 3.3 カット除去の実行

#### ステップ1: カットの分析

- **カット式:** `$\forall$x.P(x)`（全称量化式、複雑度 1）
- **左前提の最終規則:** `$\forall$R`（後件に `$\forall$x.P(x)` を導入）$\to$ カット式が **主式**
- **右前提の最終規則:** `$\forall$R`（後件に `$\forall$x.P(x)` を導入）$\to$ カット式は **前件** にあるので、$\forall$R にとって非主式
- 右前提でカット式は非主式 $\to$ **Case 2b（非主式、右を上に持ち上げ）**

#### ステップ2: Case 2b の適用

右前提の最終規則 `$\forall$R` をカットの外側に持ち上げる:

```
$\forall$x.P(x) $\vdash \forall$x.P(x)    $\forall$x.P(x) $\vdash$ P(z) ($\forall$R の前提)
────────────────────────────────────────────────────── (Cut: $\forall$x.P(x))
                $\forall$x.P(x) $\vdash$ P(z)
             ──────────────────── ($\forall$R: z)
              $\forall$x.P(x) $\vdash \forall$x.P(x)
```

新しいカット: 左前提 `$\forall$x.P(x) $\vdash \forall$x.P(x)` と右前提 `$\forall$x.P(x) $\vdash$ P(z)`

#### ステップ3: 新カットの分析

右前提 `$\forall$x.P(x) $\vdash$ P(z)` は `$\forall$L` で導出されている（`P(z) $\vdash$ P(z)` から）。

- **カット式:** `$\forall$x.P(x)`（複雑度 1）
- **左前提の最終規則:** `$\forall$R` $\to$ カット式が **主式**（後件に導入）
- **右前提の最終規則:** `$\forall$L` $\to$ カット式が **主式**（前件で分解）
- 両方で主式 $\to$ **Case 3.5（全称量化の主式カット）**

#### ステップ4: Case 3.5 の適用

Case 3.5:

```
カット式: $\forall$x.B  (B = P(x))

左の $\forall$R の前提: $\forall$x.P(x) $\vdash$ P(y)    (固有変数 y)
右の $\forall$L の前提: P(z) $\vdash$ P(z)        (項 t = z)
```

変換: 固有変数 `y` を項 `t = z` で置換し、`P(z)` でカットする:

- 左の前提を `y $\to$ z` で置換: `$\forall$x.P(x) $\vdash$ P(z)`
- 右の $\forall$L の前提: `P(z) $\vdash$ P(z)`

```
$\forall$x.P(x) $\vdash$ P(z)    P(z) $\vdash$ P(z) (Ax)
───────────────────────────────────── (Cut: P(z))
          $\forall$x.P(x) $\vdash$ P(z)
```

カット式が `P(z)`（原子式、複雑度 0）に **複雑度が減少**。

左前提を展開:

```
  P(z) $\vdash$ P(z) (Ax)
──────────────────── ($\forall$L: t = z)
 $\forall$x.P(x) $\vdash$ P(z)          P(z) $\vdash$ P(z) (Ax)
──────────────────────────────────────────── (Cut: P(z))
            $\forall$x.P(x) $\vdash$ P(z)
```

#### ステップ5: Case 2a の適用

- **カット式:** `P(z)`（原子式）
- **左前提の最終規則:** `$\forall$L` — カット式 `P(z)` は $\forall$L の前提の後件から来た式 $\to$ 非主式
- **適用ケース:** **Case 2a（非主式、左を上に持ち上げ）**

$\forall$L をカットの外側に持ち上げる:

```
P(z) $\vdash$ P(z) (Ax)    P(z) $\vdash$ P(z) (Ax)
──────────────────────────────────────── (Cut: P(z))
           P(z) $\vdash$ P(z)
        ──────────────── ($\forall$L: t = z)
         $\forall$x.P(x) $\vdash$ P(z)
```

#### ステップ6: Case 1a の適用

```
P(z) $\vdash$ P(z) (Ax)    P(z) $\vdash$ P(z) (Ax)
──────────────────────────────────────── (Cut: P(z))
           P(z) $\vdash$ P(z)
```

- **左前提:** 公理 $\to$ **Case 1a**

結果: `P(z) $\vdash$ P(z)`

#### 最終結果: カットなし証明

ステップ2で外側に出した $\forall$R と、ステップ5で外側に出した $\forall$L を組み合わせる:

```
  P(z) $\vdash$ P(z) (Ax)
──────────────────── ($\forall$L: t = z)
 $\forall$x.P(x) $\vdash$ P(z)
──────────────────── ($\forall$R: 固有変数 z)
$\forall$x.P(x) $\vdash \forall$x.P(x)
```

**まとめ:**

| ステップ | 適用ケース                          | カット式                   | 複雑度    |
| -------- | ----------------------------------- | -------------------------- | --------- |
| 1        | Case 2b（非主式、右を上に持ち上げ） | $\forall$x.P(x)            | 1         |
| 2        | Case 3.5（全称量化の主式カット）    | $\forall$x.P(x) $\to$ P(z) | 1 $\to$ 0 |
| 3        | Case 2a（非主式、左を上に持ち上げ） | P(z)                       | 0         |
| 4        | Case 1a（公理とのカット）           | P(z)                       | 0         |

---

## 4. 例4: 複数のカットが入れ子になっている場合

### 4.1 証明対象

```
A $\vdash$ A
```

### 4.2 カットを含む証明

`A $\land$ A`（内側のカット）と `A $\to$ A`（外側のカット）の2つの補題を入れ子に経由する:

**内側のカット:**

```
                             A $\land$ A $\vdash$ A $\land$ A (Ax)
A $\vdash$ A (Ax)   A $\vdash$ A (Ax)   ──────────────────── ($\land$L₁)
────────────────────────── ($\land$R)    A $\land$ A $\vdash$ A
      A $\vdash$ A $\land$ A
──────────────────────────────────────────────── (Cut: A $\land$ A)
                  A $\vdash$ A
```

**外側のカット:**

```
                                               A $\vdash$ A (Ax)
                                            ────────────── (WL)
                               A $\vdash$ A (Ax)    A, A $\vdash$ A
  [内側カット $\to$ A $\vdash$ A]       ──────────────────────────── ($\to$L: A $\to$ A)
 ────────────── ($\to$R)              A $\to$ A, A $\vdash$ A
  $\vdash$ A $\to$ A
──────────────────────────────────────────────── (Cut: A $\to$ A)
                    A $\vdash$ A
```

- **カット階数:** 1（`A $\to$ A` と `A $\land$ A` はともに複雑度 1）

### 4.3 カット除去の実行

アルゴリズムはボトムアップで処理するため、**内側（葉に近い）のカットから先に処理**する。

#### フェーズ1: 内側のカット除去（Cut: A $\land$ A）

##### ステップ1: カットの分析

- **カット式:** `A $\land$ A`（連言、複雑度 1）
- **左前提の最終規則:** `$\land$R` $\to$ カット式 `A $\land$ A` が主式
- **右前提の最終規則:** `$\land$L₁` $\to$ カット式 `A $\land$ A` が主式
- 両方で主式 $\to$ **Case 3.3（連言の主式カット）**

##### ステップ2: Case 3.3 の適用

カット式 `B $\land$ C`（B = A, C = A）:

- $\land$R の左前提: `A $\vdash$ A` (B = A を後件に持つ)
- $\land$R の右前提: `A $\vdash$ A` (C = A を後件に持つ)
- $\land$L₁ の前提: `A $\vdash$ A` (B = A を前件に持つ)

$\land$L₁ は左の連言成分 B を取るので、B = A でカット:

```
A $\vdash$ A (Ax, $\land$R の左前提)    A $\vdash$ A (Ax, $\land$L₁ の前提)
────────────────────────────────────────────────────── (Cut: A)
                    A $\vdash$ A
```

カット式が `A`（原子式、複雑度 0）に減少。

##### ステップ3: Case 1a の適用

- **左前提:** `A $\vdash$ A` — 公理 $\to$ **Case 1a**
- 結果: `A $\vdash$ A`

**内側のカット除去完了。**

#### フェーズ2: 外側のカット除去（Cut: A $\to$ A）

内側のカット除去後、左前提は:

```
  A $\vdash$ A (Ax)
────────────── ($\to$R)
 $\vdash$ A $\to$ A
```

外側のカット:

```
 $\vdash$ A $\to$ A                    A $\to$ A, A $\vdash$ A
────────────────────────────────────────── (Cut: A $\to$ A)
              A $\vdash$ A
```

##### ステップ4: カットの分析

- **カット式:** `A $\to$ A`（含意、複雑度 1）
- **左前提の最終規則:** `$\to$R` $\to$ カット式 `A $\to$ A` が主式
- **右前提の最終規則:** `$\to$L` $\to$ カット式 `A $\to$ A` が主式
- 両方で主式 $\to$ **Case 3.2（含意の主式カット）**

##### ステップ5: Case 3.2 の適用

（例2と同じパターン。B = A, C = A）

- $\to$R の前提: `A $\vdash$ A`
- $\to$L の左前提: `A $\vdash$ A`
- $\to$L の右前提: `A, A $\vdash$ A`

2つのカットに分解:

```
                 A $\vdash$ A (Ax)    A, A $\vdash$ A (WL of Ax)
               ──────────────────────────────────── (Cut: A)
A $\vdash$ A (Ax)                  A $\vdash$ A
──────────────────────────────────── (Cut: A)
             A $\vdash$ A
```

##### ステップ6: 第1カット — Case 1a

左前提が公理 $\to$ 結果: `A $\vdash$ A`

##### ステップ7: 第2カット — Case 1a

左前提が公理 $\to$ 結果: `A $\vdash$ A`

#### 最終結果: カットなし証明

```
A $\vdash$ A (Ax)
```

**まとめ:**

| フェーズ  | ステップ | 適用ケース                   | カット式            | 複雑度    |
| --------- | -------- | ---------------------------- | ------------------- | --------- |
| 1（内側） | 1-2      | Case 3.3（連言の主式カット） | A $\land$ A $\to$ A | 1 $\to$ 0 |
| 1（内側） | 3        | Case 1a（公理とのカット）    | A                   | 0         |
| 2（外側） | 4-5      | Case 3.2（含意の主式カット） | A $\to$ A $\to$ A   | 1 $\to$ 0 |
| 2（外側） | 6        | Case 1a（公理とのカット）    | A                   | 0         |
| 2（外側） | 7        | Case 1a（公理とのカット）    | A                   | 0         |

処理順序: 内側（葉に近い）カットから先に処理 $\to$ 外側のカット。

---

## 5. 証明サイズの増大について

### 5.1 上の例での観察

上の例では、カット除去による証明サイズの増大は穏やかだった:

| 例                    | カットあり証明のノード数 | カットなし証明のノード数 | 変化 |
| --------------------- | ------------------------ | ------------------------ | ---- |
| 例1（公理カット）     | 6                        | 3                        | 減少 |
| 例2（含意カット）     | 7                        | 1                        | 減少 |
| 例3（全称量化カット） | 8                        | 3                        | 減少 |
| 例4（入れ子カット）   | 12                       | 1                        | 減少 |

これらの例では、カット除去で証明がむしろ**小さく**なった。これは「不必要な遠回り」を除去した結果である。

### 5.2 証明が爆発的に大きくなるケース

しかし、カットが本質的に必要な場合（すなわち、カットによって証明が大幅に短縮されている場合）、カット除去で証明サイズが**指数的に増大**する。

**典型的なパターン: 縮約（Contraction）との組み合わせ**

カット除去の Case 4c（縮約とのカット）では:

```
Cut(A):
  左:  ... $\vdash$ A, A  (A が後件に2回)
  右:  A, A, ... $\vdash$ ...  (A が前件に2回 $\to$ 縮約で1つに)
```

この場合、1つのカットが2つのカットに分解され、それぞれの部分証明が**複製**される。これを n 回繰り返すと、証明サイズは 2^n 倍になりうる。

**理論的下界（Statman 1979）:**

カット除去によるLKの証明サイズの増大は、一般に**非初等的**（non-elementary）、すなわち:

```
サイズ増大 ≥ 2^(2^(2^...^n))   （2のタワー、高さ n に比例）
```

これは、カットが「圧縮」の役割を果たしており、繰り返し使われる補題を1度だけ証明して参照できるためである。カット除去はこの圧縮を解いて展開するため、本質的にサイズが爆発する。

### 5.3 教訓

- カット除去定理は**存在定理**として重要（カットなしの証明が存在することを保証）
- 部分式性やその帰結（一貫性証明、決定手続き等）の理論的基盤を提供
- 実用的には、カットを含む証明のほうが**遥かに小さく**効率的
- 自動証明探索では、カットなし証明の探索空間が限定されるメリットがある

> **参考:** Statman, R. "Lower bounds on Herbrand's theorem." Proceedings of the AMS, 1979.
> Orevkov, V.P. "Lower bounds for increasing complexity of derivations after cut elimination." Journal of Soviet Mathematics, 1982.

---

## 参考文献

- [01-sequent-calculus.md](./01-sequent-calculus.md) — シーケント計算の基礎
- [02-cut-elimination-theorem.md](./02-cut-elimination-theorem.md) — カット規則とカット除去定理
- [03-algorithm.md](./03-algorithm.md) — カット除去アルゴリズムの疑似コード
- Gentzen, G. "Untersuchungen über das logische Schließen." Mathematische Zeitschrift, 39(1), 176–210, 1935.
- Troelstra, A.S., Schwichtenberg, H. "Basic Proof Theory." 2nd ed., Cambridge University Press, 2000.
- Girard, J.-Y., Lafont, Y., Taylor, P. "Proofs and Types." Cambridge University Press, 1989. Chapter 13.
- Statman, R. "Lower bounds on Herbrand's theorem." Proceedings of the AMS, 75(1), 104–107, 1979.
