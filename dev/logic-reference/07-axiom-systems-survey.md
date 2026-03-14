# 公理体系の比較と柔軟な設計

本プロジェクトの論理コアライブラリ (`src/lib/logic-core/`) を、複数の公理体系に対応可能な柔軟な設計にするための調査・比較ドキュメント。特に**否定の扱い**の流儀の違いに焦点を当てる。

## 1. 概要: なぜ柔軟性が必要か

Hilbert系の形式的体系は、採用する公理スキーマの選択によって多くのバリエーションがある。特に否定 (`$\lnot$`) の扱いは体系ごとに大きく異なる。

本プロジェクトでは:

- **教育目的:** 異なる公理体系を比較しながら学べるようにしたい
- **拡張性:** 古典論理だけでなく、直観主義論理や最小論理もカバーしたい
- **正確性:** 各体系の特性（完全性、健全性、独立性）を正しく反映したい

## 2. 否定の扱いの主要な流儀

### 2.1 分類表

| 流儀                  | 否定公理                                          | 性格                                      | 代表的な体系            |
| --------------------- | ------------------------------------------------- | ----------------------------------------- | ----------------------- |
| 対偶 (Contraposition) |  ( \lnot \varphi \to \lnot \psi ) \to ( \psi \to \varphi )                              | 「$\lnot \varphi$が$\lnot \psi$を含意するなら、$\psi$が$\varphi$を含意する」  | Łukasiewicz             |
| 背理法 (Reductio)     |  ( \lnot \varphi \to \lnot \psi ) \to (( \lnot \varphi \to \psi ) \to \varphi )                       | 「$\lnot \varphi$から矛盾が導かれるなら、$\varphi$が成り立つ」 | Mendelson               |
| 二重否定除去 + 対偶   |  ( \varphi \to \psi ) \to ( \lnot \psi \to \lnot \varphi ) ,  \lnot \lnot \varphi \to \varphi ,  \varphi \to \lnot \lnot \varphi        | 対偶+DNE+DNIの3公理                       | Frege                   |
| 爆発 + 場合分け       |  \varphi \to ( \lnot \varphi \to \psi ) ,  ( \varphi \to \psi ) \to (( \lnot \varphi \to \psi ) \to \psi )         | ex falsoと排中律的推論の2公理             | Hilbert-Ackermann       |
| DNE + 自己矛盾 + 対偶 |  \lnot \lnot \varphi \to \varphi ,  ( \varphi \to \lnot \varphi ) \to \lnot \varphi ,  ( \varphi \to \lnot \psi ) \to ( \psi \to \lnot \varphi )  | 3つの否定公理                             | Russell-Whitehead       |
| $\bot$経由のDNE            |  (( \varphi \to \bot ) \to \bot ) \to \varphi                                | falsum経由の二重否定除去                  | Church                  |
| Peirce則 + 爆発       |  (( \varphi \to \psi ) \to \varphi ) \to \varphi ,  \bot \to \varphi                       | 古典推論と爆発を分離                      | Tarski-Bernays-Wajsberg |

### 2.2 重要な等価関係

以下は（正の含意計算 + 否定を持つ体系において）互いに導出可能であり、どれか1つを直観主義論理に追加すれば古典論理になる:

-  \lnot \lnot \varphi \to \varphi （二重否定除去, DNE）
-  \varphi \lor \lnot \varphi （排中律, LEM）
-  (( \varphi \to \psi ) \to \varphi ) \to \varphi （Peirceの法則）
-  ( \lnot \varphi \to \lnot \psi ) \to ( \psi \to \varphi ) （対偶, Łukasiewicz L3）
-  ( \lnot \varphi \to \lnot \psi ) \to (( \lnot \varphi \to \psi ) \to \varphi ) （背理法, Mendelson M3）

つまり**古典論理にとって**これらは同値であり、どれを選ぶかは表現の好みの問題。

## 3. 主要な公理体系の詳細

### 3.1 Łukasiewicz体系（現在の採用体系）

**原始結合子:** $\to$ (含意), $\lnot$ (否定)

**公理スキーマ（3公理）:**

| 記号 | 式                                    | 名称                |
| ---- | ------------------------------------- | ------------------- |
| L1   |  \varphi \to ( \psi \to \varphi )                          | K公理（弱化）       |
| L2   |  ( \varphi \to ( \psi \to \chi )) \to (( \varphi \to \psi ) \to ( \varphi \to \chi ))  | S公理（含意の分配） |
| L3   |  ( \lnot \varphi \to \lnot \psi ) \to ( \psi \to \varphi )                  | 対偶公理            |

**推論規則:** Modus Ponens のみ

**定義される結合子:**

| 結合子  | 定義                |
| ------- | ------------------- |
|  \varphi \land \psi  |  \lnot ( \varphi \to \lnot \psi )          |
|  \varphi \lor \psi  |  \lnot \varphi \to \psi             |
|  \varphi \leftrightarrow \psi  |  ( \varphi \to \psi ) \land ( \psi \to \varphi )  |

**性質:** 3公理すべて独立、健全かつ完全（古典命題論理）

**出典:** Łukasiewicz & Tarski (1930)

### 3.2 Mendelson体系

**原始結合子:** $\to$ (含意), $\lnot$ (否定)

**公理スキーマ（3公理）:**

| 記号 | 式                                    | 名称              |
| ---- | ------------------------------------- | ----------------- |
| M1   |  \varphi \to ( \psi \to \varphi )                          | K公理（L1と同一） |
| M2   |  ( \varphi \to ( \psi \to \chi )) \to (( \varphi \to \psi ) \to ( \varphi \to \chi ))  | S公理（L2と同一） |
| M3   |  ( \lnot \varphi \to \lnot \psi ) \to (( \lnot \varphi \to \psi ) \to \varphi )           | 背理法            |

**L3とM3の違い:**

- **L3（対偶）:**  ( \lnot \varphi \to \lnot \psi ) \to ( \psi \to \varphi )  — 「$\lnot \varphi$が$\lnot \psi$を含意するなら、$\psi$が$\varphi$を含意する」
- **M3（背理法）:**  ( \lnot \varphi \to \lnot \psi ) \to (( \lnot \varphi \to \psi ) \to \varphi )  — 「$\lnot \varphi$が$\lnot \psi$と$\psi$の両方を含意するなら（矛盾するなら）、$\varphi$が成り立つ」

M3はL3より「強い」感覚があるが、M1+M2の下で互いに導出可能なので体系として等価。

**定義される結合子:** Łukasiewiczと同一

**性質:** 3公理すべて独立、健全かつ完全

**出典:** Mendelson, "Introduction to Mathematical Logic" (1964)

### 3.3 Frege体系（Begriffsschrift, 1879）

**原始結合子:** $\to$ (含意), $\lnot$ (否定)

**公理スキーマ（6公理、1つ冗長）:**

| 記号 | 式                                    | 名称                                  |
| ---- | ------------------------------------- | ------------------------------------- |
| F1   |  \varphi \to ( \psi \to \varphi )                          | 弱化                                  |
| F2   |  ( \chi \to ( \psi \to \varphi )) \to (( \chi \to \psi ) \to ( \chi \to \varphi ))  | 含意の分配                            |
| F3   |  ( \varphi \to ( \psi \to \chi )) \to ( \psi \to ( \varphi \to \chi ))        | 前件の交換（冗長、F1+F2から導出可能） |
| F4   |  ( \varphi \to \psi ) \to ( \lnot \psi \to \lnot \varphi )                  | 対偶                                  |
| F5   |  \lnot \lnot \varphi \to \varphi                              | 二重否定除去                          |
| F6   |  \varphi \to \lnot \lnot \varphi                              | 二重否定導入                          |

**注意:** F3はŁukasiewiczによりF1+F2から導出可能であることが示された。F6もF1, F2, F4, F5から導出可能。

**出典:** Frege, "Begriffsschrift" (1879)

### 3.4 Hilbert-Ackermann体系

**原始結合子:** $\to$ (含意), $\lnot$ (否定)

**公理スキーマ（5公理）:**

| 記号 | 式                              | 名称                       |
| ---- | ------------------------------- | -------------------------- |
| H1   |  \varphi \to ( \psi \to \varphi )                    | 弱化                       |
| H2   |  ( \varphi \to ( \psi \to \chi )) \to ( \psi \to ( \varphi \to \chi ))  | 前件の交換                 |
| H3   |  ( \psi \to \chi ) \to (( \varphi \to \psi ) \to ( \varphi \to \chi ))  | 合成                       |
| H4   |  \varphi \to ( \lnot \varphi \to \psi )                   | 爆発（ex falso quodlibet） |
| H5   |  ( \varphi \to \psi ) \to (( \lnot \varphi \to \psi ) \to \psi )       | 場合分け                   |

**出典:** Hilbert & Ackermann, "Grundzüge der theoretischen Logik" (1928)

### 3.5 Church体系（$\bot$ベース）

**原始結合子:** $\to$ (含意), $\bot$ (falsum/矛盾)

**否定の定義:**  \lnot \varphi$:=$\varphi \to \bot 

**公理スキーマ（3公理）:**

| 記号 | 式                                    | 名称                |
| ---- | ------------------------------------- | ------------------- |
| C1   |  \varphi \to ( \psi \to \varphi )                          | 弱化                |
| C2   |  ( \varphi \to ( \psi \to \chi )) \to (( \varphi \to \psi ) \to ( \varphi \to \chi ))  | 含意の分配          |
| C3   |  (( \varphi \to \bot ) \to \bot ) \to \varphi                    | $\bot$経由の二重否定除去 |

**特徴:** $\lnot \varphi$を $\varphi \to \bot$ と展開すれば、C3は  \lnot \lnot \varphi \to \varphi  に等しい。否定を独立した結合子ではなく、$\bot$への含意として統一的に扱う。

**出典:** Church, "Introduction to Mathematical Logic" (1956)

### 3.6 Tarski-Bernays-Wajsberg体系（$\bot$ベース）

**原始結合子:** $\to$ (含意), $\bot$ (falsum)

**公理スキーマ（4公理）:**

| 記号 | 式                              | 名称         |
| ---- | ------------------------------- | ------------ |
| TBW1 |  ( \varphi \to \psi ) \to (( \psi \to \chi ) \to ( \varphi \to \chi ))  | 仮言三段論法 |
| TBW2 |  \varphi \to ( \psi \to \varphi )                    | 弱化         |
| TBW3 |  (( \varphi \to \psi ) \to \varphi ) \to \varphi              | Peirceの法則 |
| TBW4 |  \bot \to \varphi                          | 爆発         |

**特徴:** 古典推論の原理（Peirceの法則 TBW3）と爆発原理（TBW4）が明確に分離されている。TBW4を除去すれば古典含意計算、TBW3を除去すれば直観主義の含意＋爆発になる。

### 3.7 Łukasiewicz の代替体系

**原始結合子:** $\to$ (含意), $\lnot$ (否定)

**公理スキーマ（3公理）:**

| 記号 | 式                              | 名称                                    |
| ---- | ------------------------------- | --------------------------------------- |
| La1  |  ( \varphi \to \psi ) \to (( \psi \to \chi ) \to ( \varphi \to \chi ))  | 仮言三段論法                            |
| La2  |  ( \lnot \varphi \to \varphi ) \to \varphi                   | Claviusの法則（consequentia mirabilis） |
| La3  |  \varphi \to ( \lnot \varphi \to \psi )                   | 爆発                                    |

**特徴:** L1-L3とは全く異なるスタイル。La2「$\lnot \varphi$から$\varphi$が導かれるなら、$\varphi$は無条件に成り立つ」は背理法の一形態。

## 4. 論理の階層: 最小論理・直観主義論理・古典論理

### 4.1 正の含意計算（共通基盤）

すべての体系の共通部分:

| 式                                    | 名称     |
| ------------------------------------- | -------- |
|  \varphi \to ( \psi \to \varphi )                          | 弱化 (K) |
|  ( \varphi \to ( \psi \to \chi )) \to (( \varphi \to \psi ) \to ( \varphi \to \chi ))  | 分配 (S) |

推論規則: Modus Ponens

### 4.2 正の命題計算（$\land , \lor$を追加）

正の含意計算に以下を追加:

| 式                                    | 名称           |
| ------------------------------------- | -------------- |
|  ( \varphi \land \psi ) \to \varphi                          | 連言除去（左） |
|  ( \varphi \land \psi ) \to \psi                          | 連言除去（右） |
|  \varphi \to ( \psi \to ( \varphi \land \psi ))                    | 連言導入       |
|  \varphi \to ( \varphi \lor \psi )                          | 選言導入（左） |
|  \psi \to ( \varphi \lor \psi )                          | 選言導入（右） |
|  ( \varphi \to \chi ) \to (( \psi \to \chi ) \to (( \varphi \lor \psi ) \to \chi ))  | 選言除去       |

### 4.3 最小論理（Johansson's Minimal Logic）

正の命題計算 + $\bot$（何の公理もなし）

否定は  \lnot \varphi$:=$\varphi \to \bot  と定義されるが、 \bot \to \varphi （爆発）は**導出不可能**。

**意味:** 矛盾から任意の命題が導かれることはない。「矛盾しているからといって何でも言える」わけではない。

弱い対偶  ( \varphi \to \psi ) \to ( \lnot \psi \to \lnot \varphi )  と二重否定導入  \varphi \to \lnot \lnot \varphi  は証明可能だが、二重否定除去  \lnot \lnot \varphi \to \varphi  と爆発  \lnot \varphi \to ( \varphi \to \psi )  は証明不可能。

### 4.4 直観主義論理（Intuitionistic Logic, IPC）

最小論理 + 爆発:  \bot \to \varphi 

あるいは、$\lnot$を独立した結合子として:

-  \lnot \varphi \to ( \varphi \to \psi ) （爆発）
-  ( \varphi \to \lnot \varphi ) \to \lnot \varphi （自己矛盾）

**証明不可能な古典的定理:**

-  \lnot \lnot \varphi \to \varphi （二重否定除去）
-  \varphi \lor \lnot \varphi （排中律）
-  (( \varphi \to \psi ) \to \varphi ) \to \varphi （Peirceの法則）

**特殊な性質:** 選言性（disjunction property）— $\vdash$\varphi \lor \psi  ならば $\vdash$\varphi  または $\vdash$\psi 

### 4.5 古典論理（Classical Logic, CPC）

直観主義論理 + 以下のいずれか1つ:

| 公理                         | 名称                   |
| ---------------------------- | ---------------------- |
|  \lnot \lnot \varphi \to \varphi                     | 二重否定除去 (DNE)     |
|  \varphi \lor \lnot \varphi                      | 排中律 (LEM)           |
|  (( \varphi \to \psi ) \to \varphi ) \to \varphi           | Peirceの法則           |
|  ( \lnot \varphi \to \lnot \psi ) \to ( \psi \to \varphi )         | 対偶（Łukasiewicz L3） |
|  ( \lnot \varphi \to \lnot \psi ) \to (( \lnot \varphi \to \psi ) \to \varphi )  | 背理法（Mendelson M3） |

### 4.6 包含関係の図

```
最小論理 ⊂ 直観主義論理 ⊂ 古典論理
  (ML)          (IPC)          (CPC)

ML: 正の命題計算 + $\bot$（公理なし）
IPC: ML + 爆発 ($\bot \to \varphi$)
CPC: IPC + DNE ($\lnot \lnot \varphi \to \varphi$)  [or LEM, Peirce, etc.]
```

## 5. 連言・選言の扱い: 原始 vs 定義

### 5.1 定義として導入する場合（$\to , \lnot$ のみ原始的）

| 結合子  | 定義                |
| ------- | ------------------- |
|  \varphi \land \psi  |  \lnot ( \varphi \to \lnot \psi )          |
|  \varphi \lor \psi  |  \lnot \varphi \to \psi             |
|  \varphi \leftrightarrow \psi  |  ( \varphi \to \psi ) \land ( \psi \to \varphi )  |

**利点:** 公理体系が最小限で済む。理論的にエレガント。
**欠点:** 直観主義論理では成り立たない定義がある（ \varphi \lor \psi$:=$\lnot \varphi \to \psi  は古典論理でのみ等価）。

### 5.2 原始的な結合子として追加する場合

$\land , \lor$ を原始的結合子として追加し、それぞれに導入/除去の公理を追加する（セクション4.2参照）。

**利点:** 直観主義論理にも対応可能。結合子の意味が公理で明示される。
**欠点:** 公理の数が増える。

### 5.3 $\bot$ベース vs $\lnot$ベース

| アプローチ | 原始結合子 | 否定          | 利点                                       |
| ---------- | ---------- | ------------- | ------------------------------------------ |
| $\lnot$ベース    | $\to , \lnot$       | 原始的        | 直感的。AST上でNegationが独立したノード    |
| $\bot$ベース    | $\to , \bot$       |  \lnot \varphi$:=$\varphi \to \bot  | 統一的。最小/直観主義/古典の切り替えが容易 |

**本プロジェクトでの推奨:**

ASTでは `Negation` を**独立したノード型として保持**する（表面表現として）。内部的には体系設定に応じて:

- 古典論理: Negation を直接扱う公理（L3, M3 等）を使用
- $\bot$ベース: Negation を `Implication($\varphi$, Bottom)` に展開して扱う

この二層構造により、ユーザーは常に $\lnot$ を使って式を入力でき、体系の内部表現は設定に従う。

## 6. 実装上の設計指針

### 6.1 LogicSystem 設定の構造

```
LogicSystem:
  name: string                    -- 体系名（"Łukasiewicz", "Mendelson", etc.）
  primitiveConnectives: Set       -- 原始結合子の集合
  axiomSchemas: AxiomSchema[]     -- 公理スキーマのリスト
  inferenceRules: InferenceRule[] -- 推論規則のリスト（通常 MP のみ、FOLでは Gen も）
  definitions: Definition[]       -- 非原始結合子の定義（展開規則）
  equalityEnabled: boolean        -- 等号公理の有効/無効
  quantifiersEnabled: boolean     -- 量化子の有効/無効
```

### 6.2 プリセット体系

| プリセット名             | 原始結合子 | 公理                                  | 推論規則 | 論理の種類 |
| ------------------------ | ---------- | ------------------------------------- | -------- | ---------- |
| `lukasiewicz-classical`  | $\to , \lnot$       | L1, L2, L3                            | MP       | 古典       |
| `mendelson-classical`    | $\to , \lnot$       | M1, M2, M3                            | MP       | 古典       |
| `church-classical`       | $\to , \bot$       | C1, C2, C3                            | MP       | 古典       |
| `intuitionistic-minimal` | $\to , \land , \lor , \bot$ | K, S, $\land$-intro/elim, $\lor$-intro/elim, $\bot \to \varphi$ | MP       | 直観主義   |
| `minimal-logic`          | $\to , \land , \lor , \bot$ | K, S, $\land$-intro/elim, $\lor$-intro/elim      | MP       | 最小       |

### 6.3 公理スキーマの表現

各公理スキーマは、メタ変数を含む論理式パターンとして表現される。公理のインスタンス化は、メタ変数への代入操作で行う。

```
AxiomSchema:
  name: string                -- 公理名（"L1", "M3", etc.）
  pattern: FormulaSchema      -- メタ変数を含む論理式パターン
  description: string         -- 説明文
```

### 6.4 証明検証の汎用化

証明検証器は `LogicSystem` をパラメータとして受け取り、以下を検証する:

1. 各葉ノードが、指定された体系の公理スキーマのインスタンスであること
2. 各内部ノードが、指定された推論規則の正しい適用であること
3. 非原始結合子が使用されている場合、定義に基づく展開が正しいこと

これにより、検証ロジック自体は体系に依存せず、体系の追加は設定の追加のみで完了する。

## 7. 述語論理への拡張時の注意

### 7.1 追加される公理

セクション3の各体系に共通して追加:

| 記号 | 式                          | 名称             | 制約                              |
| ---- | --------------------------- | ---------------- | --------------------------------- |
| A4   |  \forall x. \varphi (x) \to \varphi (t)            | 全称例化         |  t  が  x  に対して自由に代入可能 |
| A5   |  \forall x. (\varphi \to \psi ) \to ( \varphi \to \forall x. \psi )  | 全称と含意の分配 |  x  が  \varphi  に自由出現しない       |

### 7.2 追加される推論規則

| 規則       | 形式                    | 制約                               |
| ---------- | ----------------------- | ---------------------------------- |
| 汎化 (Gen) |  \varphi  から  \forall x. \varphi  を導出 |  x  が未解消の仮定に自由出現しない |

### 7.3 存在量化子

 \exists x. \varphi$(x) :=$\lnot \forall x. \lnot \varphi (x) 

**注意:** 直観主義論理では  \exists  を独立した結合子として扱い、専用の公理を与える必要がある。

## 8. まとめ: 推奨する設計方針

1. **ASTは全結合子を独立ノードとして保持する**
   - `Negation`, `Conjunction`, `Disjunction`, `Biconditional` すべて独立
   - ユーザーの入力体験を重視（定義展開はユーザーに見えない）

2. **LogicSystem設定で公理体系を切り替え可能にする**
   - デフォルト: Łukasiewicz体系（現在の実装と整合）
   - オプション: Mendelson, Church($\bot$ベース), 直観主義, 最小論理

3. **表面表現と内部表現の翻訳層を設ける**
   - $\land , \lor , \leftrightarrow$ は体系の原始結合子でなければ定義に基づいて展開
   - $\lnot$ は $\bot$ベース体系では $\varphi \to \bot$ に展開
   - 展開は証明検証時に透過的に適用される

4. **証明検証器は体系非依存にする**
   - `validateProof(proof, logicSystem)` のように体系をパラメータで受け取る
   - 新しい体系の追加は設定のみ

5. **段階的に実装する**
   - Phase 1: Łukasiewicz体系のみ（現在のPRD US-009〜014の範囲）
   - Phase 2: Mendelson体系を追加（否定公理の差し替えのみ）
   - Phase 3: $\bot$ベース体系と直観主義論理を追加

## 参考文献

### 教科書

- Łukasiewicz, J. & Tarski, A. "Untersuchungen über den Aussagenkalkül" (1930) — L1-L3体系の原典
- Mendelson, E. "Introduction to Mathematical Logic" (6th ed., 2015) — M1-M3体系の標準的教科書
- Frege, G. "Begriffsschrift" (1879) — 最初の形式的証明体系
- Church, A. "Introduction to Mathematical Logic" (1956) — $\bot$ベース体系
- Hilbert, D. & Ackermann, W. "Grundzüge der theoretischen Logik" (1928) — H1-H5体系
- Russell, B. & Whitehead, A.N. "Principia Mathematica" (1910) — R1-R6体系
- Enderton, H.B. "A Mathematical Introduction to Logic" (2nd ed., 2001) — 健全性・完全性定理

### 直観主義論理・最小論理

- Johansson, I. "Der Minimalkalkül, ein reduzierter intuitionistischer Formalismus" (1937) — 最小論理の原典
- Heyting, A. "Die formalen Regeln der intuitionistischen Logik" (1930) — 直観主義論理の形式化

### オンラインリソース

- [Stanford Encyclopedia of Philosophy: Intuitionistic Logic](https://plato.stanford.edu/entries/logic-intuitionistic/)
- [Stanford Encyclopedia of Philosophy: Jan Łukasiewicz](https://plato.stanford.edu/entries/lukasiewicz/)
- [Wikipedia: Hilbert system](https://en.wikipedia.org/wiki/Hilbert_system)
- [Wikipedia: List of Hilbert systems](https://en.wikipedia.org/wiki/List_of_Hilbert_systems)
