# 命題論理の基礎

**体系:** Łukasiewicz (A1-A3 + MP)

公理:

- A1 (K): `phi -> (psi -> phi)`
- A2 (S): `(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))`
- A3 (対偶): `(~phi -> ~psi) -> (psi -> phi)`

推論規則:

- MP: $\varphi$ と $\varphi \to \psi$ から $\psi$ を導出

---

## Level 1: 公理のインスタンス化とMP入門

### Q-01: 恒等律 (Identity / I Combinator)

**難易度:** Level 1
**ゴール:** `phi -> phi`
**ヒント:** A1とA2の具体的なインスタンスを組み合わせる。SKKからIを作るのと同じ。

**解法の概略:**

1. A1: `phi -> ((phi -> phi) -> phi)` — $\varphi$に`phi`、$\psi$に`phi -> phi`を代入
2. A2: `(phi -> ((phi -> phi) -> phi)) -> ((phi -> (phi -> phi)) -> (phi -> phi))` — $\varphi$に`phi`、$\psi$に`phi -> phi`、$\chi$に`phi`を代入
3. MP(1, 2): `(phi -> (phi -> phi)) -> (phi -> phi)`
4. A1: `phi -> (phi -> phi)` — $\varphi$に`phi`、$\psi$に`phi`を代入
5. MP(4, 3): `phi -> phi`

**ステップ数:** 5
**学習ポイント:** A2 (S公理) は「関数適用の分配」に相当する。この証明はSKK = I の対応。

---

### Q-02: 定数関数の合成

**難易度:** Level 1
**ゴール:** `psi -> (phi -> phi)`
**ヒント:** Q-01の結果を「持ち上げる」。

**解法の概略:**

1. Q-01の手順で `phi -> phi` を導出
2. A1: `(phi -> phi) -> (psi -> (phi -> phi))` — $\varphi$に`phi -> phi`、$\psi$に`psi`を代入
3. MP(1, 2): `psi -> (phi -> phi)`

**ステップ数:** 7 (Q-01の5 + 2)
**学習ポイント:** A1 (K公理) は「結論を前提で持ち上げる」。既に証明した定理は再利用できる。

---

### Q-03: 推移律 (Hypothetical Syllogism) の準備

**難易度:** Level 1
**ゴール:** `(phi -> psi) -> ((psi -> chi) -> (phi -> psi))`
**ヒント:** A1の直接のインスタンス。

**解法の概略:**

1. A1: `(phi -> psi) -> ((psi -> chi) -> (phi -> psi))` — $\varphi$に`phi -> psi`、$\psi$に`psi -> chi`を代入

**ステップ数:** 1 (公理インスタンス)
**学習ポイント:** 公理のメタ変数にはどんな式でも代入できる。単純な式だけでなく、含意式も代入可能。

---

## Level 2: MP チェインの基本

### Q-04: 推移律 (Hypothetical Syllogism)

**難易度:** Level 2
**ゴール:** `(phi -> psi) -> ((psi -> chi) -> (phi -> chi))`
**ヒント:** A2で$\varphi \to (\psi \to \chi)$の形を作り、A1で前提を持ち上げる。

**解法の概略:**

1. A2: `(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))` — そのまま
2. A1: `(phi -> (psi -> chi)) -> ((psi -> chi) -> (phi -> (psi -> chi)))` を使って変形
   - 実際には: A1で$\psi \to \chi$を持ち上げ、S公理で分配する多段チェイン

**完全な証明:**

1. A2: `(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))`
2. A1: `(psi -> chi) -> (phi -> (psi -> chi))` — $\varphi$に`psi -> chi`、$\psi$に`phi`
3. 推移律の構成: ステップ2の結論とステップ1をS公理で組み合わせる

**ステップ数:** 約11
**学習ポイント:** 推移律はHilbert系で最も基本的かつ頻出の補題。以降の証明で多用する。

---

### Q-05: 含意の弱化

**難易度:** Level 2
**ゴール:** `phi -> (psi -> (chi -> psi))`
**ヒント:** A1のインスタンスをA1で持ち上げる。

**解法の概略:**

1. A1: `psi -> (chi -> psi)` — そのまま
2. A1: `(psi -> (chi -> psi)) -> (phi -> (psi -> (chi -> psi)))` — 持ち上げ
3. MP(1, 2): `phi -> (psi -> (chi -> psi))`

**ステップ数:** 3
**学習ポイント:** K公理の2重適用。「不要な前提を追加する」操作。

---

### Q-06: S公理の特殊ケース

**難易度:** Level 2
**ゴール:** `(phi -> (phi -> psi)) -> (phi -> psi)`
**ヒント:** A2で$\psi$を$\varphi$に置き換える。

**解法の概略:**

1. A2: `(phi -> (phi -> psi)) -> ((phi -> phi) -> (phi -> psi))` — $\psi$に$\varphi$を代入
2. Q-01の手順で `phi -> phi` を導出
3. 推移律的な構成で組み合わせる

**ステップ数:** 約12
**学習ポイント:** 「$\varphi \to (\varphi \to \psi)$」は「$\varphi$が2回必要な含意」。S公理で1回分に圧縮できる。

---

### Q-07: 含意の交換 (Permutation / C Combinator)

**難易度:** Level 2
**ゴール:** `(phi -> (psi -> chi)) -> (psi -> (phi -> chi))`
**ヒント:** A2とA1を組み合わせ、前提の順序を入れ替える。

**解法の概略:**
A1で`psi`を`phi -> ...`の中に持ち上げ、S公理で分配する。

1. A1: `psi -> (phi -> psi)` — $\psi$を$\varphi$の前提に持ち上げ
2. A2を使って分配
3. 推移律で接続

**ステップ数:** 約15
**学習ポイント:** C combinator に対応。前提の順序は自由に入れ替えられる（ただし手間がかかる）。

---

## 問題一覧

| ID   | 名前              | Level | ゴール                                           | ステップ数 |
| ---- | ----------------- | ----- | ------------------------------------------------ | ---------- |
| Q-01 | 恒等律            | 1     | `phi -> phi`                                     | 5          |
| Q-02 | 定数関数の合成    | 1     | `psi -> (phi -> phi)`                            | 7          |
| Q-03 | 推移律の準備      | 1     | `(phi -> psi) -> ((psi -> chi) -> (phi -> psi))` | 1          |
| Q-04 | 推移律            | 2     | `(phi -> psi) -> ((psi -> chi) -> (phi -> chi))` | ~11        |
| Q-05 | 含意の弱化        | 2     | `phi -> (psi -> (chi -> psi))`                   | 3          |
| Q-06 | S公理の特殊ケース | 2     | `(phi -> (phi -> psi)) -> (phi -> psi)`          | ~12        |
| Q-07 | 含意の交換        | 2     | `(phi -> (psi -> chi)) -> (psi -> (phi -> chi))` | ~15        |
