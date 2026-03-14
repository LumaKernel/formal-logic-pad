# カット除去アルゴリズム

本ドキュメントでは、カット除去定理の証明を構成するアルゴリズムを TypeScript 風の疑似コードで記述する。各変換ケースにはreasoning（なぜその変換が正しいか）をコメントで付記し、具体例を添える。

> **前提知識:**
>
> - シーケント計算（LK）の基本: [01-sequent-calculus.md](./01-sequent-calculus.md)
> - カット規則とカット除去定理の主張・意義: [02-cut-elimination-theorem.md](./02-cut-elimination-theorem.md)

## 1. データ構造の定義

### 1.1 論理式

```typescript
type Formula =
  | {
      readonly tag: "Atom";
      readonly name: string;
      readonly terms: readonly Term[];
    }
  | { readonly tag: "Negation"; readonly body: Formula }
  | {
      readonly tag: "Implication";
      readonly left: Formula;
      readonly right: Formula;
    }
  | {
      readonly tag: "Conjunction";
      readonly left: Formula;
      readonly right: Formula;
    }
  | {
      readonly tag: "Disjunction";
      readonly left: Formula;
      readonly right: Formula;
    }
  | {
      readonly tag: "Universal";
      readonly variable: string;
      readonly body: Formula;
    }
  | {
      readonly tag: "Existential";
      readonly variable: string;
      readonly body: Formula;
    };
```

### 1.2 項

```typescript
type Term =
  | { readonly tag: "Variable"; readonly name: string }
  | {
      readonly tag: "Function";
      readonly name: string;
      readonly args: readonly Term[];
    };
```

### 1.3 シーケント

```typescript
// 多重集合は配列で表現（順序は問わない）
type Sequent = {
  readonly antecedent: readonly Formula[]; // $\Gamma$（前件）
  readonly succedent: readonly Formula[]; // $\Delta$（後件）
};
```

### 1.4 証明木

```typescript
type Proof =
  | { readonly tag: "Axiom"; readonly formula: Formula }
  // 構造規則
  | {
      readonly tag: "WeakeningL";
      readonly added: Formula;
      readonly premise: Proof;
    }
  | {
      readonly tag: "WeakeningR";
      readonly added: Formula;
      readonly premise: Proof;
    }
  | {
      readonly tag: "ContractionL";
      readonly formula: Formula;
      readonly premise: Proof;
    }
  | {
      readonly tag: "ContractionR";
      readonly formula: Formula;
      readonly premise: Proof;
    }
  // 否定
  | {
      readonly tag: "NegationL";
      readonly formula: Formula;
      readonly premise: Proof;
    }
  | {
      readonly tag: "NegationR";
      readonly formula: Formula;
      readonly premise: Proof;
    }
  // 含意
  | {
      readonly tag: "ImplicationL";
      readonly formula: Formula;
      readonly leftPremise: Proof;
      readonly rightPremise: Proof;
    }
  | {
      readonly tag: "ImplicationR";
      readonly formula: Formula;
      readonly premise: Proof;
    }
  // 連言
  | {
      readonly tag: "ConjunctionL1";
      readonly formula: Formula;
      readonly premise: Proof;
    }
  | {
      readonly tag: "ConjunctionL2";
      readonly formula: Formula;
      readonly premise: Proof;
    }
  | {
      readonly tag: "ConjunctionR";
      readonly formula: Formula;
      readonly leftPremise: Proof;
      readonly rightPremise: Proof;
    }
  // 選言
  | {
      readonly tag: "DisjunctionL";
      readonly formula: Formula;
      readonly leftPremise: Proof;
      readonly rightPremise: Proof;
    }
  | {
      readonly tag: "DisjunctionR1";
      readonly formula: Formula;
      readonly premise: Proof;
    }
  | {
      readonly tag: "DisjunctionR2";
      readonly formula: Formula;
      readonly premise: Proof;
    }
  // 全称量化
  | {
      readonly tag: "UniversalL";
      readonly formula: Formula;
      readonly term: Term;
      readonly premise: Proof;
    }
  | {
      readonly tag: "UniversalR";
      readonly formula: Formula;
      readonly eigenvariable: string;
      readonly premise: Proof;
    }
  // 存在量化
  | {
      readonly tag: "ExistentialL";
      readonly formula: Formula;
      readonly eigenvariable: string;
      readonly premise: Proof;
    }
  | {
      readonly tag: "ExistentialR";
      readonly formula: Formula;
      readonly term: Term;
      readonly premise: Proof;
    }
  // カット規則
  | {
      readonly tag: "Cut";
      readonly cutFormula: Formula;
      readonly leftPremise: Proof;
      readonly rightPremise: Proof;
    };
```

### 1.5 補助関数

```typescript
// 論理式の複雑度（論理結合子の深さ）
function complexity(f: Formula): number {
  switch (f.tag) {
    case "Atom":
      return 0;
    case "Negation":
      return complexity(f.body) + 1;
    case "Implication":
      return Math.max(complexity(f.left), complexity(f.right)) + 1;
    case "Conjunction":
      return Math.max(complexity(f.left), complexity(f.right)) + 1;
    case "Disjunction":
      return Math.max(complexity(f.left), complexity(f.right)) + 1;
    case "Universal":
      return complexity(f.body) + 1;
    case "Existential":
      return complexity(f.body) + 1;
  }
}

// 証明の結論シーケントを取得
function conclusion(proof: Proof): Sequent {
  /* ... */
}

// 論理式中の変数 x を項 t で置換: A[t/x]
function substituteVar(
  formula: Formula,
  variable: string,
  term: Term,
): Formula {
  /* ... */
}

// 証明中のカット式の最大複雑度（カット階数）
function cutRank(proof: Proof): number {
  /* ... */
}
```

## 2. カット除去アルゴリズムの全体構造

### 2.1 メインエントリーポイント

```typescript
/**
 * カット除去アルゴリズム: 証明からすべてのカット規則を除去する。
 *
 * 【戦略】二重帰納法（Gentzen のオリジナル手法）:
 *   - 外側: 証明中のカット式の最大複雑度 c に関する帰納法
 *   - 内側: 最大複雑度 c のカットに注目し、その段数に関する帰納法
 *
 * 【停止性の保証】
 *   各変換は以下のいずれかを厳密に減少させる:
 *   (1) カット式の最大複雑度（外側の帰納法の指標）
 *   (2) 同じ複雑度のカットの段数（内側の帰納法の指標）
 *   自然数の整列性により、有限回で停止する。
 */
function eliminateCuts(proof: Proof): Proof {
  // 証明木を再帰的に走査し、カットノードを見つけたら除去を試みる
  // ボトムアップ（葉から根に向かって）で処理する

  // カットが存在しなくなるまで繰り返す
  // Reasoning: 各反復でカット階数が厳密に減少するか、同じ階数のカット数が減少する
  // よって、有限回で停止する

  let current = proof;
  while (cutRank(current) > 0) {
    current = reduceTopCut(current);
  }
  return current;
}
```

### 2.2 最も深いカットの削減

```typescript
/**
 * 証明木中の「最も上にある」（葉に近い）カットを1つ選び、変換する。
 *
 * Reasoning: カットが入れ子になっている場合、最も上のカットは
 * その前提にカットを含まない（または含んでいてもそれは先に処理される）。
 * ボトムアップで処理することで、前提を「クリーン」にしてから
 * 外側のカットを処理できる。
 */
function reduceTopCut(proof: Proof): Proof {
  switch (proof.tag) {
    case "Cut": {
      // まず前提を再帰的に処理
      const left = reduceTopCut(proof.leftPremise);
      const right = reduceTopCut(proof.rightPremise);
      // 前提が処理済みなら、このカットを変換
      return reduceCut(proof.cutFormula, left, right);
    }
    // 他のすべての規則は前提を再帰的に処理するだけ
    case "Axiom":
      return proof;
    case "WeakeningL":
      return { ...proof, premise: reduceTopCut(proof.premise) };
    case "WeakeningR":
      return { ...proof, premise: reduceTopCut(proof.premise) };
    // ... 他の規則も同様（すべての前提を再帰的に処理）
    default:
      // 各規則の前提を再帰的に走査
      return mapPremises(proof, reduceTopCut);
  }
}
```

### 2.3 カット1つの削減（核心）

```typescript
/**
 * 単一のカットを削減する。
 *
 *   leftProof: $\Gamma \vdash \Delta$, A を証明
 *   rightProof: A, $\Sigma \vdash$ Π を証明
 *   cutFormula: A（カット式）
 *
 * 結果: $\Gamma , \Sigma \vdash \Delta$, Π のカットなし（または複雑度の低いカット）証明
 *
 * 【場合分けの構造】
 * 左前提と右前提の「最後の規則」に応じて4つのケースに分かれる:
 *   Case 1: 左 or 右が公理 $\to$ カットを即座に除去
 *   Case 2: A がどちらかの前提で非主式 $\to$ カットを上に持ち上げ（段数減少）
 *   Case 3: A が両方で主式 $\to$ カット式を分解（複雑度減少）
 *   Case 4: 構造規則との相互作用 $\to$ 特別な処理
 */
function reduceCut(
  cutFormula: Formula,
  leftProof: Proof,
  rightProof: Proof,
): Proof {
  // ── Case 1: 公理とのカット ──
  if (leftProof.tag === "Axiom") {
    return reduceCutAxiomLeft(cutFormula, leftProof, rightProof);
  }
  if (rightProof.tag === "Axiom") {
    return reduceCutAxiomRight(cutFormula, leftProof, rightProof);
  }

  // ── Case 4: 構造規則との相互作用 ──
  // 弱化・縮約は非主式ケースより先に処理する
  // （弱化でカット式が導入された場合は特殊処理が必要なため）
  if (isWeakeningOnCutFormula(leftProof, cutFormula)) {
    return reduceCutWeakeningLeft(cutFormula, leftProof, rightProof);
  }
  if (isWeakeningOnCutFormula(rightProof, cutFormula)) {
    return reduceCutWeakeningRight(cutFormula, leftProof, rightProof);
  }
  if (isContractionOnCutFormula(leftProof, cutFormula)) {
    return reduceCutContractionLeft(cutFormula, leftProof, rightProof);
  }
  if (isContractionOnCutFormula(rightProof, cutFormula)) {
    return reduceCutContractionRight(cutFormula, leftProof, rightProof);
  }

  // ── Case 3: 両方で主式 (Principal Case) ──
  if (
    isPrincipal(leftProof, cutFormula) &&
    isPrincipal(rightProof, cutFormula)
  ) {
    return reducePrincipalCut(cutFormula, leftProof, rightProof);
  }

  // ── Case 2: 非主式 (Non-principal Case) ──
  // カット式がどちらかで非主式 $\to$ カットを上に持ち上げる
  if (!isPrincipal(leftProof, cutFormula)) {
    return pushCutUpLeft(cutFormula, leftProof, rightProof);
  }
  return pushCutUpRight(cutFormula, leftProof, rightProof);
}
```

## 3. Case 1: 公理とのカット（Axiom Case）

### 3.1 疑似コード

```typescript
/**
 * Case 1a: 左前提が公理 A $\vdash$ A の場合
 *
 *     A $\vdash$ A     A, $\Sigma \vdash$ Π
 *   ──────────────────────── (Cut)    ⟹    A, $\Sigma \vdash$ Π
 *        A, $\Sigma \vdash$ Π
 *
 * Reasoning:
 *   公理 A $\vdash$ A は「A が成り立つなら A が成り立つ」という自明な主張。
 *   左前提が公理の場合、カットの結論 A, $\Sigma \vdash$ Π は右前提そのものに一致する。
 *   （カット規則の定義: $\Gamma$=A, $\Delta$=∅ なので、結論は A, $\Sigma \vdash$ Π。）
 *   よってカットは不要であり、右前提をそのまま返せばよい。
 */
function reduceCutAxiomLeft(
  cutFormula: Formula,
  leftProof: Proof, // Axiom: A $\vdash$ A
  rightProof: Proof, // A, $\Sigma \vdash$ Π
): Proof {
  // 右前提がそのまま答え
  return rightProof;
}

/**
 * Case 1b: 右前提が公理 A $\vdash$ A の場合
 *
 *   $\Gamma \vdash \Delta$, A     A $\vdash$ A
 *   ──────────────────── (Cut)    ⟹    $\Gamma \vdash \Delta$, A
 *       $\Gamma \vdash \Delta$, A
 *
 * Reasoning:
 *   右前提が公理 A $\vdash$ A の場合、$\Sigma$=∅, Π=A なので、
 *   カットの結論は $\Gamma \vdash \Delta$, A（弱化で A を後件に追加したもの）。
 *   しかし左前提が既に $\Gamma \vdash \Delta$, A を証明しているので、カットは不要。
 */
function reduceCutAxiomRight(
  cutFormula: Formula,
  leftProof: Proof, // $\Gamma \vdash \Delta$, A
  rightProof: Proof, // Axiom: A $\vdash$ A
): Proof {
  // 左前提がそのまま答え
  return leftProof;
}
```

### 3.2 具体例

**例: 左前提が公理**

```
変換前:
    P $\vdash$ P     P, Q $\vdash$ R
  ────────────────────── (Cut on P)
       P, Q $\vdash$ R

変換後:
    P, Q $\vdash$ R
```

カットの結論 `P, Q $\vdash$ R` は右前提そのものなので、カットを除去しても証明は成立する。

**例: 右前提が公理**

```
変換前:
  P $\to$ Q $\vdash$ P, P $\to$ Q     P $\to$ Q $\vdash$ P $\to$ Q
  ──────────────────────────────────── (Cut on P $\to$ Q)
         P $\to$ Q $\vdash$ P, P $\to$ Q

変換後:
  P $\to$ Q $\vdash$ P, P $\to$ Q
```

## 4. Case 2: 非主式ケース（Non-principal Case）

カット式 `A` が直前の規則で導入された式（主式）ではなく、コンテキストとして受け継がれただけの場合。

### 4.1 基本的なアイデア

カットを「上に持ち上げる」（pushing up）。直前の規則をカットの下に移動し、カットを前提の位置に押し上げる。

**効果:** カットの段数（カットの上にある証明の深さ）が減少する。内側の帰納法の指標が減少するため、有限回で公理ケースに到達する。

### 4.2 左前提が非主式の場合

```typescript
/**
 * Case 2a: カット式 A が左前提の最後の規則の非主式である場合
 *
 * 左前提の最後の規則 R が前提1つの場合の一般形:
 *
 *        π₁
 *     ─────────── (R)      π₂
 *    $\Gamma \vdash \Delta$, A          A, $\Sigma \vdash$ Π
 *   ──────────────────────────── (Cut)
 *           $\Gamma$', $\Sigma \vdash \Delta$', Π
 *
 * ここで R は A を主式として導入していない（A はコンテキストの一部）。
 *
 * 変換後:
 *
 *      π₁           π₂
 *    ─────────  A, $\Sigma \vdash$ Π
 *   ──────────────────── (Cut)    ← カットの段数が減少
 *        ...
 *   ─────────── (R)
 *    $\Gamma$', $\Sigma \vdash \Delta$', Π
 *
 * Reasoning:
 *   規則 R は A を操作していないので、R をカットの下に「降ろす」ことができる。
 *   カットは R の前提に対して行われるため、段数が 1 減少する。
 *   内側の帰納法により、いずれ Case 1 か Case 3 に到達する。
 */
function pushCutUpLeft(
  cutFormula: Formula,
  leftProof: Proof,
  rightProof: Proof,
): Proof {
  switch (leftProof.tag) {
    // ── 1前提の論理規則（A が非主式） ──

    case "NegationR": {
      // 左前提:
      //     π: B, $\Gamma \vdash \Delta$, A
      //   ──────────────────── ($\lnot$R)
      //    $\Gamma \vdash \Delta , \lnot$B, A        （A は $\lnot$B ではない = 非主式）
      //
      // 変換: カットを π の位置に持ち上げる
      //     π: B, $\Gamma \vdash \Delta$, A     A, $\Sigma \vdash$ Π
      //   ──────────────────────────────── (Cut on A)
      //          B, $\Gamma , \Sigma \vdash \Delta$, Π
      //   ──────────────────────── ($\lnot$R)
      //        $\Gamma , \Sigma \vdash \Delta$, Π, $\lnot$B
      const newCut = reduceCut(cutFormula, leftProof.premise, rightProof);
      return { tag: "NegationR", formula: leftProof.formula, premise: newCut };
    }

    case "ImplicationR": {
      // 左前提:
      //     π: B, $\Gamma \vdash \Delta$, C, A
      //   ──────────────────────── ($\to$R)
      //    $\Gamma \vdash \Delta$, B $\to$ C, A        （A は B $\to$ C ではない = 非主式）
      //
      // 変換: カットを π に持ち上げ
      const newCut = reduceCut(cutFormula, leftProof.premise, rightProof);
      return {
        tag: "ImplicationR",
        formula: leftProof.formula,
        premise: newCut,
      };
    }

    case "ImplicationL": {
      // 左前提:
      //     π₁: $\Gamma$₁ $\vdash \Delta$₁, B, A     π₂: C, $\Gamma$₂ $\vdash \Delta$₂, A
      //   ──────────────────────────────────────────────── ($\to$L)
      //        B $\to$ C, $\Gamma$₁, $\Gamma$₂ $\vdash \Delta$₁, $\Delta$₂, A
      //
      // A が非主式 = A は B $\to$ C ではない
      // A は π₁ と π₂ の両方に出現しうる
      //
      // 変換: 両方の前提でカットを行う
      //     π₁: $\Gamma$₁ $\vdash \Delta$₁, B, A     A, $\Sigma \vdash$ Π
      //   ────────────────────────────────── (Cut)
      //        $\Gamma$₁, $\Sigma \vdash \Delta$₁, B, Π
      //
      //     π₂: C, $\Gamma$₂ $\vdash \Delta$₂, A     A, $\Sigma \vdash$ Π
      //   ────────────────────────────────── (Cut)
      //        C, $\Gamma$₂, $\Sigma \vdash \Delta$₂, Π
      //
      //   ──────────────────────────────── ($\to$L)
      //     B $\to$ C, $\Gamma$₁, $\Gamma$₂, $\Sigma , \Sigma \vdash \Delta$₁, $\Delta$₂, B, Π, Π
      //
      // Reasoning:
      //   2前提規則の場合、A は両前提に出現しうる。
      //   各前提でカットを行い、元の規則を再適用する。
      //   注意: $\Sigma$ と Π が重複するが、必要に応じて縮約で整理できる。
      //   段数はいずれの場合も減少する。
      const newLeft = reduceCut(cutFormula, leftProof.leftPremise, rightProof);
      const newRight = reduceCut(
        cutFormula,
        leftProof.rightPremise,
        rightProof,
      );
      return {
        tag: "ImplicationL",
        formula: leftProof.formula,
        leftPremise: newLeft,
        rightPremise: newRight,
      };
    }

    // ── 連言 ──
    case "ConjunctionL1": {
      const newCut = reduceCut(cutFormula, leftProof.premise, rightProof);
      return {
        tag: "ConjunctionL1",
        formula: leftProof.formula,
        premise: newCut,
      };
    }
    case "ConjunctionL2": {
      const newCut = reduceCut(cutFormula, leftProof.premise, rightProof);
      return {
        tag: "ConjunctionL2",
        formula: leftProof.formula,
        premise: newCut,
      };
    }
    case "ConjunctionR": {
      const newLeft = reduceCut(cutFormula, leftProof.leftPremise, rightProof);
      const newRight = reduceCut(
        cutFormula,
        leftProof.rightPremise,
        rightProof,
      );
      return {
        tag: "ConjunctionR",
        formula: leftProof.formula,
        leftPremise: newLeft,
        rightPremise: newRight,
      };
    }

    // ── 選言 ──
    case "DisjunctionL": {
      const newLeft = reduceCut(cutFormula, leftProof.leftPremise, rightProof);
      const newRight = reduceCut(
        cutFormula,
        leftProof.rightPremise,
        rightProof,
      );
      return {
        tag: "DisjunctionL",
        formula: leftProof.formula,
        leftPremise: newLeft,
        rightPremise: newRight,
      };
    }
    case "DisjunctionR1": {
      const newCut = reduceCut(cutFormula, leftProof.premise, rightProof);
      return {
        tag: "DisjunctionR1",
        formula: leftProof.formula,
        premise: newCut,
      };
    }
    case "DisjunctionR2": {
      const newCut = reduceCut(cutFormula, leftProof.premise, rightProof);
      return {
        tag: "DisjunctionR2",
        formula: leftProof.formula,
        premise: newCut,
      };
    }

    // ── 否定 ──
    case "NegationL": {
      const newCut = reduceCut(cutFormula, leftProof.premise, rightProof);
      return { tag: "NegationL", formula: leftProof.formula, premise: newCut };
    }

    // ── 量化子 ──
    case "UniversalL": {
      const newCut = reduceCut(cutFormula, leftProof.premise, rightProof);
      return {
        tag: "UniversalL",
        formula: leftProof.formula,
        term: leftProof.term,
        premise: newCut,
      };
    }
    case "UniversalR": {
      const newCut = reduceCut(cutFormula, leftProof.premise, rightProof);
      return {
        tag: "UniversalR",
        formula: leftProof.formula,
        eigenvariable: leftProof.eigenvariable,
        premise: newCut,
      };
    }
    case "ExistentialL": {
      const newCut = reduceCut(cutFormula, leftProof.premise, rightProof);
      return {
        tag: "ExistentialL",
        formula: leftProof.formula,
        eigenvariable: leftProof.eigenvariable,
        premise: newCut,
      };
    }
    case "ExistentialR": {
      const newCut = reduceCut(cutFormula, leftProof.premise, rightProof);
      return {
        tag: "ExistentialR",
        formula: leftProof.formula,
        term: leftProof.term,
        premise: newCut,
      };
    }

    // ── 構造規則（A が非主式の場合）──
    case "WeakeningL": {
      // 弱化で追加されたのは A ではない（A が非主式）
      const newCut = reduceCut(cutFormula, leftProof.premise, rightProof);
      return { tag: "WeakeningL", added: leftProof.added, premise: newCut };
    }
    case "WeakeningR": {
      const newCut = reduceCut(cutFormula, leftProof.premise, rightProof);
      return { tag: "WeakeningR", added: leftProof.added, premise: newCut };
    }
    case "ContractionL": {
      const newCut = reduceCut(cutFormula, leftProof.premise, rightProof);
      return {
        tag: "ContractionL",
        formula: leftProof.formula,
        premise: newCut,
      };
    }
    case "ContractionR": {
      // 縮約されたのは A ではない（A が非主式）
      const newCut = reduceCut(cutFormula, leftProof.premise, rightProof);
      return {
        tag: "ContractionR",
        formula: leftProof.formula,
        premise: newCut,
      };
    }

    default:
      throw new Error("Unexpected proof structure");
  }
}
```

### 4.3 右前提が非主式の場合

```typescript
/**
 * Case 2b: カット式 A が右前提の最後の規則の非主式である場合
 *
 * 左前提と完全に対称的。右前提の規則をカットの下に降ろす。
 *
 * 一般形:
 *
 *    π₁                 π₂
 *   $\Gamma \vdash \Delta$, A        ─────── (R)
 *                   A, $\Sigma \vdash$ Π
 *   ──────────────────────── (Cut)
 *        $\Gamma , \Sigma$' $\vdash \Delta$, Π'
 *
 * 変換後:
 *
 *   π₁            π₂
 *   $\Gamma \vdash \Delta$, A    ─────
 *   ──────────────── (Cut)    ← 段数減少
 *        ...
 *   ─────── (R)
 *   $\Gamma , \Sigma$' $\vdash \Delta$, Π'
 */
function pushCutUpRight(
  cutFormula: Formula,
  leftProof: Proof,
  rightProof: Proof,
): Proof {
  // pushCutUpLeft と対称的な処理
  // 右前提の各規則について、その前提でカットを行い、規則を再適用する
  // 実装は pushCutUpLeft の左右対称版
  // ...（省略: 構造は pushCutUpLeft と同一）
  switch (rightProof.tag) {
    case "NegationL": {
      // 右前提:
      //     π: $\Gamma$₂ $\vdash \Delta$₂, B
      //   ──────────────── ($\lnot$L)
      //    A, $\lnot$B, $\Gamma$₂ $\vdash \Delta$₂       （A は $\lnot$B ではない）
      //
      // 変換:
      //   $\Gamma \vdash \Delta$, A     π: $\Gamma$₂ $\vdash \Delta$₂, B
      //   ... ここで A が π の前件に出現する場合はカットを行う ...
      //   ──────────── ($\lnot$L)
      const newCut = reduceCut(cutFormula, leftProof, rightProof.premise);
      return { tag: "NegationL", formula: rightProof.formula, premise: newCut };
    }

    // ... 他の規則も pushCutUpLeft と対称的に処理
    // （左前提の場合の鏡像）

    default:
      throw new Error("Unexpected proof structure");
  }
}
```

### 4.4 具体例

**例: 左前提で弱化（非主式）後にカット**

```
変換前:
       P $\vdash$ P        (Ax)
    ──────────── (WL)           P, Q $\vdash$ R
     Q, P $\vdash$ P
  ──────────────────────── (Cut on P)
        Q, P, Q $\vdash$ R

変換後:
    P $\vdash$ P     P, Q $\vdash$ R
  ──────────────────────── (Cut on P)     ← 段数 1 減少
        P, Q $\vdash$ R
  ──────────────── (WL)
     Q, P, Q $\vdash$ R
```

弱化規則 (WL) はカット式 `P` を操作していない（`Q` を追加しただけ）ので、カットを弱化の前提に持ち上げることができる。

**例: 左前提で $\to$R（非主式）後にカット**

```
変換前:
       B, $\Gamma \vdash \Delta$, C, A
    ────────────────────── ($\to$R)         A, $\Sigma \vdash$ Π
     $\Gamma \vdash \Delta$, B $\to$ C, A
  ──────────────────────────────── (Cut on A)
        $\Gamma , \Sigma \vdash \Delta$, B $\to$ C, Π

変換後:
    B, $\Gamma \vdash \Delta$, C, A     A, $\Sigma \vdash$ Π
  ──────────────────────────────── (Cut on A)     ← 段数 1 減少
        B, $\Gamma , \Sigma \vdash \Delta$, C, Π
  ──────────────────────── ($\to$R)
     $\Gamma , \Sigma \vdash \Delta$, B $\to$ C, Π
```

## 5. Case 3: 主式ケース（Principal Case / Key Case）

**最も重要なケース。** カット式 `A` が左前提でも右前提でも主式（その規則で導入された式）である場合。

### 5.1 基本方針

カット式 `A` の構造（最外の論理結合子）に応じた変換を行う。変換後のカット式は元のカット式の**真部分式**であるため、複雑度が厳密に減少する。

これが外側の帰納法の進む部分であり、カット除去アルゴリズムの核心である。

```typescript
/**
 * Principal Cut の削減
 *
 * 【前提条件】
 * - leftProof の最後の規則は cutFormula を右に導入する規則
 * - rightProof の最後の規則は cutFormula を左に導入する規則
 *
 * 【保証】
 * 変換後のカット式の複雑度は cutFormula より厳密に小さい
 * （真部分式に対するカットに置き換わるため）
 */
function reducePrincipalCut(
  cutFormula: Formula,
  leftProof: Proof,
  rightProof: Proof,
): Proof {
  switch (cutFormula.tag) {
    case "Negation":
      return reducePrincipalNegation(cutFormula, leftProof, rightProof);
    case "Implication":
      return reducePrincipalImplication(cutFormula, leftProof, rightProof);
    case "Conjunction":
      return reducePrincipalConjunction(cutFormula, leftProof, rightProof);
    case "Disjunction":
      return reducePrincipalDisjunction(cutFormula, leftProof, rightProof);
    case "Universal":
      return reducePrincipalUniversal(cutFormula, leftProof, rightProof);
    case "Existential":
      return reducePrincipalExistential(cutFormula, leftProof, rightProof);
    case "Atom":
      // 原子式のカットでは、両方が主式であることは公理ケース（Case 1）でのみ生じる。
      // ここに到達することはない。
      throw new Error(
        "Atomic principal cut should have been handled by axiom case",
      );
  }
}
```

### 5.2 否定のケース: A = $\lnot$B

```typescript
/**
 * 否定の Principal Cut
 *
 * 左前提（$\lnot$R を適用）:         右前提（$\lnot$L を適用）:
 *
 *     $\Gamma \vdash \Delta$, B                   B, $\Sigma \vdash$ Π
 *   ────────────── ($\lnot$R)        ──────────── ($\lnot$L)
 *    $\Gamma \vdash \Delta , \lnot$B                 $\lnot$B, $\Sigma \vdash$ Π
 *
 * カット（変換前）:
 *
 *    $\Gamma \vdash \Delta , \lnot$B     $\lnot$B, $\Sigma \vdash$ Π
 *   ──────────────────────────── (Cut on $\lnot$B)
 *         $\Gamma , \Sigma \vdash \Delta$, Π
 *
 * 変換後:
 *
 *    $\Gamma \vdash \Delta$, B     B, $\Sigma \vdash$ Π
 *   ──────────────────────────── (Cut on B)
 *         $\Gamma , \Sigma \vdash \Delta$, Π
 *
 * Reasoning:
 *   $\lnot$R は「$\Gamma \vdash \Delta$, B を証明して $\lnot$B を後件に導入」する規則。
 *   $\lnot$L は「B, $\Sigma \vdash$ Π を証明して $\lnot$B を前件に導入」する規則。
 *   つまり、$\lnot$B を介さずとも B で直接カットできる。
 *   新しいカット式 B は $\lnot$B の真部分式なので、
 *   complexity(B) < complexity($\lnot$B) = complexity(B) + 1。
 *   外側の帰納法の指標が 1 減少する。
 */
function reducePrincipalNegation(
  cutFormula: Formula & { readonly tag: "Negation" },
  leftProof: Proof, // tag === "NegationR"
  rightProof: Proof, // tag === "NegationL"
): Proof {
  // leftProof.premise: $\Gamma \vdash \Delta$, B を証明
  // rightProof.premise: B, $\Sigma \vdash$ Π を証明
  const innerCutFormula = cutFormula.body; // B
  return reduceCut(
    innerCutFormula,
    (leftProof as { readonly premise: Proof }).premise, // $\Gamma \vdash \Delta$, B
    (rightProof as { readonly premise: Proof }).premise, // B, $\Sigma \vdash$ Π
  );
}
```

**具体例:**

```
変換前:
       P $\vdash$ P, Q    (WR)             Q, R $\vdash$ R    (WL)
    ──────────────── ($\lnot$R)          ──────────── ($\lnot$L)
     P $\vdash$ P, $\lnot$Q                    $\lnot$Q, R $\vdash$ R
  ──────────────────────────────── (Cut on $\lnot$Q)
           P, R $\vdash$ P, R

変換後:
    P $\vdash$ P, Q     Q, R $\vdash$ R
  ────────────────────────── (Cut on Q)     ← complexity: 1 $\to$ 0
         P, R $\vdash$ P, R
```

### 5.3 含意のケース: A = B $\to$ C

```typescript
/**
 * 含意の Principal Cut
 *
 * 左前提（$\to$R を適用）:         右前提（$\to$L を適用）:
 *
 *     B, $\Gamma \vdash \Delta$, C                $\Sigma$₁ $\vdash$ Π₁, B     C, $\Sigma$₂ $\vdash$ Π₂
 *   ──────────────── ($\to$R)      ──────────────────────────────── ($\to$L)
 *    $\Gamma \vdash \Delta$, B $\to$ C              B $\to$ C, $\Sigma$₁, $\Sigma$₂ $\vdash$ Π₁, Π₂
 *
 * カット（変換前）:
 *
 *    $\Gamma \vdash \Delta$, B $\to$ C     B $\to$ C, $\Sigma$₁, $\Sigma$₂ $\vdash$ Π₁, Π₂
 *   ──────────────────────────────────────────── (Cut on B $\to$ C)
 *              $\Gamma , \Sigma$₁, $\Sigma$₂ $\vdash \Delta$, Π₁, Π₂
 *
 * 変換後:
 *
 *                          $\Sigma$₁ $\vdash$ Π₁, B     B, $\Gamma \vdash \Delta$, C
 *                         ────────────────────────────── (Cut on B)
 *                              $\Sigma$₁, $\Gamma \vdash$ Π₁, $\Delta$, C
 *                                                        C, $\Sigma$₂ $\vdash$ Π₂
 *                         ──────────────────────────────────────── (Cut on C)
 *                              $\Sigma$₁, $\Gamma , \Sigma$₂ $\vdash$ Π₁, $\Delta$, Π₂
 *
 * Reasoning:
 *   $\to$R は「B を仮定して C を証明」することで B $\to$ C を導入。
 *   $\to$L は「B を証明する部分」と「C を仮定して使う部分」に分解。
 *
 *   B $\to$ C を介さず、直接:
 *   (1) $\to$L の左前提 $\Sigma$₁ $\vdash$ Π₁, B で得られる B を、
 *       $\to$R の前提 B, $\Gamma \vdash \Delta$, C と B でカットして C を得る
 *   (2) 得られた C を、$\to$L の右前提 C, $\Sigma$₂ $\vdash$ Π₂ とカットする
 *
 *   新しいカット式 B と C はそれぞれ B $\to$ C の真部分式:
 *     complexity(B) < complexity(B $\to$ C)
 *     complexity(C) < complexity(B $\to$ C)
 *   外側の帰納法の指標が厳密に減少する。
 */
function reducePrincipalImplication(
  cutFormula: Formula & { readonly tag: "Implication" },
  leftProof: Proof, // tag === "ImplicationR"
  rightProof: Proof, // tag === "ImplicationL"
): Proof {
  const B = cutFormula.left;
  const C = cutFormula.right;

  // leftProof.premise: B, $\Gamma \vdash \Delta$, C
  // rightProof.leftPremise: $\Sigma$₁ $\vdash$ Π₁, B
  // rightProof.rightPremise: C, $\Sigma$₂ $\vdash$ Π₂
  const leftInner = (leftProof as { readonly premise: Proof }).premise;
  const rightLeft = (rightProof as { readonly leftPremise: Proof }).leftPremise;
  const rightRight = (rightProof as { readonly rightPremise: Proof })
    .rightPremise;

  // Step 1: B でカット
  //   rightLeft: $\Sigma$₁ $\vdash$ Π₁, B  と  leftInner: B, $\Gamma \vdash \Delta$, C
  const cutOnB = reduceCut(B, rightLeft, leftInner);
  // 結果: $\Sigma$₁, $\Gamma \vdash$ Π₁, $\Delta$, C

  // Step 2: C でカット
  //   cutOnB: $\Sigma$₁, $\Gamma \vdash$ Π₁, $\Delta$, C  と  rightRight: C, $\Sigma$₂ $\vdash$ Π₂
  const cutOnC = reduceCut(C, cutOnB, rightRight);
  // 結果: $\Sigma$₁, $\Gamma , \Sigma$₂ $\vdash$ Π₁, $\Delta$, Π₂

  return cutOnC;
}
```

**具体例:**

```
変換前:

     A, P $\vdash$ Q, B         (π₁)
  ──────────────────── ($\to$R)            R $\vdash$ S, A    (π₂)    B, T $\vdash$ U    (π₃)
   P $\vdash$ Q, A $\to$ B                     ─────────────────────────────── ($\to$L)
                                       A $\to$ B, R, T $\vdash$ S, U
  ──────────────────────────────────────────────────────── (Cut on A $\to$ B)
                    P, R, T $\vdash$ Q, S, U

変換後:

                     R $\vdash$ S, A    (π₂)    A, P $\vdash$ Q, B    (π₁)
                    ──────────────────────────────────── (Cut on A)
                           R, P $\vdash$ S, Q, B
                                                  B, T $\vdash$ U    (π₃)
                    ──────────────────────────────────── (Cut on B)
                           R, P, T $\vdash$ S, Q, U

complexity(A) < complexity(A $\to$ B), complexity(B) < complexity(A $\to$ B)
```

### 5.4 連言のケース: A = B $\land$ C

```typescript
/**
 * 連言の Principal Cut
 *
 * 左前提（$\land$R を適用）:
 *
 *   $\Gamma \vdash \Delta$, B     $\Gamma \vdash \Delta$, C
 *  ────────────────────────── ($\land$R)
 *       $\Gamma \vdash \Delta$, B $\land$ C
 *
 * 右前提（$\land$L₁ を適用した場合）:
 *
 *     B, $\Sigma \vdash$ Π
 *   ────────────── ($\land$L₁)
 *    B $\land$ C, $\Sigma \vdash$ Π
 *
 * 変換後:
 *
 *   $\Gamma \vdash \Delta$, B     B, $\Sigma \vdash$ Π
 *  ──────────────────────────── (Cut on B)
 *        $\Gamma , \Sigma \vdash \Delta$, Π
 *
 * Reasoning:
 *   $\land$R は B と C の両方を証明して B $\land$ C を導入。
 *   $\land$L₁ は B $\land$ C から B だけを取り出す。
 *   よって B の証明（$\land$R の左前提）を直接使えばよい。
 *   C の証明（$\land$R の右前提）は使われない。
 *   新カット式 B は B $\land$ C の真部分式なので複雑度が減少。
 *
 * 右前提が $\land$L₂ の場合は対称的に C でカットする。
 */
function reducePrincipalConjunction(
  cutFormula: Formula & { readonly tag: "Conjunction" },
  leftProof: Proof, // tag === "ConjunctionR"
  rightProof: Proof, // tag === "ConjunctionL1" or "ConjunctionL2"
): Proof {
  const leftL = (leftProof as { readonly leftPremise: Proof }).leftPremise; // $\Gamma \vdash \Delta$, B
  const leftR = (leftProof as { readonly rightPremise: Proof }).rightPremise; // $\Gamma \vdash \Delta$, C
  const rightInner = (rightProof as { readonly premise: Proof }).premise;

  if (rightProof.tag === "ConjunctionL1") {
    // $\land$L₁: B, $\Sigma \vdash$ Π
    return reduceCut(cutFormula.left, leftL, rightInner); // Cut on B
  } else {
    // $\land$L₂: C, $\Sigma \vdash$ Π
    return reduceCut(cutFormula.right, leftR, rightInner); // Cut on C
  }
}
```

**具体例 ($\land$L₁):**

```
変換前:
   P $\vdash$ P, Q    (WR)     P $\vdash$ P, R    (WR)
  ────────────────────────────────── ($\land$R)       Q, S $\vdash$ T   (π₃)
       P $\vdash$ P, Q $\land$ R                          ──────────── ($\land$L₁)
                                               Q $\land$ R, S $\vdash$ T
  ──────────────────────────────────────────── (Cut on Q $\land$ R)
              P, S $\vdash$ P, T

変換後:
   P $\vdash$ P, Q     Q, S $\vdash$ T
  ────────────────────────── (Cut on Q)     ← complexity 減少
        P, S $\vdash$ P, T
```

### 5.5 選言のケース: A = B $\lor$ C

```typescript
/**
 * 選言の Principal Cut
 *
 * 左前提（$\lor$R₁ を適用した場合）:
 *
 *    $\Gamma \vdash \Delta$, B
 *   ────────────── ($\lor$R₁)
 *    $\Gamma \vdash \Delta$, B $\lor$ C
 *
 * 右前提（$\lor$L を適用）:
 *
 *   B, $\Sigma$₁ $\vdash$ Π₁     C, $\Sigma$₂ $\vdash$ Π₂
 *  ──────────────────────────────── ($\lor$L)
 *      B $\lor$ C, $\Sigma$₁, $\Sigma$₂ $\vdash$ Π₁, Π₂
 *
 * 変換後:
 *
 *   $\Gamma \vdash \Delta$, B     B, $\Sigma$₁ $\vdash$ Π₁
 *  ──────────────────────────── (Cut on B)
 *        $\Gamma , \Sigma$₁ $\vdash \Delta$, Π₁
 *  （$\Sigma$₂, Π₂ の分は弱化で補う）
 *
 * Reasoning:
 *   $\lor$R₁ は B を証明して B $\lor$ C を導入。
 *   $\lor$L は B のケースと C のケースに場合分け。
 *   左前提で B が証明されているので、B のケース（$\lor$L の左前提）のみが関連。
 *   C のケース（$\lor$L の右前提）は使われない。
 *   新カット式 B は B $\lor$ C の真部分式なので複雑度が減少。
 *
 * $\lor$R₂ の場合は対称的に C でカットする。
 */
function reducePrincipalDisjunction(
  cutFormula: Formula & { readonly tag: "Disjunction" },
  leftProof: Proof, // tag === "DisjunctionR1" or "DisjunctionR2"
  rightProof: Proof, // tag === "DisjunctionL"
): Proof {
  const rightL = (rightProof as { readonly leftPremise: Proof }).leftPremise; // B, $\Sigma$₁ $\vdash$ Π₁
  const rightR = (rightProof as { readonly rightPremise: Proof }).rightPremise; // C, $\Sigma$₂ $\vdash$ Π₂

  if (leftProof.tag === "DisjunctionR1") {
    // $\lor$R₁: $\Gamma \vdash \Delta$, B
    const leftInner = (leftProof as { readonly premise: Proof }).premise;
    return reduceCut(cutFormula.left, leftInner, rightL); // Cut on B
  } else {
    // $\lor$R₂: $\Gamma \vdash \Delta$, C
    const leftInner = (leftProof as { readonly premise: Proof }).premise;
    return reduceCut(cutFormula.right, leftInner, rightR); // Cut on C
  }
}
```

**具体例 ($\lor$R₁):**

```
変換前:
     P $\vdash$ P          (Ax)
  ──────────── ($\lor$R₁)            P, Q $\vdash$ R    (π₂)    S, T $\vdash$ U    (π₃)
   P $\vdash$ P $\lor$ S                  ──────────────────────────────── ($\lor$L)
                                P $\lor$ S, Q, T $\vdash$ R, U
  ──────────────────────────────────────────────── (Cut on P $\lor$ S)
              P, Q, T $\vdash$ P, R, U

変換後:
   P $\vdash$ P     P, Q $\vdash$ R
  ──────────────────── (Cut on P)     ← complexity 減少
       P, Q $\vdash$ P, R
  （T, U の分は弱化で補う）
```

### 5.6 全称量化のケース: A = $\forall$x.B

```typescript
/**
 * 全称量化の Principal Cut
 *
 * 左前提（$\forall$R を適用）:           右前提（$\forall$L を適用）:
 *
 *    $\Gamma \vdash \Delta$, B[y/x]                B[t/x], $\Sigma \vdash$ Π
 *   ──────────────── ($\forall$R)       ──────────────── ($\forall$L)
 *    $\Gamma \vdash \Delta , \forall$x.B                $\forall$x.B, $\Sigma \vdash$ Π
 *
 * ここで y は $\forall$R の固有変数（$\Gamma , \Delta$ に自由に出現しない）
 *
 * 変換後:
 *
 *   $\Gamma \vdash \Delta$, B[t/x]     B[t/x], $\Sigma \vdash$ Π
 *  ──────────────────────────────────── (Cut on B[t/x])
 *           $\Gamma , \Sigma \vdash \Delta$, Π
 *
 * Reasoning:
 *   $\forall$R は固有変数 y で B[y/x] を証明し、$\forall$x.B を導入。
 *   $\forall$L は項 t で例化して B[t/x] を前件に入れる。
 *
 *   y は固有変数（$\Gamma , \Delta$ に自由に出現しない）なので、
 *   左前提の証明 π₁ 中の y を t で置き換えても証明は有効。
 *   これにより π₁ は $\Gamma \vdash \Delta$, B[t/x] の証明になる。
 *
 *   新カット式 B[t/x] は $\forall$x.B の真部分式（の代入例）:
 *     complexity(B[t/x]) = complexity(B) < complexity($\forall$x.B) = complexity(B) + 1
 *   （代入は複雑度を変えない — 構造的な深さは同じ。）
 *   外側の帰納法の指標が 1 減少する。
 *
 * 注意:
 *   固有変数条件が y の t による置換を正当化する。
 *   y が $\Gamma , \Delta$ に出現しないため、置換は証明の他の部分に影響しない。
 */
function reducePrincipalUniversal(
  cutFormula: Formula & { readonly tag: "Universal" },
  leftProof: Proof, // tag === "UniversalR"
  rightProof: Proof, // tag === "UniversalL"
): Proof {
  const x = cutFormula.variable;
  const B = cutFormula.body;
  const y = (leftProof as { readonly eigenvariable: string }).eigenvariable;
  const t = (rightProof as { readonly term: Term }).term;

  // 左前提の証明で y を t に置換
  // leftProof.premise は $\Gamma \vdash \Delta$, B[y/x] を証明
  // y $\to$ t の置換で $\Gamma \vdash \Delta$, B[t/x] の証明になる
  const leftSubstituted = substituteInProof(
    (leftProof as { readonly premise: Proof }).premise,
    y,
    t,
  );

  // 右前提の前提: B[t/x], $\Sigma \vdash$ Π
  const rightInner = (rightProof as { readonly premise: Proof }).premise;

  // B[t/x] でカット
  const newCutFormula = substituteVar(B, x, t);
  return reduceCut(newCutFormula, leftSubstituted, rightInner);
}
```

**具体例:**

```
変換前:
       P(y) $\vdash$ P(y)       (Ax)
    ──────────────────── ($\forall$R)     y は固有変数        P(f(a)), Q $\vdash$ R    (π₂)
     $\vdash \forall$x.P(x)                                     ──────────────── ($\forall$L, t=f(a))
                                                     $\forall$x.P(x), Q $\vdash$ R
  ──────────────────────────────────────────── (Cut on $\forall$x.P(x))
                  Q $\vdash$ R

変換後:

    P(f(a)) $\vdash$ P(f(a))     (Ax, y$\to$f(a) 置換)     P(f(a)), Q $\vdash$ R    (π₂)
  ──────────────────────────────────────────── (Cut on P(f(a)))
                  Q $\vdash$ R

（P(f(a)) は $\forall$x.P(x) より complexity が 1 小さい）
```

### 5.7 存在量化のケース: A = $\exists$x.B

```typescript
/**
 * 存在量化の Principal Cut
 *
 * 全称のケースと対称的。
 *
 * 左前提（$\exists$R を適用）:           右前提（$\exists$L を適用）:
 *
 *    $\Gamma \vdash \Delta$, B[t/x]                B[y/x], $\Sigma \vdash$ Π
 *   ──────────────── ($\exists$R)       ──────────────── ($\exists$L)
 *    $\Gamma \vdash \Delta , \exists$x.B                $\exists$x.B, $\Sigma \vdash$ Π
 *
 * ここで y は $\exists$L の固有変数（$\Sigma$, Π に自由に出現しない）
 *
 * 変換後:
 *
 *   $\Gamma \vdash \Delta$, B[t/x]     B[t/x], $\Sigma \vdash$ Π
 *  ──────────────────────────────────── (Cut on B[t/x])
 *           $\Gamma , \Sigma \vdash \Delta$, Π
 *
 * Reasoning:
 *   $\exists$R は項 t で B[t/x] を証明し、$\exists$x.B を導入。
 *   $\exists$L は固有変数 y で展開して B[y/x] を前件に入れる。
 *   y は固有変数なので、右前提の証明中の y を t で置換しても有効。
 *   これにより B[t/x] で直接カットできる。
 *   複雑度は全称のケースと同様に 1 減少する。
 */
function reducePrincipalExistential(
  cutFormula: Formula & { readonly tag: "Existential" },
  leftProof: Proof, // tag === "ExistentialR"
  rightProof: Proof, // tag === "ExistentialL"
): Proof {
  const x = cutFormula.variable;
  const B = cutFormula.body;
  const t = (leftProof as { readonly term: Term }).term;
  const y = (rightProof as { readonly eigenvariable: string }).eigenvariable;

  // 右前提の証明で y を t に置換
  const rightSubstituted = substituteInProof(
    (rightProof as { readonly premise: Proof }).premise,
    y,
    t,
  );

  // 左前提の前提: $\Gamma \vdash \Delta$, B[t/x]
  const leftInner = (leftProof as { readonly premise: Proof }).premise;

  // B[t/x] でカット
  const newCutFormula = substituteVar(B, x, t);
  return reduceCut(newCutFormula, leftInner, rightSubstituted);
}
```

## 6. Case 4: 構造規則との相互作用

### 6.1 弱化とカット

カット式が弱化で導入された場合、カット式は実際には証明に「使われていない」ため、カットを即座に除去できる。

```typescript
/**
 * Case 4a: 左前提の弱化でカット式 A が後件に追加された場合
 *
 *       $\Gamma \vdash \Delta$
 *   ──────────── (WR)          A, $\Sigma \vdash$ Π
 *    $\Gamma \vdash \Delta$, A
 *   ─────────────────────── (Cut on A)
 *        $\Gamma , \Sigma \vdash \Delta$, Π
 *
 * 変換後:
 *
 *    $\Gamma \vdash \Delta \Sigma \vdash$ Π
 *   ──── (WL×|$\Sigma$|, WR×|Π|)    ──── (WL×|$\Gamma$|, WR×|$\Delta$|)
 *    $\Gamma , \Sigma \vdash \Delta$, Π             （弱化で拡張）
 *
 * Reasoning:
 *   左前提で A は弱化により追加されただけ — 実際に証明されていない。
 *   右前提では A を仮定として使っているが、A は「使われていない仮定」
 *   であるため、右前提から A を除去（= 右前提の A なしバージョンを構築）
 *   するか、あるいは左前提のカット式なし証明に弱化を適用して結論に到達する。
 *
 *   より正確には:
 *   - $\Gamma \vdash \Delta$ の証明が存在する（弱化の前提）
 *   - 結論 $\Gamma , \Sigma \vdash \Delta$, Π は弱化を繰り返し適用することで得られる
 *   カットは完全に除去される（新しいカットは生じない）。
 */
function reduceCutWeakeningLeft(
  cutFormula: Formula,
  leftProof: Proof, // tag === "WeakeningR", added === cutFormula
  rightProof: Proof,
): Proof {
  // leftProof.premise: $\Gamma \vdash \Delta$ を証明
  // 結論 $\Gamma , \Sigma \vdash \Delta$, Π を弱化で構築
  const basePremise = (leftProof as { readonly premise: Proof }).premise;
  const rightConclusion = conclusion(rightProof);

  // $\Sigma$ の各式を WL で追加し、Π の各式を WR で追加
  let result = basePremise;
  for (const formula of rightConclusion.antecedent) {
    if (!formulaEquals(formula, cutFormula)) {
      result = { tag: "WeakeningL", added: formula, premise: result };
    }
  }
  for (const formula of rightConclusion.succedent) {
    result = { tag: "WeakeningR", added: formula, premise: result };
  }
  return result;
}

/**
 * Case 4b: 右前提の弱化でカット式 A が前件に追加された場合
 *
 *                         $\Sigma \vdash$ Π
 *   $\Gamma \vdash \Delta$, A         ──────────── (WL)
 *                      A, $\Sigma \vdash$ Π
 *   ─────────────────────────── (Cut on A)
 *        $\Gamma , \Sigma \vdash \Delta$, Π
 *
 * 変換後: 右前提 $\Sigma \vdash$ Π に弱化を適用して $\Gamma , \Sigma \vdash \Delta$, Π を構築
 *
 * Reasoning: Case 4a と対称的。
 */
function reduceCutWeakeningRight(
  cutFormula: Formula,
  leftProof: Proof,
  rightProof: Proof, // tag === "WeakeningL", added === cutFormula
): Proof {
  const basePremise = (rightProof as { readonly premise: Proof }).premise;
  const leftConclusion = conclusion(leftProof);

  let result = basePremise;
  for (const formula of leftConclusion.antecedent) {
    result = { tag: "WeakeningL", added: formula, premise: result };
  }
  for (const formula of leftConclusion.succedent) {
    if (!formulaEquals(formula, cutFormula)) {
      result = { tag: "WeakeningR", added: formula, premise: result };
    }
  }
  return result;
}
```

**具体例:**

```
変換前:
      P $\vdash$ Q
   ──────────── (WR)          P $\to$ Q, R $\vdash$ S    (π₂)
    P $\vdash$ Q, P $\to$ Q
  ──────────────────────────────────── (Cut on P $\to$ Q)
        P, R $\vdash$ Q, S

変換後:
    P $\vdash$ Q
  ──────── (WL)
   P, R $\vdash$ Q
  ──────── (WR)
   P, R $\vdash$ Q, S

カットは完全に除去された（新しいカットなし）。
```

### 6.2 縮約とカット

```typescript
/**
 * Case 4c: 左前提の縮約でカット式 A が後件で縮約された場合
 *
 *   $\Gamma \vdash \Delta$, A, A
 *  ────────────── (CR)          A, $\Sigma \vdash$ Π
 *    $\Gamma \vdash \Delta$, A
 *  ────────────────────────── (Cut on A)
 *       $\Gamma , \Sigma \vdash \Delta$, Π
 *
 * 変換後:
 *
 *   $\Gamma \vdash \Delta$, A, A     A, $\Sigma \vdash$ Π
 *  ──────────────────────────── (Cut on first A)    ← 段数減少
 *       $\Gamma , \Sigma \vdash \Delta$, A, Π
 *                        A, $\Sigma \vdash$ Π
 *  ──────────────────────────────── (Cut on remaining A)    ← 段数減少
 *       $\Gamma , \Sigma , \Sigma \vdash \Delta$, Π, Π
 *  (縮約で整理)
 *       $\Gamma , \Sigma \vdash \Delta$, Π
 *
 * Reasoning:
 *   縮約前の前提 $\Gamma \vdash \Delta$, A, A には A が2回出現。
 *   1回目のカットで A を1つ消費し、2回目のカットで残りを消費。
 *   各カットの段数は元のカットより小さい（縮約を飛ばしたため）。
 *   内側の帰納法により処理可能。
 *
 *   注意: $\Sigma$ と Π が重複するが、縮約規則で整理できる。
 *   これが証明サイズ増大の一因である（証明が複製される）。
 */
function reduceCutContractionLeft(
  cutFormula: Formula,
  leftProof: Proof, // tag === "ContractionR", formula === cutFormula
  rightProof: Proof,
): Proof {
  // leftProof.premise: $\Gamma \vdash \Delta$, A, A
  const innerPremise = (leftProof as { readonly premise: Proof }).premise;

  // 1回目のカット: A を1つ消す（A がまだ1つ残る）
  const firstCut = reduceCut(cutFormula, innerPremise, rightProof);
  // 結果: $\Gamma , \Sigma \vdash \Delta$, Π, A   (A が1つ残っている)

  // 2回目のカット: 残りの A を消す
  const secondCut = reduceCut(cutFormula, firstCut, rightProof);
  // 結果: $\Gamma , \Sigma , \Sigma \vdash \Delta$, Π, Π

  // 必要なら $\Sigma$ と Π の重複を縮約で整理
  return applyContractions(secondCut);
}

/**
 * Case 4d: 右前提の縮約でカット式 A が前件で縮約された場合
 *
 * 対称的な処理。
 */
function reduceCutContractionRight(
  cutFormula: Formula,
  leftProof: Proof,
  rightProof: Proof, // tag === "ContractionL", formula === cutFormula
): Proof {
  const innerPremise = (rightProof as { readonly premise: Proof }).premise;
  // innerPremise: A, A, $\Sigma \vdash$ Π

  const firstCut = reduceCut(cutFormula, leftProof, innerPremise);
  const secondCut = reduceCut(cutFormula, leftProof, firstCut);
  return applyContractions(secondCut);
}
```

**具体例:**

```
変換前:
   P $\vdash$ P, P           (π₁)
  ────────── (CR)              P, Q $\vdash$ R    (π₂)
   P $\vdash$ P
  ──────────────────── (Cut on P)
       P, Q $\vdash$ R

変換後:
   P $\vdash$ P, P     P, Q $\vdash$ R
  ────────────────────────── (Cut on P)     ← 段数減少
       P, Q $\vdash$ P, R
                     P, Q $\vdash$ R
  ──────────────────────────── (Cut on P)     ← 段数減少
       P, Q, Q $\vdash$ R, R
  ────── (CL)
   P, Q $\vdash$ R, R
  ────── (CR)
   P, Q $\vdash$ R
```

## 7. Mix 規則による代替アプローチ

縮約とカットの相互作用（Case 4c, 4d）は複雑であり、証明サイズの爆発の主因でもある。**Mix 規則**を使うと、この問題をよりエレガントに扱える。

### 7.1 Mix 規則の定義（再掲）

```
  $\Gamma \vdash \Delta$, A, ..., A     A, ..., A, $\Sigma \vdash$ Π
──────────────────────────────────────────── (Mix)
              $\Gamma , \Sigma \vdash \Delta$, Π
```

Mix はカット式 `A` の**すべての出現**を一度に除去する。

### 7.2 Mix 除去のメリット

```typescript
/**
 * Mix 除去の場合、縮約との相互作用が不要になる。
 *
 * 縮約ケース（Case 4c）でカットを2回行う必要があったが、
 * Mix なら1回で A のすべての出現を除去できる。
 *
 * これにより:
 * - 場合分けが簡素化される
 * - 証明はよりクリーンになる
 * - ただし、証明サイズの爆発は本質的には変わらない
 *
 * Troelstra & Schwichtenberg (2000) はこのアプローチを推奨している。
 */
```

## 8. 停止性の議論

### 8.1 減少する指標

カット除去アルゴリズムの停止性は、各変換で以下の辞書式順序 `(c, d)` が厳密に減少することで保証される:

| 指標 | 定義                        | 値域       |
| ---- | --------------------------- | ---------- |
| `c`  | カット式の複雑度（外側）    | 自然数 ≥ 0 |
| `d`  | カットの段数 / 深さ（内側） | 自然数 ≥ 0 |

辞書式順序: `(c₁, d₁) < (c₂, d₂)` $\iff$ `c₁ < c₂` または（`c₁ = c₂` かつ `d₁ < d₂`）

### 8.2 各ケースの指標変化

| ケース          | c（複雑度） | d（段数）        | 辞書式順序                         |
| --------------- | ----------- | ---------------- | ---------------------------------- |
| Case 1: 公理    | —           | —                | カット除去完了                     |
| Case 2: 非主式  | 不変        | 減少             | (c, d) $\to$ (c, d') where d' < d  |
| Case 3: 主式    | 減少        | 増加の可能性あり | (c, d) $\to$ (c', d') where c' < c |
| Case 4a/b: 弱化 | —           | —                | カット除去完了                     |
| Case 4c/d: 縮約 | 不変        | 減少             | (c, d) $\to$ (c, d') where d' < d  |

### 8.3 厳密な停止性証明の概略

**定理:** `reduceCut(A, π₁, π₂)` は有限回の再帰呼び出しで停止する。

**証明:** ペア `(complexity(A), depth(π₁) + depth(π₂))` に辞書式順序を入れた整列帰納法による。

1. **Case 1（公理）:** 即座に停止。再帰呼び出しなし。

2. **Case 2（非主式）:** 再帰呼び出し `reduceCut(A, π₁', π₂)` または `reduceCut(A, π₁, π₂')` では、`complexity(A)` は不変だが、`depth(π₁')` < `depth(π₁)` または `depth(π₂')` < `depth(π₂)`。よって辞書式順序が減少。

3. **Case 3（主式）:** 再帰呼び出し `reduceCut(A', ...)` では `complexity(A')` < `complexity(A)`。外側の指標が減少するため、内側の指標は任意でよい。

4. **Case 4a/b（弱化）:** 即座に停止。新しいカットは生じない。

5. **Case 4c/d（縮約）:** 再帰呼び出し `reduceCut(A, innerPremise, π₂)` では `complexity(A)` は不変だが、縮約規則を飛ばした分だけ段数が減少。

いずれのケースでも辞書式順序 `(complexity, depth)` が厳密に減少する。自然数の辞書式順序は整列的であるから、有限回で停止する。 ∎

### 8.4 計算量に関する注意

**命題論理の場合:**

- 入力の証明サイズ n に対し、カット除去後の証明サイズの上界:
  $2_n(1)$ （高さ n の2の塔 = $2^{2^{2^{\cdots}}}$, n 段）
- 下界: Statman (1979) により、この非初等的爆発は避けられないことが証明されている

**主な爆発の原因:**

1. **Case 3（含意）:** 1つのカットが2つのカットに分裂 $\to$ 指数的増大
2. **Case 4c/d（縮約）:** 証明が複製される $\to$ 指数的増大
3. **これらの組み合わせ:** 非初等的な爆発

**一階述語論理の場合:** さらに悪化する。項の代入により複雑度は変わらないが、証明の構造が変わりうるため、上界はさらに大きくなる。

## 9. 補助関数

### 9.1 主式判定

```typescript
/**
 * 証明の最後の規則でカット式 A が主式（導入された式）かを判定
 *
 * 主式とは: その規則によって新たに導入された（構築された）論理式。
 * 例: $\to$R の主式は B $\to$ C、$\land$L₁ の主式は B $\land$ C
 */
function isPrincipal(proof: Proof, cutFormula: Formula): boolean {
  switch (proof.tag) {
    case "NegationR":
      // $\lnot$R の主式は $\lnot$B（後件に導入）
      return formulaEquals(
        { tag: "Negation", body: extractBodyFromNegationR(proof) },
        cutFormula,
      );
    case "NegationL":
      // $\lnot$L の主式は $\lnot$B（前件に導入）
      return formulaEquals(
        { tag: "Negation", body: extractBodyFromNegationL(proof) },
        cutFormula,
      );
    case "ImplicationR":
      return formulaEquals(proof.formula, cutFormula);
    case "ImplicationL":
      return formulaEquals(proof.formula, cutFormula);
    case "ConjunctionR":
      return formulaEquals(proof.formula, cutFormula);
    case "ConjunctionL1":
    case "ConjunctionL2":
      return formulaEquals(proof.formula, cutFormula);
    case "DisjunctionR1":
    case "DisjunctionR2":
      return formulaEquals(proof.formula, cutFormula);
    case "DisjunctionL":
      return formulaEquals(proof.formula, cutFormula);
    case "UniversalR":
      return formulaEquals(proof.formula, cutFormula);
    case "UniversalL":
      return formulaEquals(proof.formula, cutFormula);
    case "ExistentialR":
      return formulaEquals(proof.formula, cutFormula);
    case "ExistentialL":
      return formulaEquals(proof.formula, cutFormula);
    default:
      // 公理、構造規則には「主式」の概念が（この意味では）ない
      return false;
  }
}
```

### 9.2 証明中の変数置換

```typescript
/**
 * 証明中のすべての変数出現を置換する。
 * 量化子の Principal Cut（Case 3.6, 3.7）で使用。
 *
 * Reasoning: 固有変数条件により、置換対象の変数は
 * 証明中で「自由に」使われていないことが保証されている。
 * よって置換は証明の正当性を保つ。
 */
function substituteInProof(proof: Proof, variable: string, term: Term): Proof {
  // 証明木を再帰的に走査し、各シーケント中の論理式の
  // variable を term で置換する
  // ...
}
```

## 10. まとめ: アルゴリズムの流れ

```
eliminateCuts(proof)
  │
  ├─ カット階数 = 0 $\to$ 完了
  │
  └─ カット階数 > 0 $\to$ reduceTopCut(proof)
       │
       └─ 最も上のカットを見つける
            │
            └─ reduceCut(A, π_L, π_R)
                 │
                 ├─ Case 1: 公理 $\to$ π_L or π_R をそのまま返す
                 │
                 ├─ Case 4a/b: 弱化 $\to$ 弱化で結論を構築（カット除去完了）
                 │
                 ├─ Case 4c/d: 縮約 $\to$ 2回カット + 縮約（段数減少）
                 │
                 ├─ Case 3: Principal $\to$ 論理結合子ごとの分解
                 │   ├─ $\lnot$: Cut($\lnot$B) $\to$ Cut(B)
                 │   ├─ $\to$: Cut(B$\to$C) $\to$ Cut(B) + Cut(C)
                 │   ├─ $\land$: Cut(B$\land$C) $\to$ Cut(B) or Cut(C)
                 │   ├─ $\lor$: Cut(B$\lor$C) $\to$ Cut(B) or Cut(C)
                 │   ├─ $\forall$: Cut($\forall$x.B) $\to$ Cut(B[t/x])
                 │   └─ $\exists$: Cut($\exists$x.B) $\to$ Cut(B[t/x])
                 │
                 └─ Case 2: Non-principal $\to$ カットを上に持ち上げ（段数減少）
```

## 参考文献

- **Gentzen, G.** "Untersuchungen über das logische Schließen" _Mathematische Zeitschrift_ 39, 176-210, 405-431 (1935)
  — カット除去定理の原典。本ドキュメントの疑似コードはGentzenのオリジナル証明に基づく

- **Troelstra, A.S. & Schwichtenberg, H.** _Basic Proof Theory_ (2nd ed., Cambridge University Press, 2000)
  — Chapter 4 でカット除去の詳細な証明。Mix除去に基づくアプローチを推奨。本ドキュメントのCase 4（縮約）の代替としてSection 7で紹介

- **Girard, J.-Y., Lafont, Y. & Taylor, P.** _Proofs and Types_ (Cambridge University Press, 1989)
  — Chapter 13 でカット除去を解説。カリー＝ハワード対応の視点を含む

- **Takeuti, G.** _Proof Theory_ (2nd ed., North-Holland, 1987)
  — カット除去の包括的な扱い

- **Buss, S.R.** "An Introduction to Proof Theory" in _Handbook of Proof Theory_ (Elsevier, 1998)
  — カット除去の現代的入門。疑似コード的な記述が豊富

- **Statman, R.** "Lower bounds on Herbrand's theorem" _Proceedings of the American Mathematical Society_ 75(1), 104-107 (1979)
  — カット除去による証明サイズの非初等的爆発の下界を証明

- **nLab** "cut elimination" — <https://ncatlab.org/nlab/show/cut+elimination>
  — オンラインリファレンス
