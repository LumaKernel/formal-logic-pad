# 形式論理リファレンスドキュメント

本ディレクトリには、Formal Logic Pad プロジェクトの論理学ライブラリ（logic-core, logic-lang）の実装に必要な記号論理・述語論理の知識を網羅的にまとめたリファレンスドキュメントを配置しています。

主な読者は AI エージェント（Ralph 等）であり、実装時に参照して正しい定義・規則・コーナーケースを把握できることを目指しています。

## 目次

| #   | ファイル                                                                   | 概要                                                                                                                                |
| --- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 01  | [01-notation.md](./01-notation.md)                                         | **記法・記号の一覧** — 論理結合子、量化子、等号、二項演算子の表記法と優先順位。メタ変数の命名規則。AST型との対応表                  |
| 02  | [02-propositional-logic.md](./02-propositional-logic.md)                   | **命題論理の基礎（Hilbert 系）** — Łukasiewicz の 3 公理（K, S, 対偶）、Modus Ponens、φ→φ の証明例、演繹定理、健全性・完全性        |
| 03  | [03-predicate-logic.md](./03-predicate-logic.md)                           | **述語論理の基礎（一階述語論理）** — 項・述語・量化子の定義、自由変数・束縛変数、代入可能性、追加公理 A4・A5、汎化規則              |
| 04  | [04-substitution-and-unification.md](./04-substitution-and-unification.md) | **代入とユニフィケーション** — メタ変数代入 vs 項変数代入の 2 レベル、変数捕獲、α 変換、代入の合成、Martelli-Montanari アルゴリズム |
| 05  | [05-equality-logic.md](./05-equality-logic.md)                             | **等号付き論理** — 等号公理 E1〜E5（反射・対称・推移・関数合同・述語合同）、代入律、オプション機能としての設計指針                  |
| 06  | [06-dsl-specification.md](./06-dsl-specification.md)                       | **DSL 言語仕様（Logic Schema Language）** — EBNF 文法、トークン一覧、演算子優先順位、入力例と AST 対応、Unicode/LaTeX 出力仕様      |

## PRD との対応表

本リファレンスのどのドキュメントが、`tasks/prd-formal-logic-pad.md` のどのユーザーストーリーの実装時に参照されるべきかを示します。

| PRD ユーザーストーリー                     | 参照すべきドキュメント                                                                                                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **US-009**: 論理式スキーマ AST の定義      | [01-notation](./01-notation.md), [02-propositional-logic](./02-propositional-logic.md), [03-predicate-logic](./03-predicate-logic.md), [05-equality-logic](./05-equality-logic.md)     |
| **US-010**: メタ変数の定義                 | [01-notation](./01-notation.md)（メタ変数命名規則セクション）                                                                                                                          |
| **US-011**: メタ変数への代入操作           | [04-substitution-and-unification](./04-substitution-and-unification.md)（メタ変数代入・変数捕獲セクション）                                                                            |
| **US-012**: スキーマ間のユニフィケーション | [04-substitution-and-unification](./04-substitution-and-unification.md)（ユニフィケーションセクション）                                                                                |
| **US-013**: 推論規則の定義                 | [02-propositional-logic](./02-propositional-logic.md)（公理・MP）, [03-predicate-logic](./03-predicate-logic.md)（A4, A5, Gen）, [05-equality-logic](./05-equality-logic.md)（E1〜E5） |
| **US-014**: 証明図の表現と検証             | [02-propositional-logic](./02-propositional-logic.md)（証明図の表記法・φ→φ の証明）                                                                                                    |
| **US-015**: 言語のトークン定義と Lexer     | [06-dsl-specification](./06-dsl-specification.md)（トークン一覧・Lexer 実装指針）                                                                                                      |
| **US-016**: 言語のパーサー                 | [06-dsl-specification](./06-dsl-specification.md)（EBNF 文法・Parser 実装指針・入力例）                                                                                                |
| **US-017**: Unicode フォーマッター         | [06-dsl-specification](./06-dsl-specification.md)（Unicode 出力フォーマット仕様）, [01-notation](./01-notation.md)（記号の表記法）                                                     |
| **US-018**: LaTeX フォーマッター           | [06-dsl-specification](./06-dsl-specification.md)（LaTeX 出力フォーマット仕様）, [01-notation](./01-notation.md)（LaTeX 表記対応表）                                                   |

## 参考文献一覧

### 教科書・学術論文

- **Enderton, H.B.** _A Mathematical Introduction to Logic_ (2nd ed., Academic Press, 2001)
  - 一階述語論理の標準的教科書。項・論理式・代入・証明体系を網羅
  - 参照箇所: 01, 02, 03, 04, 05

- **Mendelson, E.** _Introduction to Mathematical Logic_ (6th ed., CRC Press, 2015)
  - Hilbert 系の公理的体系を中心に解説。本プロジェクトの公理体系選択の主要な参照源
  - 参照箇所: 01, 02, 03, 04, 05

- **Shoenfield, J.R.** _Mathematical Logic_ (Addison-Wesley, 1967; A K Peters, 2001 reprint)
  - 述語論理と証明論の古典的教科書
  - 参照箇所: 03

- **Hindley, J.R. & Seldin, J.P.** _Lambda-Calculus and Combinators: An Introduction_ (Cambridge University Press, 2008)
  - コンビネータ論理（S, K, I）と論理との対応
  - 参照箇所: 02

- **Łukasiewicz, J. & Tarski, A.** "Untersuchungen über den Aussagenkalkül" (1930)
  - 本プロジェクトで採用した 3 公理体系（K, S, 対偶）の原典
  - 参照箇所: 02

- **Martelli, A. & Montanari, U.** "An Efficient Unification Algorithm" _ACM TOPLAS_ 4(2), 1982
  - 本プロジェクトで採用したユニフィケーションアルゴリズムの原典
  - 参照箇所: 04

- **Robinson, J.A.** "A Machine-Oriented Logic Based on the Resolution Principle" _JACM_ 12(1), 1965
  - ユニフィケーションアルゴリズムの先駆的研究
  - 参照箇所: 04

- **Baader, F. & Snyder, W.** "Unification Theory" in _Handbook of Automated Reasoning_ (Elsevier, 2001)
  - ユニフィケーション理論の包括的サーベイ
  - 参照箇所: 04

- **Pratt, V.R.** "Top Down Operator Precedence" _ACM SIGACT-SIGPLAN Symposium_, 1973
  - DSL パーサー実装で推奨する Pratt parser の原論文
  - 参照箇所: 06

### オンラインリソース

- **高崎金久 研究室 論理学教材**
  - URL: <https://www2.yukawa.kyoto-u.ac.jp/~kanehisa.takasaki/edu/logic/logic6.html>
  - Hilbert 系命題論理の公理体系と証明例。本プロジェクトの公理体系選択の主要な出典
  - 参照箇所: 01, 02, 03, 05

- **Stanford Encyclopedia of Philosophy**
  - "Classical Logic": <https://plato.stanford.edu/entries/logic-classical/>
  - "First-order Model Theory": <https://plato.stanford.edu/entries/modeltheory-fo/>
  - "Identity": <https://plato.stanford.edu/entries/identity/>
  - 各概念の哲学的・論理学的背景
  - 参照箇所: 02, 05

## 用語索引

日本語と英語の対応、および本リファレンス内での主な記載箇所を示します。

### 基本概念

| 日本語         | 英語               | 記載箇所   |
| -------------- | ------------------ | ---------- |
| 論理式         | formula            | 01, 02, 03 |
| 論理式スキーマ | formula schema     | 02, 04     |
| 項             | term               | 01, 03     |
| 述語           | predicate          | 01, 03     |
| メタ変数       | meta-variable      | 01, 02, 04 |
| 項メタ変数     | term meta-variable | 01, 03, 04 |

### 論理結合子・量化子

| 日本語   | 英語                       | 記号 | 記載箇所 |
| -------- | -------------------------- | ---- | -------- |
| 否定     | negation                   | ¬    | 01, 02   |
| 含意     | implication                | →    | 01, 02   |
| 連言     | conjunction                | ∧    | 01, 02   |
| 選言     | disjunction                | ∨    | 01, 02   |
| 双条件   | biconditional              | ↔    | 01, 02   |
| 全称量化 | universal quantification   | ∀    | 01, 03   |
| 存在量化 | existential quantification | ∃    | 01, 03   |
| 等号     | equality                   | =    | 01, 05   |

### 公理・推論規則

| 日本語           | 英語                         | 記号                                | 記載箇所 |
| ---------------- | ---------------------------- | ----------------------------------- | -------- |
| K 公理           | K axiom (A1)                 | φ → (ψ → φ)                         | 02       |
| S 公理           | S axiom (A2)                 | (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ)) | 02       |
| 対偶公理         | contrapositive axiom (A3)    | (¬ψ → ¬φ) → (φ → ψ)                 | 02       |
| 全称例化         | universal instantiation (A4) | ∀x.φ(x) → φ(t)                      | 03       |
| 全称分配         | universal distribution (A5)  | ∀x.(φ → ψ) → (φ → ∀x.ψ)             | 03       |
| モーダスポネンス | Modus Ponens (MP)            | φ, φ→ψ ⊢ ψ                          | 02       |
| 汎化規則         | generalization (Gen)         | φ ⊢ ∀x.φ                            | 03       |

### 等号公理

| 日本語     | 英語                             | 記号                              | 記載箇所 |
| ---------- | -------------------------------- | --------------------------------- | -------- |
| 反射律     | reflexivity (E1)                 | ∀x. x = x                         | 05       |
| 対称律     | symmetry (E2)                    | ∀x.∀y. x = y → y = x              | 05       |
| 推移律     | transitivity (E3)                | ∀x.∀y.∀z. x = y ∧ y = z → x = z   | 05       |
| 関数合同律 | function congruence (E4)         | t₁ = t₂ → f(…,t₁,…) = f(…,t₂,…)   | 05       |
| 述語合同律 | predicate congruence (E5)        | t₁ = t₂ → (P(…,t₁,…) → P(…,t₂,…)) | 05       |
| 代入律     | substitution law / Leibniz's law | t₁ = t₂ → (φ[t₁/x] → φ[t₂/x])     | 05       |

### 代入・ユニフィケーション

| 日本語             | 英語                       | 記載箇所 |
| ------------------ | -------------------------- | -------- |
| 代入               | substitution               | 03, 04   |
| メタ変数代入       | meta-variable substitution | 04       |
| 項変数代入         | term variable substitution | 03, 04   |
| 変数捕獲           | variable capture           | 03, 04   |
| 代入可能           | free for substitution      | 03, 04   |
| α 変換             | α-conversion / α-renaming  | 03, 04   |
| 代入の合成         | substitution composition   | 04       |
| ユニフィケーション | unification                | 04       |
| 最汎単一化子       | most general unifier (MGU) | 04       |
| Occurs check       | occurs check               | 04       |
| 自由変数           | free variable              | 03       |
| 束縛変数           | bound variable             | 03       |
| 閉論理式（文）     | closed formula / sentence  | 03       |

### DSL・実装関連

| 日本語         | 英語                       | 記載箇所 |
| -------------- | -------------------------- | -------- |
| 字句解析器     | lexer / tokenizer          | 06       |
| 構文解析器     | parser                     | 06       |
| 抽象構文木     | abstract syntax tree (AST) | 01, 06   |
| 演算子優先順位 | operator precedence        | 01, 06   |
| 結合性         | associativity              | 01, 06   |
| Pratt パーサー | Pratt parser               | 06       |
| Unicode 出力   | Unicode formatting         | 06       |
| LaTeX 出力     | LaTeX formatting           | 06       |
| 添字           | subscript                  | 01, 06   |

### 証明論

| 日本語       | 英語                       | 記載箇所 |
| ------------ | -------------------------- | -------- |
| 証明図       | proof tree / proof diagram | 02       |
| 演繹定理     | deduction theorem          | 02       |
| 健全性       | soundness                  | 02       |
| 完全性       | completeness               | 02       |
| 公理スキーマ | axiom schema               | 02       |
| 推論規則     | inference rule             | 02, 03   |
