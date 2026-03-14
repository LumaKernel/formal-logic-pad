# 述語論理の基礎 — 解答ノート

**体系:** Predicate Logic (A1-A5 + MP + Gen)

**追加公理:**

- A4 (全称例化): `all x. P(x) -> P(t)` （t が x に対して自由）
- A5 (全称分配): `all x. (phi -> psi) -> (phi -> all x. psi)` （x ∉ FV(phi)）

**追加推論規則:**

- Gen (汎化): phi から `all x. phi` を導出

**既証の補題 (命題論理):**

- Id, HS, W, C, B, DNI, DNE, MT, EFQ (Q-01〜Q-24 参照)

---

## Q-25: 全称例化の直接適用

**ゴール:** `all x. P(x) -> P(a)`

### 証明

| #   | 式                    | 根拠                     |
| --- | --------------------- | ------------------------ |
| 1   | `all x. P(x) -> P(a)` | A4 [phi := P(x), t := a] |

**ステップ数:** 1

---

## Q-26: 全称命題の推移律

**ゴール:** `all x. (P(x) -> Q(x)) -> (all x. P(x) -> all x. Q(x))`

### 証明

| #   | 式                                                                   | 根拠                                                               |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | `all x. (P(x) -> Q(x)) -> (P(x) -> Q(x))`                            | A4 [phi := P(x) -> Q(x), t := x]                                   |
| 2   | `all x. P(x) -> P(x)`                                                | A4 [phi := P(x), t := x]                                           |
| 3   | `(all x. P(x) -> P(x)) -> ((P(x) -> Q(x)) -> (all x. P(x) -> Q(x)))` | C [alpha := P(x), beta := all x. P(x), gamma := Q(x)] — 変形が必要 |

より直接的に:

| #   | 式                                        | 根拠                                                                                               |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | `all x. (P(x) -> Q(x)) -> (P(x) -> Q(x))` | A4                                                                                                 |
| 2   | `all x. P(x) -> P(x)`                     | A4                                                                                                 |
| 3   | `(P(x) -> Q(x)) -> (all x. P(x) -> Q(x))` | C で ステップ2を変形: `(all x. P(x) -> P(x))` と `(P(x) -> Q(x))` から HS で `all x. P(x) -> Q(x)` |

演繹定理的に:

- `all x. (P(x) -> Q(x))` を仮定 $\to$ ステップ1で `P(x) -> Q(x)` を得る
- `all x. P(x)` を仮定 $\to$ ステップ2で `P(x)` を得る
- MP: `Q(x)`
- Gen: `all x. Q(x)`

形式化:

| #   | 式                                        | 根拠                          |
| --- | ----------------------------------------- | ----------------------------- |
| 1   | `all x. (P(x) -> Q(x)) -> (P(x) -> Q(x))` | A4                            |
| 2   | `all x. P(x) -> P(x)`                     | A4                            |
| 3   | `P(x) -> ((P(x) -> Q(x)) -> Q(x))`        | C で A2 の結果... いや、直接: |

`(P(x) -> Q(x)) -> (all x. P(x) -> Q(x))`:
HS(ステップ2, -): B(ステップ2の逆, P(x) -> Q(x))?

| 3 | `(all x. P(x) -> P(x)) -> ((P(x) -> Q(x)) -> (all x. P(x) -> Q(x)))` | B [alpha := all x. P(x), beta := P(x), gamma := Q(x)] |
| 4 | `(P(x) -> Q(x)) -> (all x. P(x) -> Q(x))` | MP(2, 3) |
| 5 | `all x. (P(x) -> Q(x)) -> (all x. P(x) -> Q(x))` | HS(1, 4) |
| 6 | `all x. (all x. (P(x) -> Q(x)) -> (all x. P(x) -> Q(x)))` | Gen [x] — x ∉ FV(結論) なので可 |
| 7 | `all x. (all x. (P(x) -> Q(x)) -> (all x. P(x) -> Q(x))) -> (all x. (P(x) -> Q(x)) -> all x. (all x. P(x) -> Q(x)))` | A5 [phi := all x. (P(x) -> Q(x)), psi := all x. P(x) -> Q(x)] — x ∉ FV(all x. (P(x) -> Q(x))) ✓ |
| 8 | `all x. (P(x) -> Q(x)) -> all x. (all x. P(x) -> Q(x))` | MP(6, 7) |

ステップ8 は `all x. (P(x) -> Q(x)) -> all x. (all x. P(x) -> Q(x))`。これは量化子が余分。

別のアプローチ: A5 を直接使う。

| #   | 式                                        | 根拠                                            |
| --- | ----------------------------------------- | ----------------------------------------------- |
| 1   | `all x. (P(x) -> Q(x)) -> (P(x) -> Q(x))` | A4                                              |
| 2   | `all x. P(x) -> P(x)`                     | A4                                              |
| 3   | `(P(x) -> Q(x)) -> (all x. P(x) -> Q(x))` | B(2, -): HS(2, P(x) -> Q(x)): 不正確。正しくは: |

B: `(beta -> gamma) -> ((alpha -> beta) -> (alpha -> gamma))`
beta = P(x), gamma = Q(x), alpha = all x. P(x):
`(P(x) -> Q(x)) -> ((all x. P(x) -> P(x)) -> (all x. P(x) -> Q(x)))` ... 不正確。

正しくは:
`all x. P(x) -> P(x)` (2) と `P(x) -> Q(x)` の推移律:
`all x. P(x) -> Q(x)`

形式的に: HS(2, 「P(x) -> Q(x)」): `(P(x) -> Q(x)) -> (all x. P(x) -> Q(x))`

| 3 | `(all x. P(x) -> P(x)) -> ((P(x) -> Q(x)) -> (all x. P(x) -> Q(x)))` | B [beta := P(x), gamma := Q(x), alpha := all x. P(x)] |
| 4 | `(P(x) -> Q(x)) -> (all x. P(x) -> Q(x))` | MP(2, 3) |
| 5 | `all x. (P(x) -> Q(x)) -> (all x. P(x) -> Q(x))` | HS(1, 4) |

ステップ5で `all x. (P(x) -> Q(x)) -> (all x. P(x) -> Q(x))` を得た。
Gen で x について汎化:

| 6 | `all x. (all x. (P(x) -> Q(x)) -> (all x. P(x) -> Q(x)))` | Gen [x] |

ただし、ステップ5の x は自由変数として出現しているか？
`all x. (P(x) -> Q(x))` の中の x は束縛。`all x. P(x)` の中の x も束縛。`Q(x)` の x は自由。

つまりステップ5: `all x. (P(x) -> Q(x)) -> (all x. P(x) -> Q(x))` で Q(x) の x は自由。
Gen すると `all x. [all x. (P(x) -> Q(x)) -> (all x. P(x) -> Q(x))]`。
A5: `all x. [all x. (P(x) -> Q(x)) -> (all x. P(x) -> Q(x))] -> (all x. (P(x) -> Q(x)) -> all x. (all x. P(x) -> Q(x)))`

ただし A5 の条件: x ∉ FV(all x. (P(x) -> Q(x)))。`all x. (P(x) -> Q(x))` では x は束縛なので FV に含まれない。✓

| 7 | `all x. (all x. (P(x) -> Q(x)) -> (all x. P(x) -> Q(x))) -> (all x. (P(x) -> Q(x)) -> all x. (all x. P(x) -> Q(x)))` | A5 [phi := all x. (P(x) -> Q(x)), psi := all x. P(x) -> Q(x)] |
| 8 | `all x. (P(x) -> Q(x)) -> all x. (all x. P(x) -> Q(x))` | MP(6, 7) |

ステップ8 は `all x. (P(x) -> Q(x)) -> all x. (all x. P(x) -> Q(x))`。
`all x. (all x. P(x) -> Q(x))` の意味: 各 x について `all x. P(x) -> Q(x)` が成り立つ。
`all x. P(x)` は x に依存しないので、これは `all x. P(x) -> all x. Q(x)` と同等。

A5: `all x. (all x. P(x) -> Q(x)) -> (all x. P(x) -> all x. Q(x))`
条件: x ∉ FV(all x. P(x))。✓ (束縛)

| 9 | `all x. (all x. P(x) -> Q(x)) -> (all x. P(x) -> all x. Q(x))` | A5 [phi := all x. P(x), psi := Q(x)] |
| 10 | `all x. (P(x) -> Q(x)) -> (all x. P(x) -> all x. Q(x))` | HS(8, 9) |

**ステップ数:** 10 + 補題展開 = 約15

---

## Q-27: 汎化と含意の組み合わせ

**ゴール:** `(all x. P(x)) -> (all x. (Q(x) -> P(x)))`

### 証明

| #   | 式                                                                                 | 根拠                                                                    |
| --- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | `all x. P(x) -> P(x)`                                                              | A4                                                                      |
| 2   | `P(x) -> (Q(x) -> P(x))`                                                           | A1 [phi := P(x), psi := Q(x)]                                           |
| 3   | `all x. P(x) -> (Q(x) -> P(x))`                                                    | HS(1, 2)                                                                |
| 4   | `all x. (all x. P(x) -> (Q(x) -> P(x)))`                                           | Gen [x] — x ∉ FV(all x. P(x))? x は `Q(x) -> P(x)` の自由変数として出現 |
| 5   | `all x. (all x. P(x) -> (Q(x) -> P(x))) -> (all x. P(x) -> all x. (Q(x) -> P(x)))` | A5 [phi := all x. P(x), psi := Q(x) -> P(x)] — x ∉ FV(all x. P(x)) ✓    |
| 6   | `all x. P(x) -> all x. (Q(x) -> P(x))`                                             | MP(4, 5)                                                                |

**ステップ数:** 6 + HS = 約12

---

## Q-28: 全称量化子の入れ子 (順序交換)

**ゴール:** `all x. all y. P(x, y) -> all y. all x. P(x, y)`

### 証明

| #   | 式                                                                                                     | 根拠                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 1   | `all x. all y. P(x, y) -> all y. P(x, y)`                                                              | A4 [phi := all y. P(x, y), t := x]                                                         |
| 2   | `all y. P(x, y) -> P(x, y)`                                                                            | A4 [phi := P(x, y), t := y]                                                                |
| 3   | `all x. all y. P(x, y) -> P(x, y)`                                                                     | HS(1, 2)                                                                                   |
| 4   | `all x. (all x. all y. P(x, y) -> P(x, y))`                                                            | Gen [x]                                                                                    |
| 5   | `all x. (all x. all y. P(x, y) -> P(x, y)) -> (all x. all y. P(x, y) -> all x. P(x, y))`               | A5 [phi := all x. all y. P(x, y), psi := P(x, y)] — x ∉ FV(all x. all y. P(x, y)) ✓        |
| 6   | `all x. all y. P(x, y) -> all x. P(x, y)`                                                              | MP(4, 5)                                                                                   |
| 7   | `all y. (all x. all y. P(x, y) -> all x. P(x, y))`                                                     | Gen [y]                                                                                    |
| 8   | `all y. (all x. all y. P(x, y) -> all x. P(x, y)) -> (all x. all y. P(x, y) -> all y. all x. P(x, y))` | A5 [phi := all x. all y. P(x, y), psi := all x. P(x, y)] — y ∉ FV(all x. all y. P(x, y)) ✓ |
| 9   | `all x. all y. P(x, y) -> all y. all x. P(x, y)`                                                       | MP(7, 8)                                                                                   |

**ステップ数:** 9 + HS = 約18

---

## Q-29: 全称の含意分配

**ゴール:** `all x. (P(x) -> Q(x)) -> (all x. P(x) -> all x. Q(x))`

### 証明

Q-26 と同一。上記 Q-26 の証明を参照。

**ステップ数:** 約15

---

## Q-30: 空虚な全称量化

**ゴール:** `P(a) -> all x. P(a)`

### 証明

P(a) には x が自由出現しないので、Gen と A5 が直接適用可能。

| #   | 式                                               | 根拠                                           |
| --- | ------------------------------------------------ | ---------------------------------------------- |
| 1   | `P(a) -> P(a)`                                   | Id                                             |
| 2   | `all x. (P(a) -> P(a))`                          | Gen [x] — P(a) に x は自由出現しない           |
| 3   | `all x. (P(a) -> P(a)) -> (P(a) -> all x. P(a))` | A5 [phi := P(a), psi := P(a)] — x ∉ FV(P(a)) ✓ |
| 4   | `P(a) -> all x. P(a)`                            | MP(2, 3)                                       |

**ステップ数:** 4 + Id = 約9

---

## Q-31: 存在量化子の導入

**ゴール:** `P(a) -> ex x. P(x)`

**定義:** `ex x. P(x)` = `~(all x. ~P(x))`

**展開後のゴール:** `P(a) -> ~(all x. ~P(x))`

### 証明

| #   | 式                                                       | 根拠                                                                            |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | `all x. ~P(x) -> ~P(a)`                                  | A4 [phi := ~P(x), t := a]                                                       |
| 2   | `(all x. ~P(x) -> ~P(a)) -> (~~P(a) -> ~(all x. ~P(x)))` | MT [alpha := all x. ~P(x), beta := ~P(a)] — MT で対偶: `(A -> B) -> (~B -> ~A)` |

Wait: MT: `(alpha -> beta) -> (~beta -> ~alpha)`
alpha = all x. ~P(x), beta = ~P(a):
`(all x. ~P(x) -> ~P(a)) -> (~~P(a) -> ~(all x. ~P(x)))` ✓

| 3 | `~~P(a) -> ~(all x. ~P(x))` | MP(1, 2) |
| 4 | `P(a) -> ~~P(a)` | DNI |
| 5 | `P(a) -> ~(all x. ~P(x))` | HS(4, 3) |

`~(all x. ~P(x))` = `ex x. P(x)` (定義) なので:

| 5 | `P(a) -> ex x. P(x)` | HS(4, 3) |

**ステップ数:** 5 + MT + DNI + HS = 約25

---

## Q-32: 全称から存在への推論

**ゴール:** `all x. P(x) -> ex x. P(x)`

### 証明

| #   | 式                          | 根拠     |
| --- | --------------------------- | -------- |
| 1   | `all x. P(x) -> P(a)`       | A4       |
| 2   | `P(a) -> ex x. P(x)`        | Q-31     |
| 3   | `all x. P(x) -> ex x. P(x)` | HS(1, 2) |

**ステップ数:** 3 + Q-31 = 約28

---

## 既証の補題まとめ (追加分)

| 補題名         | 式                                                      | 初出 |
| -------------- | ------------------------------------------------------- | ---- |
| Dist$\forall$  | `all x. (P(x) -> Q(x)) -> (all x. P(x) -> all x. Q(x))` | Q-26 |
| $\forall$swap  | `all x. all y. P(x, y) -> all y. all x. P(x, y)`        | Q-28 |
| $\exists$intro | `P(t) -> ex x. P(x)`                                    | Q-31 |
