#!/usr/bin/env -S npx tsx
/**
 * Sequent Calculus proof generator for SC quest model answers (sc-01 to sc-34).
 * Generates TypeScript step arrays for builtinModelAnswers.ts.
 *
 * Strategy: bottom-up proof search for propositional and predicate sequent calculus.
 * Supports both LK (classical) and LJ (intuitionistic, max 1 succedent).
 */

import { parseString as parseFormula } from "../src/lib/logic-lang/parser";
import { formatFormula as fmtFormula } from "../src/lib/logic-lang/formatUnicode";
import type { Formula } from "../src/lib/logic-core/formula";
import { Either } from "effect";
import { equalFormula } from "../src/lib/logic-core/equality";
import { freeVariablesInFormula } from "../src/lib/logic-core/freeVariables";
import { substituteTermVariableInFormula } from "../src/lib/logic-core/substitution";
import { termVariable } from "../src/lib/logic-core/term";

// --- Type helpers ---

function isImplication(
  f: Formula,
): f is Formula & {
  readonly _tag: "Implication";
  readonly left: Formula;
  readonly right: Formula;
} {
  return f._tag === "Implication";
}
function isConjunction(
  f: Formula,
): f is Formula & {
  readonly _tag: "Conjunction";
  readonly left: Formula;
  readonly right: Formula;
} {
  return f._tag === "Conjunction";
}
function isDisjunction(
  f: Formula,
): f is Formula & {
  readonly _tag: "Disjunction";
  readonly left: Formula;
  readonly right: Formula;
} {
  return f._tag === "Disjunction";
}
function isNegation(
  f: Formula,
): f is Formula & { readonly _tag: "Negation"; readonly formula: Formula } {
  return f._tag === "Negation";
}
function isUniversal(f: Formula): f is Formula & {
  readonly _tag: "Universal";
  readonly variable: { readonly name: string };
  readonly formula: Formula;
} {
  return f._tag === "Universal";
}
function isExistential(f: Formula): f is Formula & {
  readonly _tag: "Existential";
  readonly variable: { readonly name: string };
  readonly formula: Formula;
} {
  return f._tag === "Existential";
}
function isBottom(f: Formula): boolean {
  return (
    f._tag === "Predicate" && (f as { readonly name: string }).name === "⊥"
  );
}

// --- Types ---

type ScStep =
  | { readonly _tag: "sc-root"; readonly sequentText: string }
  | {
      readonly _tag: "sc-rule";
      readonly conclusionIndex: number;
      readonly ruleId: string;
      readonly principalPosition: number;
      readonly exchangePosition?: number;
      readonly componentIndex?: 1 | 2;
      readonly eigenVariable?: string;
      readonly termText?: string;
    };

interface Sequent {
  readonly antecedents: readonly Formula[];
  readonly succedents: readonly Formula[];
}

// Proof tree types
type ProofTree =
  | { readonly type: "identity"; readonly sequent: Sequent }
  | { readonly type: "bottom-left"; readonly sequent: Sequent }
  | {
      readonly type: "single";
      readonly sequent: Sequent;
      readonly ruleId: string;
      readonly principalPosition: number;
      readonly exchangePosition?: number;
      readonly componentIndex?: 1 | 2;
      readonly eigenVariable?: string;
      readonly termText?: string;
      readonly child: ProofTree;
    }
  | {
      readonly type: "branching";
      readonly sequent: Sequent;
      readonly ruleId: string;
      readonly principalPosition: number;
      readonly left: ProofTree;
      readonly right: ProofTree;
    };

// --- Sequent formatting ---

function formatSequent(seq: Sequent): string {
  const left = seq.antecedents.map((f) => fmtFormula(f)).join(", ");
  const right = seq.succedents.map((f) => fmtFormula(f)).join(", ");
  return `${left} ⇒ ${right}`;
}

// --- Formula parsing ---

function parse(text: string): Formula {
  const result = parseFormula(text);
  if (Either.isLeft(result)) {
    throw new Error(`Parse error: ${text}`);
  }
  return result.right;
}

// --- Helper: remove element at index ---

function removeAt<T>(arr: readonly T[], idx: number): readonly T[] {
  return [...arr.slice(0, idx), ...arr.slice(idx + 1)];
}

// --- Helper: find matching formula index ---

function findMatch(
  formulas: readonly Formula[],
  target: Formula,
): number | undefined {
  for (let i = 0; i < formulas.length; i++) {
    if (equalFormula(formulas[i]!, target)) return i;
  }
  return undefined;
}

// --- Helper: collect all free variable names ---

function allFreeVarNames(seq: Sequent): ReadonlySet<string> {
  const vars = new Set<string>();
  for (const f of [...seq.antecedents, ...seq.succedents]) {
    for (const v of freeVariablesInFormula(f)) {
      vars.add(v);
    }
  }
  return vars;
}

// --- Helper: collect candidate terms for ∃R / ∀⇒ ---

function candidateTerms(seq: Sequent, boundVarName: string): readonly string[] {
  const freeVars = allFreeVarNames(seq);
  // Try bound variable first, then free variables from context
  const terms: string[] = [boundVarName];
  for (const v of freeVars) {
    if (v !== boundVarName) terms.push(v);
  }
  return terms;
}

// --- Helper: substitute bound variable with term in formula body ---

function substituteBody(
  body: Formula,
  boundVarName: string,
  termName: string,
): Formula {
  if (boundVarName === termName) return body;
  return substituteTermVariableInFormula(
    body,
    termVariable(boundVarName),
    termVariable(termName),
  );
}

// --- Helper: fresh eigen variable ---

function freshEigenVar(seq: Sequent, preferred: string): string {
  const used = allFreeVarNames(seq);
  if (!used.has(preferred)) return preferred;
  let candidate = preferred;
  for (let i = 0; i < 100; i++) {
    candidate = candidate + "'";
    if (!used.has(candidate)) return candidate;
  }
  throw new Error("Cannot find fresh variable");
}

// --- Helper: move element in array ---

function moveElement<T>(
  arr: readonly T[],
  from: number,
  to: number,
): readonly T[] {
  const result = [...arr];
  const element = result.splice(from, 1)[0]!;
  result.splice(to, 0, element);
  return result;
}

// --- Helper: build exchange chain + implication-left ---

function buildExchangeImplicationLeft(
  seq: Sequent,
  from: number,
  to: number,
  leftChild: ProofTree,
  rightChild: ProofTree,
): ProofTree {
  // Generate exchange positions needed to move formula from `from` to `to`
  const exchangePositions: readonly number[] =
    from > to
      ? Array.from({ length: from - to }, (_, k) => from - 1 - k)
      : from < to
        ? Array.from({ length: to - from }, (_, k) => from + k)
        : [];

  // Build intermediate sequents by applying exchanges
  const intermediateSeqs: Sequent[] = [];
  let currentAntecedents = [...seq.antecedents];
  intermediateSeqs.push({
    antecedents: [...currentAntecedents],
    succedents: seq.succedents,
  });
  for (const pos of exchangePositions) {
    const tmp = currentAntecedents[pos]!;
    currentAntecedents[pos] = currentAntecedents[pos + 1]!;
    currentAntecedents[pos + 1] = tmp;
    intermediateSeqs.push({
      antecedents: [...currentAntecedents],
      succedents: seq.succedents,
    });
  }

  // Innermost: the →⇒ branching at the final position
  const finalSeq = intermediateSeqs[intermediateSeqs.length - 1]!;
  let current: ProofTree = {
    type: "branching",
    sequent: finalSeq,
    ruleId: "implication-left",
    principalPosition: to,
    left: leftChild,
    right: rightChild,
  };

  // Wrap with exchange-left steps from innermost to outermost
  for (let idx = exchangePositions.length - 1; idx >= 0; idx--) {
    current = {
      type: "single",
      sequent: intermediateSeqs[idx]!,
      ruleId: "exchange-left",
      principalPosition: 0,
      exchangePosition: exchangePositions[idx]!,
      child: current,
    };
  }

  return current;
}

// --- Proof search ---

const MAX_DEPTH = 30;

function searchProof(
  seq: Sequent,
  isLJ: boolean,
  depth: number = 0,
  contractionBudget: number = 2,
): ProofTree | null {
  if (depth > MAX_DEPTH) return null;

  // 1. Check identity: same formula on both sides
  for (const a of seq.antecedents) {
    for (const s of seq.succedents) {
      if (equalFormula(a, s)) {
        return reduceToIdentity(seq, a, isLJ);
      }
    }
  }

  // 2. Check bottom-left
  for (let i = 0; i < seq.antecedents.length; i++) {
    if (isBottom(seq.antecedents[i]!)) {
      return reduceToBottom(seq, i);
    }
  }

  // 3. Apply invertible right rules (always safe, no backtracking needed)
  for (let i = 0; i < seq.succedents.length; i++) {
    const f = seq.succedents[i]!;

    if (isImplication(f)) {
      const premise: Sequent = {
        antecedents: [f.left, ...seq.antecedents],
        succedents: [
          ...seq.succedents.slice(0, i),
          f.right,
          ...seq.succedents.slice(i + 1),
        ],
      };
      const child = searchProof(premise, isLJ, depth + 1, contractionBudget);
      if (child) {
        return {
          type: "single",
          sequent: seq,
          ruleId: "implication-right",
          principalPosition: i,
          child,
        };
      }
    }

    if (isNegation(f)) {
      const premise: Sequent = {
        antecedents: [f.formula, ...seq.antecedents],
        succedents: removeAt(seq.succedents, i),
      };
      const child = searchProof(premise, isLJ, depth + 1, contractionBudget);
      if (child) {
        return {
          type: "single",
          sequent: seq,
          ruleId: "negation-right",
          principalPosition: i,
          child,
        };
      }
    }

    if (isUniversal(f)) {
      const eigen = freshEigenVar(seq, f.variable.name);
      const premise: Sequent = {
        antecedents: seq.antecedents,
        succedents: [
          ...seq.succedents.slice(0, i),
          f.formula,
          ...seq.succedents.slice(i + 1),
        ],
      };
      const child = searchProof(premise, isLJ, depth + 1, contractionBudget);
      if (child) {
        return {
          type: "single",
          sequent: seq,
          ruleId: "universal-right",
          principalPosition: i,
          eigenVariable: eigen,
          child,
        };
      }
    }
  }

  // 4. Apply invertible left rules
  for (let i = 0; i < seq.antecedents.length; i++) {
    const f = seq.antecedents[i]!;

    if (isDisjunction(f)) {
      const rest = removeAt(seq.antecedents, i);
      const leftPremise: Sequent = {
        antecedents: [f.left, ...rest],
        succedents: seq.succedents,
      };
      const rightPremise: Sequent = {
        antecedents: [f.right, ...rest],
        succedents: seq.succedents,
      };
      const leftChild = searchProof(
        leftPremise,
        isLJ,
        depth + 1,
        contractionBudget,
      );
      if (!leftChild) continue;
      const rightChild = searchProof(
        rightPremise,
        isLJ,
        depth + 1,
        contractionBudget,
      );
      if (!rightChild) continue;
      return {
        type: "branching",
        sequent: seq,
        ruleId: "disjunction-left",
        principalPosition: i,
        left: leftChild,
        right: rightChild,
      };
    }

    if (isNegation(f)) {
      if (isLJ && seq.succedents.length > 0) continue;
      const premise: Sequent = {
        antecedents: removeAt(seq.antecedents, i),
        succedents: [...seq.succedents, f.formula],
      };
      const child = searchProof(premise, isLJ, depth + 1, contractionBudget);
      if (child) {
        return {
          type: "single",
          sequent: seq,
          ruleId: "negation-left",
          principalPosition: i,
          child,
        };
      }
    }

    if (isConjunction(f)) {
      for (const ci of [1, 2] as const) {
        const component = ci === 1 ? f.left : f.right;
        const premise: Sequent = {
          antecedents: [
            ...seq.antecedents.slice(0, i),
            component,
            ...seq.antecedents.slice(i + 1),
          ],
          succedents: seq.succedents,
        };
        const child = searchProof(premise, isLJ, depth + 1, contractionBudget);
        if (child) {
          return {
            type: "single",
            sequent: seq,
            ruleId: "conjunction-left",
            principalPosition: i,
            componentIndex: ci,
            child,
          };
        }
      }
    }

    if (isExistential(f)) {
      const eigen = freshEigenVar(seq, f.variable.name);
      const premise: Sequent = {
        antecedents: [
          ...seq.antecedents.slice(0, i),
          f.formula,
          ...seq.antecedents.slice(i + 1),
        ],
        succedents: seq.succedents,
      };
      const child = searchProof(premise, isLJ, depth + 1, contractionBudget);
      if (child) {
        return {
          type: "single",
          sequent: seq,
          ruleId: "existential-left",
          principalPosition: i,
          eigenVariable: eigen,
          child,
        };
      }
    }
  }

  // 5. Non-invertible right rules
  for (let i = 0; i < seq.succedents.length; i++) {
    const f = seq.succedents[i]!;

    if (isConjunction(f)) {
      const rest = removeAt(seq.succedents, i);
      const leftPremise: Sequent = {
        antecedents: seq.antecedents,
        succedents: [...rest, f.left],
      };
      const rightPremise: Sequent = {
        antecedents: seq.antecedents,
        succedents: [...rest, f.right],
      };
      const leftChild = searchProof(
        leftPremise,
        isLJ,
        depth + 1,
        contractionBudget,
      );
      if (!leftChild) continue;
      const rightChild = searchProof(
        rightPremise,
        isLJ,
        depth + 1,
        contractionBudget,
      );
      if (!rightChild) continue;
      return {
        type: "branching",
        sequent: seq,
        ruleId: "conjunction-right",
        principalPosition: i,
        left: leftChild,
        right: rightChild,
      };
    }

    if (isDisjunction(f)) {
      for (const ci of [1, 2] as const) {
        const component = ci === 1 ? f.left : f.right;
        const premise: Sequent = {
          antecedents: seq.antecedents,
          succedents: [
            ...seq.succedents.slice(0, i),
            component,
            ...seq.succedents.slice(i + 1),
          ],
        };
        const child = searchProof(premise, isLJ, depth + 1, contractionBudget);
        if (child) {
          return {
            type: "single",
            sequent: seq,
            ruleId: "disjunction-right",
            principalPosition: i,
            componentIndex: ci,
            child,
          };
        }
      }
    }

    if (isExistential(f)) {
      for (const t of candidateTerms(seq, f.variable.name)) {
        const substituted = substituteBody(f.formula, f.variable.name, t);
        const premise: Sequent = {
          antecedents: seq.antecedents,
          succedents: [
            ...seq.succedents.slice(0, i),
            substituted,
            ...seq.succedents.slice(i + 1),
          ],
        };
        const child = searchProof(premise, isLJ, depth + 1, contractionBudget);
        if (child) {
          return {
            type: "single",
            sequent: seq,
            ruleId: "existential-right",
            principalPosition: i,
            termText: t,
            child,
          };
        }
      }
    }
  }

  // 6. ∀⇒ (universal left)
  for (let i = 0; i < seq.antecedents.length; i++) {
    const f = seq.antecedents[i]!;
    if (isUniversal(f)) {
      for (const t of candidateTerms(seq, f.variable.name)) {
        const substituted = substituteBody(f.formula, f.variable.name, t);
        const premise: Sequent = {
          antecedents: [
            ...seq.antecedents.slice(0, i),
            substituted,
            ...seq.antecedents.slice(i + 1),
          ],
          succedents: seq.succedents,
        };
        const child = searchProof(premise, isLJ, depth + 1, contractionBudget);
        if (child) {
          return {
            type: "single",
            sequent: seq,
            ruleId: "universal-left",
            principalPosition: i,
            termText: t,
            child,
          };
        }
      }
    }
  }

  // 7. →⇒ (implication left): non-invertible, branching
  // Try each implication at every possible position (using exchange-left to reposition)
  for (let i = 0; i < seq.antecedents.length; i++) {
    const f = seq.antecedents[i]!;
    if (!isImplication(f)) continue;

    // Try the implication at every position j (j === i means no exchange needed)
    for (let j = 0; j < seq.antecedents.length; j++) {
      const reordered = moveElement(seq.antecedents, i, j);
      const gamma = reordered.slice(0, j);
      const sigma = reordered.slice(j + 1);
      const leftPremise: Sequent = {
        antecedents: [...gamma],
        succedents: [f.left],
      };
      const rightPremise: Sequent = {
        antecedents: [f.right, ...sigma],
        succedents: seq.succedents,
      };

      const leftChild = searchProof(
        leftPremise,
        isLJ,
        depth + 1,
        contractionBudget,
      );
      if (!leftChild) continue;
      const rightChild = searchProof(
        rightPremise,
        isLJ,
        depth + 1,
        contractionBudget,
      );
      if (!rightChild) continue;

      // Build exchange chain + →⇒
      return buildExchangeImplicationLeft(seq, i, j, leftChild, rightChild);
    }
  }

  // 8. Try contraction-left (limited by budget)
  if (contractionBudget > 0) {
    for (let i = 0; i < seq.antecedents.length; i++) {
      const f = seq.antecedents[i]!;
      if (
        isImplication(f) ||
        isUniversal(f) ||
        isNegation(f) ||
        isConjunction(f) ||
        isDisjunction(f)
      ) {
        const contracted: Sequent = {
          antecedents: [
            ...seq.antecedents.slice(0, i),
            f,
            f,
            ...seq.antecedents.slice(i + 1),
          ],
          succedents: seq.succedents,
        };
        const child = searchProof(
          contracted,
          isLJ,
          depth + 1,
          contractionBudget - 1,
        );
        if (child) {
          return {
            type: "single",
            sequent: seq,
            ruleId: "contraction-left",
            principalPosition: i,
            child,
          };
        }
      }
    }

    // 9. Try contraction-right for LK
    if (!isLJ) {
      for (let i = 0; i < seq.succedents.length; i++) {
        const contracted: Sequent = {
          antecedents: seq.antecedents,
          succedents: [
            ...seq.succedents.slice(0, i),
            seq.succedents[i]!,
            seq.succedents[i]!,
            ...seq.succedents.slice(i + 1),
          ],
        };
        const child = searchProof(
          contracted,
          isLJ,
          depth + 1,
          contractionBudget - 1,
        );
        if (child) {
          return {
            type: "single",
            sequent: seq,
            ruleId: "contraction-right",
            principalPosition: i,
            child,
          };
        }
      }
    }
  }

  return null;
}

// Reduce to identity axiom by adding weakening steps
function reduceToIdentity(
  seq: Sequent,
  matchFormula: Formula,
  isLJ: boolean,
): ProofTree | null {
  const antIdx = findMatch(seq.antecedents, matchFormula);
  const sucIdx = findMatch(seq.succedents, matchFormula);
  if (antIdx === undefined || sucIdx === undefined) return null;

  // Remove extra antecedents first
  if (seq.antecedents.length > 1) {
    for (let i = seq.antecedents.length - 1; i >= 0; i--) {
      if (i === antIdx) continue;
      const newSeq: Sequent = {
        antecedents: removeAt(seq.antecedents, i),
        succedents: seq.succedents,
      };
      const child = reduceToIdentity(newSeq, matchFormula, isLJ);
      if (child) {
        return {
          type: "single",
          sequent: seq,
          ruleId: "weakening-left",
          principalPosition: i,
          child,
        };
      }
    }
  }

  // Remove extra succedents
  if (seq.succedents.length > 1) {
    for (let i = seq.succedents.length - 1; i >= 0; i--) {
      if (i === sucIdx) continue;
      const newSeq: Sequent = {
        antecedents: seq.antecedents,
        succedents: removeAt(seq.succedents, i),
      };
      const child = reduceToIdentity(newSeq, matchFormula, isLJ);
      if (child) {
        return {
          type: "single",
          sequent: seq,
          ruleId: "weakening-right",
          principalPosition: i,
          child,
        };
      }
    }
  }

  // Base case: φ ⇒ φ
  if (seq.antecedents.length === 1 && seq.succedents.length === 1) {
    return { type: "identity", sequent: seq };
  }

  return null;
}

// Reduce to bottom-left axiom
function reduceToBottom(seq: Sequent, bottomIdx: number): ProofTree | null {
  if (seq.antecedents.length > 1) {
    for (let i = seq.antecedents.length - 1; i >= 0; i--) {
      if (i === bottomIdx) continue;
      const newSeq: Sequent = {
        antecedents: removeAt(seq.antecedents, i),
        succedents: seq.succedents,
      };
      const newBottomIdx = i < bottomIdx ? bottomIdx - 1 : bottomIdx;
      const child = reduceToBottom(newSeq, newBottomIdx);
      if (child) {
        return {
          type: "single",
          sequent: seq,
          ruleId: "weakening-left",
          principalPosition: i,
          child,
        };
      }
    }
  }

  // ⊥ ⇒ ... (with possible succedents - OK for bottom-left)
  return { type: "bottom-left", sequent: seq };
}

// --- Flatten proof tree to steps ---

function flattenProof(tree: ProofTree): readonly ScStep[] {
  const steps: ScStep[] = [];
  let nextIndex = 0;

  steps.push({
    _tag: "sc-root",
    sequentText: formatSequent(tree.sequent),
  });
  nextIndex = 1;

  function visit(node: ProofTree, conclusionIndex: number): void {
    if (node.type === "identity") {
      steps.push({
        _tag: "sc-rule",
        conclusionIndex,
        ruleId: "identity",
        principalPosition: 0,
      });
      nextIndex++;
      return;
    }

    if (node.type === "bottom-left") {
      steps.push({
        _tag: "sc-rule",
        conclusionIndex,
        ruleId: "bottom-left",
        principalPosition: 0,
      });
      nextIndex++;
      return;
    }

    if (node.type === "single") {
      const step: ScStep = {
        _tag: "sc-rule",
        conclusionIndex,
        ruleId: node.ruleId,
        principalPosition: node.principalPosition,
        ...(node.exchangePosition !== undefined && {
          exchangePosition: node.exchangePosition,
        }),
        ...(node.componentIndex !== undefined && {
          componentIndex: node.componentIndex,
        }),
        ...(node.eigenVariable !== undefined && {
          eigenVariable: node.eigenVariable,
        }),
        ...(node.termText !== undefined && { termText: node.termText }),
      };
      steps.push(step);
      const childIndex = nextIndex;
      nextIndex++;
      visit(node.child, childIndex);
      return;
    }

    if (node.type === "branching") {
      steps.push({
        _tag: "sc-rule",
        conclusionIndex,
        ruleId: node.ruleId,
        principalPosition: node.principalPosition,
      });
      const leftIndex = nextIndex;
      const rightIndex = nextIndex + 1;
      nextIndex += 2;
      visit(node.left, leftIndex);
      visit(node.right, rightIndex);
      return;
    }
  }

  visit(tree, 0);
  return steps;
}

// --- Quest definitions ---

interface QuestDef {
  readonly id: string;
  readonly varName: string;
  readonly formula: string;
  readonly isLJ: boolean;
}

const quests: readonly QuestDef[] = [
  // LK体系 (sc-01 to sc-10)
  { id: "sc-01", varName: "sc01Identity", formula: "phi -> phi", isLJ: false },
  {
    id: "sc-02",
    varName: "sc02WeakeningLeft",
    formula: "phi -> (psi -> phi)",
    isLJ: false,
  },
  {
    id: "sc-03",
    varName: "sc03ContractionLeft",
    formula: "(phi -> (phi -> psi)) -> (phi -> psi)",
    isLJ: false,
  },
  {
    id: "sc-04",
    varName: "sc04Exchange",
    formula: "(phi -> (psi -> chi)) -> (psi -> (phi -> chi))",
    isLJ: false,
  },
  {
    id: "sc-05",
    varName: "sc05ConjIntro",
    formula: "phi -> (psi -> (phi /\\ psi))",
    isLJ: false,
  },
  {
    id: "sc-06",
    varName: "sc06DisjElim",
    formula: "(phi \\/ psi) -> ((phi -> chi) -> ((psi -> chi) -> chi))",
    isLJ: false,
  },
  {
    id: "sc-07",
    varName: "sc07ExcludedMiddle",
    formula: "phi \\/ ~phi",
    isLJ: false,
  },
  {
    id: "sc-08",
    varName: "sc08DoubleNegation",
    formula: "~~phi -> phi",
    isLJ: false,
  },
  {
    id: "sc-09",
    varName: "sc09Contraposition",
    formula: "(phi -> psi) -> (~psi -> ~phi)",
    isLJ: false,
  },
  {
    id: "sc-10",
    varName: "sc10DeMorgan",
    formula: "~(phi /\\ psi) -> (~phi \\/ ~psi)",
    isLJ: false,
  },
  // LJ体系 (sc-11 to sc-22)
  { id: "sc-11", varName: "sc11LjIdentity", formula: "phi -> phi", isLJ: true },
  { id: "sc-12", varName: "sc12LjExFalso", formula: "⊥ -> phi", isLJ: true },
  {
    id: "sc-13",
    varName: "sc13LjContraposition",
    formula: "(phi -> psi) -> (~psi -> ~phi)",
    isLJ: true,
  },
  {
    id: "sc-14",
    varName: "sc14LjDisjElim",
    formula: "(phi \\/ psi) -> ((phi -> chi) -> ((psi -> chi) -> chi))",
    isLJ: true,
  },
  {
    id: "sc-15",
    varName: "sc15LjConjElim",
    formula: "(phi /\\ psi) -> phi",
    isLJ: true,
  },
  {
    id: "sc-16",
    varName: "sc16LjConjCommute",
    formula: "(phi /\\ psi) -> (psi /\\ phi)",
    isLJ: true,
  },
  {
    id: "sc-17",
    varName: "sc17LjImplicationTransitivity",
    formula: "(phi -> psi) -> ((psi -> chi) -> (phi -> chi))",
    isLJ: true,
  },
  {
    id: "sc-18",
    varName: "sc18LjBottomNegation",
    formula: "(phi -> ⊥) -> (phi -> psi)",
    isLJ: true,
  },
  {
    id: "sc-19",
    varName: "sc19LjDisjIntro",
    formula: "phi -> (phi \\/ psi)",
    isLJ: true,
  },
  {
    id: "sc-20",
    varName: "sc20LjCurry",
    formula: "((phi /\\ psi) -> chi) -> (phi -> (psi -> chi))",
    isLJ: true,
  },
  {
    id: "sc-21",
    varName: "sc21LjUncurry",
    formula: "(phi -> (psi -> chi)) -> ((phi /\\ psi) -> chi)",
    isLJ: true,
  },
  {
    id: "sc-22",
    varName: "sc22LjImplicationConjDistrib",
    formula: "(phi -> (psi /\\ chi)) -> ((phi -> psi) /\\ (phi -> chi))",
    isLJ: true,
  },
  // LK固有クエスト (sc-23 to sc-26)
  {
    id: "sc-23",
    varName: "sc23LkPeirceLaw",
    formula: "((phi -> psi) -> phi) -> phi",
    isLJ: false,
  },
  {
    id: "sc-24",
    varName: "sc24LkConverseContraposition",
    formula: "(~psi -> ~phi) -> (phi -> psi)",
    isLJ: false,
  },
  {
    id: "sc-25",
    varName: "sc25LkImplicationAsDisjunction",
    formula: "(phi -> psi) -> (~phi \\/ psi)",
    isLJ: false,
  },
  {
    id: "sc-26",
    varName: "sc26LkWeakExcludedMiddle",
    formula: "~phi \\/ ~~phi",
    isLJ: false,
  },
  // LJ述語論理 (sc-27 to sc-34)
  // NOTE: formulas must match builtinQuests.ts goal formulaText exactly (modulo parser equivalence)
  // sc-27: "all x. P(x) -> P(a)" parses as ∀x.(P(x)→P(a)) (Universal at top) — NOT valid.
  //   Intended formula is (∀x.P(x))→P(a) but parser binds quantifier over everything. Quest formula bug.
  // { id: "sc-27", varName: "sc27LjUniversalElim", formula: "all x. P(x) -> P(a)", isLJ: true },
  {
    id: "sc-28",
    varName: "sc28LjExistentialIntro",
    formula: "P(a) -> ex x. P(x)",
    isLJ: true,
  },
  {
    id: "sc-29",
    varName: "sc29LjUniversalToExistential",
    formula: "all x. P(x) -> ex x. P(x)",
    isLJ: true,
  },
  // sc-30: P(x,y) breaks splitSequentTextParts comma split — skip (keep axiom placeholder)
  // { id: "sc-30", varName: "sc30LjUniversalSwap", formula: "all x. all y. P(x, y) -> all y. all x. P(x, y)", isLJ: true },
  {
    id: "sc-31",
    varName: "sc31LjExistentialElim",
    formula: "ex x. (P(x) /\\ Q(x)) -> ex x. P(x)",
    isLJ: true,
  },
  {
    id: "sc-32",
    varName: "sc32LjExistentialDistrib",
    formula: "ex x. (P(x) \\/ Q(x)) -> ex x. P(x) \\/ ex x. Q(x)",
    isLJ: true,
  },
  {
    id: "sc-33",
    varName: "sc33LkNegUniversalToExistNeg",
    formula: "~(all x. P(x)) -> ex x. ~P(x)",
    isLJ: false,
  },
  // sc-34: "all x. (P(x) -> Q(x)) -> ..." parses as ∀x.((P(x)→Q(x))→...) — NOT valid.
  //   Intended formula is (∀x.(P(x)→Q(x)))→(∀x.P(x)→∀x.Q(x)) but parser binds quantifier over everything. Quest formula bug.
  // { id: "sc-34", varName: "sc34LjUniversalImplDistrib", formula: "all x. (P(x) -> Q(x)) -> (all x. P(x) -> all x. Q(x))", isLJ: true },
];

// --- Main ---

function main(): void {
  let successCount = 0;
  let failCount = 0;

  for (const quest of quests) {
    const formula = parse(quest.formula);
    const initialSeq: Sequent = {
      antecedents: [],
      succedents: [formula],
    };

    console.log(`\n// --- ${quest.id}: ${quest.formula} ---`);
    console.log(`// System: ${quest.isLJ ? "LJ" : "LK"}`);

    const proof = searchProof(initialSeq, quest.isLJ);

    if (!proof) {
      console.log(`// ❌ FAILED: No proof found`);
      failCount++;
      continue;
    }

    const steps = flattenProof(proof);
    successCount++;

    console.log(`const ${quest.varName}: ModelAnswer = {`);
    console.log(`  questId: "${quest.id}",`);
    console.log(`  steps: [`);
    for (const step of steps) {
      if (step._tag === "sc-root") {
        console.log(
          `    { _tag: "sc-root", sequentText: "${step.sequentText}" },`,
        );
      } else {
        const parts = [
          `_tag: "sc-rule"`,
          `conclusionIndex: ${String(step.conclusionIndex)}`,
          `ruleId: "${step.ruleId}"`,
          `principalPosition: ${String(step.principalPosition)}`,
        ];
        if (step.exchangePosition !== undefined)
          parts.push(`exchangePosition: ${String(step.exchangePosition)}`);
        if (step.componentIndex !== undefined)
          parts.push(`componentIndex: ${String(step.componentIndex)}`);
        if (step.eigenVariable !== undefined)
          parts.push(`eigenVariable: "${step.eigenVariable}"`);
        if (step.termText !== undefined)
          parts.push(`termText: "${step.termText}"`);
        console.log(`    { ${parts.join(", ")} },`);
      }
    }
    console.log(`  ],`);
    console.log(`};`);
  }

  console.log(
    `\n// === Results: ${String(successCount)} success, ${String(failCount)} failed ===`,
  );
}

main();
