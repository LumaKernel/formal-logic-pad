# カット除去定理リファレンス

カット除去定理（Cut Elimination Theorem, Hauptsatz）に関する知識をまとめたリファレンスドキュメント群。シーケント計算の基礎から、カット除去アルゴリズムの疑似コード、具体例による実演までを扱う。

> **関連:** Hilbert 系の公理・推論規則や論理学の基礎については [../logic-reference/](../logic-reference/README.md) を参照。

## 目次

| #   | ドキュメント                                                  | 概要                                                                                                                           |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 01  | [シーケント計算の基礎](./01-sequent-calculus.md)              | シーケント（$\Gamma \vdash \Delta$）の定義、LK の推論規則（構造規則・論理規則・切断規則・公理）、LJ との違い                   |
| 02  | [カット規則とカット除去定理](./02-cut-elimination-theorem.md) | カット規則の形式的定義と直感的意味、Hauptsatz の主張と意義（部分式性・一貫性・証明探索）、Gentzen の証明概略                   |
| 03  | [カット除去アルゴリズム](./03-algorithm.md)                   | TypeScript 風の疑似コードによるアルゴリズム記述。公理とのカット、主式でない場合、Principal cut、構造規則との相互作用の各ケース |
| 04  | [具体例によるカット除去の実演](./04-examples.md)              | 命題論理（$\to$）のカット除去、量化子（$\forall$）のカット除去、入れ子カットの段階的除去をステップバイステップで追跡           |

## 参考文献

### 原典・教科書

- **Gentzen, G.** "Untersuchungen über das logische Schließen" (1935)
  — カット除去定理の原論文。シーケント計算 LK/LJ を導入し、Hauptsatz を証明した。
- **Girard, J.-Y., Lafont, Y., Taylor, P.** _Proofs and Types_ (1989), Chapter 13
  — カット除去の現代的な解説。型理論との関連も扱う。オンライン公開: http://www.paultaylor.eu/stable/Proofs+Types.html
- **Takeuti, G.** _Proof Theory_ (2nd ed., 1987)
  — 竹内外史による証明論の包括的教科書。LK/LJ のカット除去を詳細に証明。
- **Troelstra, A.S., Schwichtenberg, H.** _Basic Proof Theory_ (2nd ed., 2000)
  — 証明論の標準的教科書。シーケント計算とカット除去を体系的に解説。
- **Buss, S.R.** "An Introduction to Proof Theory" in _Handbook of Proof Theory_ (1998)
  — 証明論への導入。カット除去の複雑度解析も含む。

### オンラインリソース

- **nLab** — [Cut elimination](https://ncatlab.org/nlab/show/cut+elimination)
  — 圏論的観点も含むカット除去の解説。
- **Stanford Encyclopedia of Philosophy** — [Proof Theory](https://plato.stanford.edu/entries/proof-theory/)
  — 証明論の概要と歴史。カット除去定理の位置づけを解説。
- **高崎金久 (京都大学)** — [論理学教材](https://www2.yukawa.kyoto-u.ac.jp/~kanehisa.takasaki/edu/logic/logic6.html)
  — 本プロジェクトの参考にした日本語の論理学教材。

## 用語索引

| 日本語                     | 英語                               | 説明                                                                                                 |
| -------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| シーケント                 | sequent                            | $\Gamma \vdash \Delta$ の形の判断。左辺は仮定、右辺は結論                                            |
| シーケント計算             | sequent calculus                   | Gentzen が導入した証明体系。LK（古典）/ LJ（直観主義）                                               |
| カット規則 / 切断規則      | cut rule                           | $\Gamma \vdash \Delta$, A と A, $\Sigma \vdash$ Π から $\Gamma , \Sigma \vdash \Delta$, Π を導く規則 |
| カット除去 / 切断除去      | cut elimination                    | 証明からカット規則を除去する操作                                                                     |
| カット除去定理 / Hauptsatz | cut elimination theorem            | LK の任意の証明からカット規則を除去できるという定理                                                  |
| 主式                       | principal formula                  | 推論規則で導入される論理結合子を含む式                                                               |
| 部分式性                   | subformula property                | カットなし証明では出現するすべての式が結論の部分式である性質                                         |
| 弱化                       | weakening                          | シーケントに未使用の式を追加する構造規則                                                             |
| 縮約                       | contraction                        | シーケント中の重複する式を1つにまとめる構造規則                                                      |
| 交換                       | exchange                           | シーケント中の式の順序を入れ替える構造規則                                                           |
| カット式                   | cut formula                        | カット規則で消去される式 A                                                                           |
| 証明の段数                 | height / depth of proof            | 証明木の根から葉までの最大推論規則適用回数                                                           |
| カットの複雑度             | complexity of cut                  | カット式の論理結合子の入れ子の深さ                                                                   |
| カットのランク             | rank of cut                        | カット規則の上にある証明の段数                                                                       |
| 公理 / 恒等式              | identity / axiom                   | A $\vdash$ A の形の初期シーケント                                                                    |
| 構造規則                   | structural rule                    | 論理結合子を導入しない規則（弱化・縮約・交換）                                                       |
| 論理規則                   | logical rule                       | 論理結合子を導入する規則（左規則・右規則）                                                           |
| 左規則                     | left rule                          | シーケントの左辺（仮定側）に論理結合子を導入する規則                                                 |
| 右規則                     | right rule                         | シーケントの右辺（結論側）に論理結合子を導入する規則                                                 |
| LK                         | LK (Logischer Kalkül)              | Gentzen の古典論理のシーケント計算                                                                   |
| LJ                         | LJ (Logistischer Junktionenkalkül) | Gentzen の直観主義論理のシーケント計算。右辺が高々1式                                                |
| 二重帰納法                 | double induction                   | Gentzen のカット除去証明で用いる手法（カット式の複雑度 × ランク）                                    |
