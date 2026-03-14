# 命題論理の上級

**体系:** Łukasiewicz (A1-A3 + MP)
**前提:** 01, 02 の問題群を完了していること

ここでは否定公理 A3 を本格的に活用する。
A3: `(~phi -> ~psi) -> (psi -> phi)` は対偶の原理を表す。

---

## Level 3: 否定の基本

### Q-15: 二重否定導入 (Double Negation Introduction)

**難易度:** Level 3
**ゴール:** `phi -> ~~phi`
**ヒント:** A3で`phi`に`~phi`、`psi`に`phi`を代入し、恒等律と組み合わせる。

**解法の概略:**

1. A3: `(~~phi -> ~phi) -> (phi -> ~phi)` のインスタンスを利用（ただし方向に注意）
2. 実際は A3: `(~phi -> ~psi) -> (psi -> phi)` に$\varphi = \lnot \varphi$、$\psi = \varphi$を代入:
   `(~~phi -> ~phi) -> (phi -> ~phi)` — これは使えない方向
3. 正しいアプローチ: A3 に$\varphi = \varphi$、$\psi = \lnot \varphi$を代入:
   `(~phi -> ~~phi) -> (~phi -> phi)` — これも違う
4. 最終的に: A1で `phi -> (~phi -> phi)` を作り、A3の適切なインスタンスと組み合わせる

**正しい証明:**

1. A1: `phi -> (~phi -> phi)` — $\varphi$を$\varphi$、$\psi$を$\lnot \varphi$に
2. A3: `(~(~phi) -> ~phi) -> (phi -> ~~phi)` — ($\lnot \lnot \varphi \to \lnot \varphi) \to (\varphi \to \lnot \lnot \varphi$) — $\varphi$を~~phi、$\psi$をphiに
   これも使いにくい。もう少し工夫が必要。
3. 恒等律 `~phi -> ~phi` を利用
4. A3: `(~phi -> ~phi) -> (phi -> phi)` ではなく
   A3($\varphi$=~~phi, $\psi$=phi): `(~~~phi -> ~phi) -> (phi -> ~~phi)` ...

   実際の証明は多段階になる。完全な証明は解答ノートで提供する。

**ステップ数:** 約15
**学習ポイント:** 二重否定導入は古典論理の基本。A3の使い方の典型例。

---

### Q-16: Modus Tollens

**難易度:** Level 3
**ゴール:** `(phi -> psi) -> (~psi -> ~phi)`
**ヒント:** 対偶はA3の「逆」。A3と推移律を組み合わせる。

**解法の概略:**

1. A3: `(~phi -> ~psi) -> (psi -> phi)` — 対偶の形
2. 含意の交換 (Q-07) と推移律を使って、前提と結論の並び替え
3. 二重否定の処理

**ステップ数:** 約20
**学習ポイント:** Modus Tollens (否定的推論) は対偶の直接的な帰結。

---

### Q-17: 二重否定除去 (Double Negation Elimination)

**難易度:** Level 3
**ゴール:** `~~phi -> phi`
**ヒント:** A3のインスタンスを直接利用する。

**解法の概略:**

1. `~phi -> ~phi` を恒等律 (Q-01の$\lnot \varphi$版) で証明
2. A3($\varphi$=phi, $\psi$=~phi): `(~phi -> ~~phi) -> (~phi -> phi)` — 違う方向
   A3を確認: `(~$\varphi \to$ ~$\psi) \to (\psi \to \varphi$)`
   $\varphi$=phi, $\psi$=~phi: `(~phi -> ~~~phi) -> (~~phi -> phi)`
   これは二重否定除去の証明の一部になる
3. 恒等律 + 二重否定導入 + A3 の組み合わせ

**ステップ数:** 約18
**学習ポイント:** DNE (Double Negation Elimination) は古典論理と直観主義論理を分ける分水嶺。Łukasiewicz系では A3 から導出可能。

---

## Level 4: 否定と含意の相互作用

### Q-18: 爆発律 (Ex Falso Quodlibet)

**難易度:** Level 4
**ゴール:** `~phi -> (phi -> psi)`
**ヒント:** A3を使って「矛盾から何でも出る」ことを示す。

**解法の概略:**

1. A1: `~phi -> (~~psi -> ~phi)` — $\lnot \varphi$を前提に持ち上げ
2. A3($\varphi$=psi, $\psi$=phi): `(~psi -> ~phi) -> (phi -> psi)`
   実際は A3: `(~$\varphi \to$ ~$\psi) \to (\psi \to \varphi$)` の$\varphi$=psi, $\psi$=phi:
   `(~psi -> ~phi) -> (phi -> psi)`
3. 推移律と二重否定で接続

**ステップ数:** 約20
**学習ポイント:** 古典論理では矛盾からはどんな命題も導出できる。「爆発律」の名の通り。

---

### Q-19: 対偶の逆 (Converse Contraposition)

**難易度:** Level 4
**ゴール:** `(~psi -> ~phi) -> (phi -> psi)`
**ヒント:** これはA3そのもの。

**解法の概略:**

1. A3のインスタンス。

**ステップ数:** 1
**学習ポイント:** A3がまさにこの形であることを再確認。

---

### Q-20: 排中律 (Law of Excluded Middle)

**難易度:** Level 4
**ゴール:** `~phi \/ phi`
**ヒント:** 選言 `$\alpha \lor \beta$` は `$\lnot \alpha \to \beta$` として定義される。つまりゴールは `~~phi -> phi`。

**解法の概略:**
定義により `~phi \/ phi` = `~~phi -> phi` = 二重否定除去 (Q-17)。
よって Q-17 と同一の証明。

**ステップ数:** 約18
**学習ポイント:** 選言の定義 `$\alpha \lor \beta \equiv \lnot \alpha \to \beta$` を使えば、排中律は二重否定除去と等価。

---

### Q-21: Peirce の法則

**難易度:** Level 4
**ゴール:** `((phi -> psi) -> phi) -> phi`
**ヒント:** 古典論理に特有の法則。A3（対偶）を複数回使う複雑な証明が必要。

**解法の概略:**

1. A3 を使って否定を導入・除去する多段階の証明
2. 推移律、含意の交換、二重否定除去を組み合わせる

**ステップ数:** 約30
**学習ポイント:** Peirce の法則は古典論理と直観主義論理を分ける等価条件のひとつ。排中律、DNEと等価。

---

## Level 5: 挑戦問題

### Q-22: 連言の導入 (Conjunction Introduction の模倣)

**難易度:** Level 5
**ゴール:** `phi -> (psi -> (phi /\ psi))`
**ヒント:** 連言 `$\alpha \land \beta$` は `$\lnot (\alpha \to \lnot \beta)$` として定義される。つまりゴールは `phi -> (psi -> ~(phi -> ~psi))`。

**解法の概略:**

1. 定義を展開: `phi -> (psi -> ~(phi -> ~psi))`
2. A1, A2, A3 と二重否定の処理を組み合わせる
3. 非常に長い証明になる

**ステップ数:** 40以上
**学習ポイント:** Hilbert系で連言を直接扱うのは非常に手間がかかる。自然演繹の方がはるかに簡潔。

---

### Q-23: 連言の除去 (Conjunction Elimination の模倣)

**難易度:** Level 5
**ゴール:** `(phi /\ psi) -> phi`
**ヒント:** `$\varphi \land \psi \equiv \lnot (\varphi \to \lnot \psi)$` を展開し、二重否定除去を使う。

**解法の概略:**

1. ゴール: `~(phi -> ~psi) -> phi`
2. 対偶を取って変形
3. A1, A3, 推移律の組合せ

**ステップ数:** 約25
**学習ポイント:** 連言の除去も定義の展開が必要。左射影 ($\varphi \land \psi \to \varphi$) と右射影 ($\varphi \land \psi \to \psi$) は別々に証明する。

---

### Q-24: De Morgan の法則 (一方向)

**難易度:** Level 5
**ゴール:** `~(phi \/ psi) -> (~phi /\ ~psi)`
**ヒント:** 選言と連言の定義を展開し、否定の性質を使う。

**解法の概略:**
定義展開:

- `~(phi \/ psi)` = `~(~phi -> psi)`
- `~phi /\ ~psi` = `~(~phi -> ~~psi)`

1. `~(~phi -> psi) -> ~(~phi -> ~~psi)` を示す
2. 二重否定導入 `psi -> ~~psi` を使って内部を変形

**ステップ数:** 40以上
**学習ポイント:** De Morgan の法則は命題論理の重要な等価性。Hilbert系では証明が非常に長くなる典型例。

---

## 問題一覧

| ID   | 名前             | Level | ゴール                            | ステップ数 |
| ---- | ---------------- | ----- | --------------------------------- | ---------- |
| Q-15 | 二重否定導入     | 3     | `phi -> ~~phi`                    | ~15        |
| Q-16 | Modus Tollens    | 3     | `(phi -> psi) -> (~psi -> ~phi)`  | ~20        |
| Q-17 | 二重否定除去     | 3     | `~~phi -> phi`                    | ~18        |
| Q-18 | 爆発律           | 4     | `~phi -> (phi -> psi)`            | ~20        |
| Q-19 | 対偶の逆         | 4     | `(~psi -> ~phi) -> (phi -> psi)`  | 1          |
| Q-20 | 排中律           | 4     | `~phi \/ phi`                     | ~18        |
| Q-21 | Peirce の法則    | 4     | `((phi -> psi) -> phi) -> phi`    | ~30        |
| Q-22 | 連言の導入       | 5     | `phi -> (psi -> (phi /\ psi))`    | 40+        |
| Q-23 | 連言の除去       | 5     | `(phi /\ psi) -> phi`             | ~25        |
| Q-24 | De Morgan の法則 | 5     | `~(phi \/ psi) -> (~phi /\ ~psi)` | 40+        |
