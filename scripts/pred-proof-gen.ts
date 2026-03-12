#!/usr/bin/env -S npx tsx
/**
 * Predicate logic proof generator for remaining pragmatic model answers.
 * Outputs TypeScript step arrays for builtinModelAnswers.ts.
 *
 * IMPORTANT: The goal formula matching is STRUCTURAL — the proof must produce
 * a step that exactly matches the goal AST. Use EX-DEF axiom steps to bridge
 * between ∃ and ¬∀¬ forms. ~~(all x. ~P(x)) ≠ ~(ex x. P(x)).
 */

type Step =
  | { readonly _tag: "axiom"; readonly formulaText: string }
  | { readonly _tag: "mp"; readonly leftIndex: number; readonly rightIndex: number }
  | { readonly _tag: "gen"; readonly premiseIndex: number; readonly variableName: string };

class ProofBuilder {
  readonly steps: Step[] = [];

  axiom(f: string): number {
    this.steps.push({ _tag: "axiom", formulaText: f });
    return this.steps.length - 1;
  }

  mp(left: number, right: number): number {
    this.steps.push({ _tag: "mp", leftIndex: left, rightIndex: right });
    return this.steps.length - 1;
  }

  gen(premise: number, varName: string): number {
    this.steps.push({ _tag: "gen", premiseIndex: premise, variableName: varName });
    return this.steps.length - 1;
  }

  /** Wrap formula in parens to prevent associativity issues */
  private p(s: string): string {
    return `(${s})`;
  }

  /** HS: from a→b and b→c, derive a→c (5 steps) */
  hs(ab: number, bc: number, a: string, b: string, c: string): number {
    const pa = this.p(a), pb = this.p(b), pc = this.p(c);
    const s1 = this.axiom(`(${pb} -> ${pc}) -> (${pa} -> (${pb} -> ${pc}))`);
    const s2 = this.mp(bc, s1);
    const s3 = this.axiom(`(${pa} -> (${pb} -> ${pc})) -> ((${pa} -> ${pb}) -> (${pa} -> ${pc}))`);
    const s4 = this.mp(s2, s3);
    return this.mp(ab, s4);
  }

  /** DNE: ~~phi → phi (35 steps) */
  dne(phi: string): number {
    const h = `~${phi} -> ${phi}`;
    const s0 = this.axiom(`~~${phi} -> (~${phi} -> ~~${phi})`);
    const s1 = this.axiom(`(~${phi} -> ~~${phi}) -> (~${phi} -> ${phi})`);
    const s2 = this.axiom(`(~~${phi} -> ((~${phi} -> ~~${phi}) -> (~${phi} -> ${phi}))) -> ((~~${phi} -> (~${phi} -> ~~${phi})) -> (~~${phi} -> (~${phi} -> ${phi})))`);
    const s3 = this.axiom(`((~${phi} -> ~~${phi}) -> (~${phi} -> ${phi})) -> (~~${phi} -> ((~${phi} -> ~~${phi}) -> (~${phi} -> ${phi})))`);
    const s4 = this.mp(s1, s3);
    const s5 = this.mp(s4, s2);
    const s6 = this.mp(s0, s5);
    const s7 = this.axiom(`(~~(${h}) -> ~${phi}) -> (${phi} -> ~(${h}))`);
    const s8 = this.axiom(`~${phi} -> (~~(${h}) -> ~${phi})`);
    const s9 = this.axiom(`(~${phi} -> ((~~(${h}) -> ~${phi}) -> (${phi} -> ~(${h})))) -> ((~${phi} -> (~~(${h}) -> ~${phi})) -> (~${phi} -> (${phi} -> ~(${h}))))`);
    const s10 = this.axiom(`((~~(${h}) -> ~${phi}) -> (${phi} -> ~(${h}))) -> (~${phi} -> ((~~(${h}) -> ~${phi}) -> (${phi} -> ~(${h}))))`);
    const s11 = this.mp(s7, s10);
    const s12 = this.mp(s11, s9);
    const s13 = this.mp(s8, s12);
    const s14 = this.axiom(`(~${phi} -> (${phi} -> ~(${h}))) -> ((${h}) -> (~${phi} -> ~(${h})))`);
    const s15 = this.mp(s13, s14);
    const s16 = this.axiom(`(~${phi} -> ~(${h})) -> ((${h}) -> ${phi})`);
    const s17 = this.axiom(`((${h}) -> ((~${phi} -> ~(${h})) -> ((${h}) -> ${phi}))) -> (((${h}) -> (~${phi} -> ~(${h}))) -> ((${h}) -> ((${h}) -> ${phi})))`);
    const s18 = this.axiom(`((~${phi} -> ~(${h})) -> ((${h}) -> ${phi})) -> ((${h}) -> ((~${phi} -> ~(${h})) -> ((${h}) -> ${phi})))`);
    const s19 = this.mp(s16, s18);
    const s20 = this.mp(s19, s17);
    const s21 = this.mp(s15, s20);
    const s22 = this.axiom(`((${h}) -> ((${h}) -> ${phi})) -> (((${h}) -> (${h})) -> ((${h}) -> ${phi}))`);
    const s23 = this.mp(s21, s22);
    const s24 = this.axiom(`((${h}) -> (((${h}) -> (${h})) -> (${h}))) -> (((${h}) -> ((${h}) -> (${h}))) -> ((${h}) -> (${h})))`);
    const s25 = this.axiom(`(${h}) -> (((${h}) -> (${h})) -> (${h}))`);
    const s26 = this.mp(s25, s24);
    const s27 = this.axiom(`(${h}) -> ((${h}) -> (${h}))`);
    const s28 = this.mp(s27, s26);
    const s29 = this.mp(s28, s23);
    const s30 = this.axiom(`(~~${phi} -> ((${h}) -> ${phi})) -> ((~~${phi} -> (${h})) -> (~~${phi} -> ${phi}))`);
    const s31 = this.axiom(`((${h}) -> ${phi}) -> (~~${phi} -> ((${h}) -> ${phi}))`);
    const s32 = this.mp(s29, s31);
    const s33 = this.mp(s32, s30);
    return this.mp(s6, s33);
  }

  /** DNI: phi → ~~phi (37 steps) */
  dni(phi: string): number {
    const tripleNeg = this.dne(`~${phi}`);
    const a3 = this.axiom(`(~~~${phi} -> ~${phi}) -> (${phi} -> ~~${phi})`);
    return this.mp(tripleNeg, a3);
  }

  /** MT: (phi→psi) → (~psi→~phi) (108 steps) */
  mt(phi: string, psi: string): number {
    const pphi = this.p(phi), ppsi = this.p(psi);
    const A = `${pphi} -> ${ppsi}`;
    const pA = this.p(A);
    const nnPhi = `~~${pphi}`;
    const nPhi = `~${pphi}`;
    const nPsi = `~${ppsi}`;
    const nnPsi = `~~${ppsi}`;

    const dneResult = this.dne(pphi);
    const lift1 = this.axiom(`${pA} -> (${nnPhi} -> ${pA})`);
    const a2_1 = this.axiom(`(${nnPhi} -> ${pA}) -> ((${nnPhi} -> ${pphi}) -> (${nnPhi} -> ${ppsi}))`);
    const bComb = this.hs(lift1, a2_1, A, `${nnPhi} -> ${pA}`, `(${nnPhi} -> ${pphi}) -> (${nnPhi} -> ${ppsi})`);
    const liftDne = this.axiom(`(${nnPhi} -> ${pphi}) -> (${pA} -> (${nnPhi} -> ${pphi}))`);
    const dneInA = this.mp(dneResult, liftDne);
    const a2_2 = this.axiom(`(${pA} -> ((${nnPhi} -> ${pphi}) -> (${nnPhi} -> ${ppsi}))) -> ((${pA} -> (${nnPhi} -> ${pphi})) -> (${pA} -> (${nnPhi} -> ${ppsi})))`);
    const bComb2 = this.mp(bComb, a2_2);
    const aToNnPhiToPsi = this.mp(dneInA, bComb2);

    const dniResult = this.dni(ppsi);
    const b1 = this.axiom(`(${ppsi} -> ${nnPsi}) -> (${nnPhi} -> (${ppsi} -> ${nnPsi}))`);
    const b2 = this.mp(dniResult, b1);
    const b3 = this.axiom(`(${nnPhi} -> (${ppsi} -> ${nnPsi})) -> ((${nnPhi} -> ${ppsi}) -> (${nnPhi} -> ${nnPsi}))`);
    const b4 = this.mp(b2, b3);
    const aToNnPhiToNnPsi = this.hs(aToNnPhiToPsi, b4, A, `${nnPhi} -> ${ppsi}`, `${nnPhi} -> ${nnPsi}`);

    const a3inst = this.axiom(`(${nnPhi} -> ${nnPsi}) -> (${nPsi} -> ${nPhi})`);
    return this.hs(aToNnPhiToNnPsi, a3inst, A, `${nnPhi} -> ${nnPsi}`, `${nPsi} -> ${nPhi}`);
  }

  /** distForall: ∀v.(φ→ψ) → ((∀v.φ)→(∀v.ψ)) */
  distForall(phiBody: string, psiBody: string, varName: string): number {
    const allPhiPsi = `all ${varName}. (${phiBody} -> ${psiBody})`;
    const allPhi = `all ${varName}. ${phiBody}`;
    const allPsi = `all ${varName}. ${psiBody}`;
    const phiImpl = `${phiBody} -> ${psiBody}`;

    const s0 = this.axiom(`(${allPhiPsi}) -> (${phiImpl})`);
    const s1 = this.axiom(`(${allPhi}) -> ${phiBody}`);
    const s2 = this.axiom(`(${phiImpl}) -> ((${allPhi}) -> (${phiImpl}))`);
    const s7 = this.hs(s0, s2, allPhiPsi, phiImpl, `(${allPhi}) -> (${phiImpl})`);
    const s8 = this.axiom(`((${allPhi}) -> (${phiImpl})) -> (((${allPhi}) -> ${phiBody}) -> ((${allPhi}) -> ${psiBody}))`);
    const s13 = this.hs(s7, s8, allPhiPsi, `(${allPhi}) -> (${phiImpl})`,
      `((${allPhi}) -> ${phiBody}) -> ((${allPhi}) -> ${psiBody})`);
    const s14 = this.axiom(`((${allPhi}) -> ${phiBody}) -> ((${allPhiPsi}) -> ((${allPhi}) -> ${phiBody}))`);
    const s15 = this.mp(s1, s14);
    const s16 = this.axiom(`((${allPhiPsi}) -> (((${allPhi}) -> ${phiBody}) -> ((${allPhi}) -> ${psiBody}))) -> (((${allPhiPsi}) -> ((${allPhi}) -> ${phiBody})) -> ((${allPhiPsi}) -> ((${allPhi}) -> ${psiBody})))`);
    const s17 = this.mp(s13, s16);
    const s18 = this.mp(s15, s17);
    const s19 = this.gen(s18, varName);
    const s20 = this.axiom(`(all ${varName}. ((${allPhiPsi}) -> ((${allPhi}) -> ${psiBody}))) -> ((${allPhiPsi}) -> (all ${varName}. ((${allPhi}) -> ${psiBody})))`);
    const s21 = this.mp(s19, s20);
    const s22 = this.axiom(`(all ${varName}. ((${allPhi}) -> ${psiBody})) -> ((${allPhi}) -> (${allPsi}))`);
    return this.hs(s21, s22, allPhiPsi,
      `all ${varName}. ((${allPhi}) -> ${psiBody})`,
      `(${allPhi}) -> (${allPsi})`);
  }

  emitTS(): string {
    const lines = this.steps.map((s, i) => {
      if (s._tag === "axiom") {
        const ft = JSON.stringify(s.formulaText);
        if (ft.length > 80) {
          return `    // Step ${i}\n    {\n      _tag: "axiom",\n      formulaText:\n        ${ft},\n    },`;
        }
        return `    // Step ${i}\n    { _tag: "axiom", formulaText: ${ft} },`;
      } else if (s._tag === "mp") {
        return `    // Step ${i}\n    { _tag: "mp", leftIndex: ${s.leftIndex}, rightIndex: ${s.rightIndex} },`;
      } else {
        return `    // Step ${i}\n    { _tag: "gen", premiseIndex: ${s.premiseIndex}, variableName: ${JSON.stringify(s.variableName)} },`;
      }
    });
    return `[\n${lines.join("\n")}\n  ]`;
  }
}

// =============================================
// Quest generators — using EX-DEF bridges
// =============================================

/**
 * pred-adv-02: ~(ex x. P(x)) → (all x. ~P(x))
 *
 * A3[alpha=(all x. ~P(x)), beta=~(ex x. P(x))]:
 *   (~(all x. ~P(x)) → ~~(ex x. P(x))) → (~(ex x. P(x)) → (all x. ~P(x)))
 * Antecedent: ~(all x. ~P(x)) → ~~(ex x. P(x))
 *   = EX-DEF bwd: ~(all x. ~P(x)) → (ex x. P(x))  [axiom]
 *   + DNI[(ex x. P(x))]: (ex x. P(x)) → ~~(ex x. P(x))  [37 steps]
 *   + HS  [5 steps]
 * Total: 1 + 37 + 5 + 1 + 1 = 45 steps
 */
function genPredAdv02(): ProofBuilder {
  const b = new ProofBuilder();
  const exDef = b.axiom("~(all x. ~P(x)) -> (ex x. P(x))"); // EX-DEF bwd
  const dniEx = b.dni("(ex x. P(x))"); // (ex x. P(x)) → ~~(ex x. P(x))
  const hsResult = b.hs(exDef, dniEx,
    "~(all x. ~P(x))", "(ex x. P(x))", "~~(ex x. P(x))");
  const a3 = b.axiom("(~(all x. ~P(x)) -> ~~(ex x. P(x))) -> (~(ex x. P(x)) -> (all x. ~P(x)))");
  b.mp(hsResult, a3);
  return b;
}

/**
 * pred-06: (all x. ~P(x)) → ~(ex x. P(x))
 *
 * A3[alpha=~(ex x. P(x)), beta=(all x. ~P(x))]:
 *   (~~(ex x. P(x)) → ~(all x. ~P(x))) → ((all x. ~P(x)) → ~(ex x. P(x)))
 * Antecedent: ~~(ex x. P(x)) → ~(all x. ~P(x))
 *   = DNE[(ex x. P(x))]: ~~(ex x. P(x)) → (ex x. P(x))  [35 steps]
 *   + EX-DEF fwd: (ex x. P(x)) → ~(all x. ~P(x))  [axiom]
 *   + HS  [5 steps]
 * Total: 35 + 1 + 5 + 1 + 1 = 43 steps
 */
function genPred06(): ProofBuilder {
  const b = new ProofBuilder();
  const dneEx = b.dne("(ex x. P(x))"); // ~~(ex x. P(x)) → (ex x. P(x))
  const exDef = b.axiom("(ex x. P(x)) -> ~(all x. ~P(x))"); // EX-DEF fwd
  const hsResult = b.hs(dneEx, exDef,
    "~~(ex x. P(x))", "(ex x. P(x))", "~(all x. ~P(x))");
  const a3 = b.axiom("(~~(ex x. P(x)) -> ~(all x. ~P(x))) -> ((all x. ~P(x)) -> ~(ex x. P(x)))");
  b.mp(hsResult, a3);
  return b;
}

/**
 * pred-04: P(x) → ex x. P(x)
 *
 * A3[alpha=~(all x. ~P(x)), beta=P(x)]:
 *   (~~(all x. ~P(x)) → ~P(x)) → (P(x) → ~(all x. ~P(x)))
 * This gives P(x) → ~(all x. ~P(x)), NOT P(x) → (ex x. P(x)).
 *
 * So we also need EX-DEF bwd: ~(all x. ~P(x)) → (ex x. P(x))
 * Then HS: P(x) → (ex x. P(x))
 *
 * Antecedent: ~~(all x. ~P(x)) → ~P(x)
 *   = DNE[(all x. ~P(x))]: ~~(all x. ~P(x)) → (all x. ~P(x))  [35 steps]
 *   + A4: (all x. ~P(x)) → ~P(x)  [1 step]
 *   + HS  [5 steps]
 * Then A3 + MP → P(x) → ~(all x. ~P(x))
 * Then EX-DEF bwd + HS → P(x) → (ex x. P(x))
 *
 * Total: 35 + 1 + 5 + 1 + 1 + 1 + 5 = 49 steps
 */
function genPred04(): ProofBuilder {
  const b = new ProofBuilder();
  const dneResult = b.dne("(all x. ~P(x))");
  const a4 = b.axiom("(all x. ~P(x)) -> ~P(x)");
  const hs1 = b.hs(dneResult, a4, "~~(all x. ~P(x))", "(all x. ~P(x))", "~P(x)");
  const a3 = b.axiom("(~~(all x. ~P(x)) -> ~P(x)) -> (P(x) -> ~(all x. ~P(x)))");
  const pToNotAll = b.mp(hs1, a3); // P(x) → ~(all x. ~P(x))
  const exDef = b.axiom("~(all x. ~P(x)) -> (ex x. P(x))"); // EX-DEF bwd
  b.hs(pToNotAll, exDef, "P(x)", "~(all x. ~P(x))", "ex x. P(x)");
  return b;
}

/**
 * pred-adv-06: (all x. P(x)) → (ex x. P(x))
 *
 * A4 + pred-04 inline + HS.
 */
function genPredAdv06(): ProofBuilder {
  const b = new ProofBuilder();
  // pred-04 inline: P(x) → (ex x. P(x))
  const dneResult = b.dne("(all x. ~P(x))");
  const a4_inner = b.axiom("(all x. ~P(x)) -> ~P(x)");
  const hs1 = b.hs(dneResult, a4_inner, "~~(all x. ~P(x))", "(all x. ~P(x))", "~P(x)");
  const a3 = b.axiom("(~~(all x. ~P(x)) -> ~P(x)) -> (P(x) -> ~(all x. ~P(x)))");
  const pToNotAll = b.mp(hs1, a3);
  const exDef = b.axiom("~(all x. ~P(x)) -> (ex x. P(x))");
  const pred04 = b.hs(pToNotAll, exDef, "P(x)", "~(all x. ~P(x))", "ex x. P(x)");
  // A4
  const a4_outer = b.axiom("(all x. P(x)) -> P(x)");
  // HS
  b.hs(a4_outer, pred04, "(all x. P(x))", "P(x)", "ex x. P(x)");
  return b;
}

/**
 * pred-adv-08: (all x. P(x)) → ~(ex x. ~P(x))
 *
 * Strategy using EX-DEF:
 * 1. DNI[P(x)]: P(x) → ~~P(x) (37 steps)
 * 2. A4: (all x. P(x)) → P(x)
 * 3. HS: (all x. P(x)) → ~~P(x)
 * 4. Gen[x] + A5: (all x. P(x)) → (all x. ~~P(x))
 * 5. A3[~(ex x. ~P(x)), (all x. ~~P(x))]:
 *    (~~(ex x. ~P(x)) → ~(all x. ~~P(x))) → ((all x. ~~P(x)) → ~(ex x. ~P(x)))
 *    Antecedent: ~~(ex x. ~P(x)) → ~(all x. ~~P(x))
 *      = DNE[(ex x. ~P(x))]: ~~(ex x. ~P(x)) → (ex x. ~P(x))
 *      + EX-DEF fwd: (ex x. ~P(x)) → ~(all x. ~~P(x))
 *      + HS
 * 6. A3 + MP: (all x. ~~P(x)) → ~(ex x. ~P(x))
 * 7. HS: (all x. P(x)) → ~(ex x. ~P(x))
 */
function genPredAdv08(): ProofBuilder {
  const b = new ProofBuilder();

  // Phase 1: (all x. P(x)) → (all x. ~~P(x))
  const dniPx = b.dni("P(x)");
  const a4 = b.axiom("(all x. P(x)) -> P(x)");
  const hs1 = b.hs(a4, dniPx, "(all x. P(x))", "P(x)", "~~P(x)");
  const gen1 = b.gen(hs1, "x");
  const a5 = b.axiom("(all x. ((all x. P(x)) -> ~~P(x))) -> ((all x. P(x)) -> (all x. ~~P(x)))");
  const allPToAllNNP = b.mp(gen1, a5);

  // Phase 2: (all x. ~~P(x)) → ~(ex x. ~P(x))
  const dneEx = b.dne("(ex x. ~P(x))"); // ~~(ex x. ~P(x)) → (ex x. ~P(x))
  const exDefFwd = b.axiom("(ex x. ~P(x)) -> ~(all x. ~~P(x))"); // EX-DEF fwd
  const hsExDne = b.hs(dneEx, exDefFwd,
    "~~(ex x. ~P(x))", "(ex x. ~P(x))", "~(all x. ~~P(x))");
  const a3 = b.axiom("(~~(ex x. ~P(x)) -> ~(all x. ~~P(x))) -> ((all x. ~~P(x)) -> ~(ex x. ~P(x)))");
  const allNNPToNotExNot = b.mp(hsExDne, a3);

  // Phase 3: compose
  b.hs(allPToAllNNP, allNNPToNotExNot,
    "(all x. P(x))", "(all x. ~~P(x))", "~(ex x. ~P(x))");
  return b;
}

/**
 * pred-adv-13: (all x. (P(x)→Q(x))) → (all x. (~Q(x)→~P(x)))
 *
 * No ∃ involved, so no EX-DEF needed. Standard MT + Gen + A5.
 */
function genPredAdv13(): ProofBuilder {
  const b = new ProofBuilder();
  const a4 = b.axiom("(all x. (P(x) -> Q(x))) -> (P(x) -> Q(x))");
  const mtResult = b.mt("P(x)", "Q(x)");
  const hs1 = b.hs(a4, mtResult,
    "(all x. (P(x) -> Q(x)))", "P(x) -> Q(x)", "~Q(x) -> ~P(x)");
  const gen1 = b.gen(hs1, "x");
  const a5 = b.axiom("(all x. ((all x. (P(x) -> Q(x))) -> (~Q(x) -> ~P(x)))) -> ((all x. (P(x) -> Q(x))) -> (all x. (~Q(x) -> ~P(x))))");
  b.mp(gen1, a5);
  return b;
}

/**
 * pred-05: (ex x. ~P(x)) → ~(all x. P(x))
 *
 * EX-DEF fwd: (ex x. ~P(x)) → ~(all x. ~~P(x))
 * We need: ~(all x. ~~P(x)) → ~(all x. P(x))
 * This follows from: (all x. P(x)) → (all x. ~~P(x)) via MT pattern.
 * But instead of full MT, use A3:
 * A3[~(all x. P(x)), ~(all x. ~~P(x))]:
 *   (~~(all x. P(x)) → ~~(all x. ~~P(x))) → (~(all x. ~~P(x)) → ~(all x. P(x)))
 *
 * Antecedent: ~~(all x. P(x)) → ~~(all x. ~~P(x))
 *   = DNE[(all x. P(x))]: ~~(all x. P(x)) → (all x. P(x))  [35 steps]
 *   + forward: (all x. P(x)) → (all x. ~~P(x))  [DNI + Gen + A5]
 *   + DNI[(all x. ~~P(x))]: (all x. ~~P(x)) → ~~(all x. ~~P(x))  [37 steps]
 *   + HS compositions
 *
 * Then: A3 + MP → ~(all x. ~~P(x)) → ~(all x. P(x))
 * Then: HS with EX-DEF fwd → (ex x. ~P(x)) → ~(all x. P(x))
 *
 * Actually this approach is still complex. Let me use MT directly on
 * (all x. P(x)) → (all x. ~~P(x)).
 *
 * Build (all x. P(x)) → (all x. ~~P(x)) using DNI+Gen+A5, then MT, then HS with EX-DEF.
 */
function genPred05(): ProofBuilder {
  const b = new ProofBuilder();

  // Phase 1: (all x. P(x)) → (all x. ~~P(x)) via DNI + A4 + Gen + A5
  const dniPx = b.dni("P(x)"); // P(x) → ~~P(x)
  const a4 = b.axiom("(all x. P(x)) -> P(x)");
  const hs1 = b.hs(a4, dniPx, "(all x. P(x))", "P(x)", "~~P(x)");
  const gen1 = b.gen(hs1, "x");
  const a5 = b.axiom("(all x. ((all x. P(x)) -> ~~P(x))) -> ((all x. P(x)) -> (all x. ~~P(x)))");
  const fwdStep = b.mp(gen1, a5); // (all x. P(x)) → (all x. ~~P(x))

  // Phase 2: MT[(all x. P(x)), (all x. ~~P(x))]
  const mtResult = b.mt("(all x. P(x))", "(all x. ~~P(x))");
  const mtApplied = b.mp(fwdStep, mtResult); // ~(all x. ~~P(x)) → ~(all x. P(x))

  // Phase 3: EX-DEF fwd: (ex x. ~P(x)) → ~(all x. ~~P(x))
  const exDefFwd = b.axiom("(ex x. ~P(x)) -> ~(all x. ~~P(x))");

  // Phase 4: HS
  b.hs(exDefFwd, mtApplied,
    "(ex x. ~P(x))", "~(all x. ~~P(x))", "~(all x. P(x))");
  return b;
}

/**
 * pred-adv-03: ~(all x. P(x)) → ex x. ~P(x)
 *
 * Strategy:
 * (all x. ~~P(x)) → (all x. P(x)) via DNE + Gen + distForall
 * Then MT: ~(all x. P(x)) → ~(all x. ~~P(x))
 * Then EX-DEF bwd: ~(all x. ~~P(x)) → (ex x. ~P(x))
 * HS: ~(all x. P(x)) → (ex x. ~P(x))
 */
function genPredAdv03(): ProofBuilder {
  const b = new ProofBuilder();

  // Phase 1: (all x. ~~P(x)) → (all x. P(x))
  const dnePx = b.dne("P(x)"); // ~~P(x) → P(x)
  const gen1 = b.gen(dnePx, "x");
  const dist = b.distForall("~~P(x)", "P(x)", "x");
  const fwd = b.mp(gen1, dist); // (all x. ~~P(x)) → (all x. P(x))

  // Phase 2: MT
  const mtResult = b.mt("(all x. ~~P(x))", "(all x. P(x))");
  const mtApplied = b.mp(fwd, mtResult); // ~(all x. P(x)) → ~(all x. ~~P(x))

  // Phase 3: EX-DEF bwd: ~(all x. ~~P(x)) → (ex x. ~P(x))
  const exDefBwd = b.axiom("~(all x. ~~P(x)) -> (ex x. ~P(x))");

  // Phase 4: HS
  b.hs(mtApplied, exDefBwd,
    "~(all x. P(x))", "~(all x. ~~P(x))", "ex x. ~P(x)");
  return b;
}

/**
 * pred-adv-04: (all x. (P(x)→Q(x))) → ((ex x. P(x)) → (ex x. Q(x)))
 *
 * Strategy:
 * 1. MT[P(x),Q(x)]: (P(x)→Q(x)) → (~Q(x)→~P(x))
 * 2. A4 + HS: allPQ → (~Q(x)→~P(x))
 * 3. Gen+A5: allPQ → ∀x.(~Q(x)→~P(x))
 * 4. distForall: ∀x.(~Q(x)→~P(x)) → ((all x. ~Q(x)) → (all x. ~P(x)))
 * 5. HS: allPQ → ((all x. ~Q(x)) → (all x. ~P(x)))
 * 6. Now use A3 + EX-DEF bridges to flip:
 *    From (all x. ~Q(x)) → (all x. ~P(x)),
 *    we need ~(all x. ~P(x)) → ~(all x. ~Q(x)),
 *    which is MT[(all x. ~Q(x)), (all x. ~P(x))]
 * 7. Then EX-DEF bwd: ~(all x. ~P(x)) → (ex x. P(x)) and ~(all x. ~Q(x)) → (ex x. Q(x))
 *    But we need (ex x. P(x)) → (ex x. Q(x)), so:
 *    EX-DEF fwd: (ex x. P(x)) → ~(all x. ~P(x))
 *    Our MT result: ~(all x. ~P(x)) → ~(all x. ~Q(x))  [wait, this is wrong direction]
 *
 * Let me reconsider. We have allPQ → ((all x. ~Q(x)) → (all x. ~P(x))).
 * MT on inner: ((all x. ~Q(x)) → (all x. ~P(x))) → (~(all x. ~P(x)) → ~(all x. ~Q(x)))
 * So: allPQ → (~(all x. ~P(x)) → ~(all x. ~Q(x)))
 *
 * Now: EX-DEF fwd: (ex x. P(x)) → ~(all x. ~P(x))
 *      EX-DEF bwd: ~(all x. ~Q(x)) → (ex x. Q(x))
 *
 * We can bridge:
 * (ex x. P(x)) → ~(all x. ~P(x)) → ~(all x. ~Q(x)) → (ex x. Q(x))
 *
 * So the inner chain is: (ex x. P(x)) → (ex x. Q(x)) via 3 HS steps.
 * And the outer allPQ → ... wraps it all.
 */
function genPredAdv04(): ProofBuilder {
  const b = new ProofBuilder();
  const allPQ = "(all x. (P(x) -> Q(x)))";

  // Phase 1: allPQ → ((all x. ~Q(x)) → (all x. ~P(x)))
  const a4 = b.axiom(`${allPQ} -> (P(x) -> Q(x))`);
  const mtElem = b.mt("P(x)", "Q(x)");
  const hs1 = b.hs(a4, mtElem, allPQ, "P(x) -> Q(x)", "~Q(x) -> ~P(x)");
  const gen1 = b.gen(hs1, "x");
  const a5 = b.axiom(`(all x. (${allPQ} -> (~Q(x) -> ~P(x)))) -> (${allPQ} -> (all x. (~Q(x) -> ~P(x))))`);
  const step4 = b.mp(gen1, a5);
  const dist = b.distForall("~Q(x)", "~P(x)", "x");
  const allPQToInner = b.hs(step4, dist, allPQ,
    "all x. (~Q(x) -> ~P(x))",
    "(all x. ~Q(x)) -> (all x. ~P(x))");

  // Phase 2: MT[(all x. ~Q(x)), (all x. ~P(x))]
  const mtOuter = b.mt("(all x. ~Q(x))", "(all x. ~P(x))");

  // Phase 3: allPQ → (~(all x. ~P(x)) → ~(all x. ~Q(x)))
  const allPQToNeg = b.hs(allPQToInner, mtOuter, allPQ,
    "(all x. ~Q(x)) -> (all x. ~P(x))",
    "~(all x. ~P(x)) -> ~(all x. ~Q(x))");

  // Phase 4: Bridge with EX-DEF
  // EX-DEF fwd: (ex x. P(x)) → ~(all x. ~P(x))
  const exDefP = b.axiom("(ex x. P(x)) -> ~(all x. ~P(x))");
  // EX-DEF bwd: ~(all x. ~Q(x)) → (ex x. Q(x))
  const exDefQ = b.axiom("~(all x. ~Q(x)) -> (ex x. Q(x))");

  // Phase 5: Build allPQ → ((ex x. P(x)) → (ex x. Q(x)))
  // We have allPQ → (~(all x. ~P(x)) → ~(all x. ~Q(x)))
  // We need allPQ → ((ex x. P(x)) → (ex x. Q(x)))
  // From exDefP and the inner chain and exDefQ, compose:

  // Step A: ~(all x. ~Q(x)) → (ex x. Q(x)) [exDefQ]
  // HS: allPQ → (~(all x. ~P(x)) → (ex x. Q(x)))
  // Need to compose inside allPQ context.
  // We have allPQ → (A → B) where A = ~(all x. ~P(x)), B = ~(all x. ~Q(x))
  // And B → C where C = (ex x. Q(x))
  // We want allPQ → (A → C)
  // Lift B→C: A1[(B→C), allPQ]: (B→C) → (allPQ → (B→C))
  // MP: allPQ → (B→C)
  // But we need inside A context. Hmm.

  // Actually: we have allPQ → (A → B). And B → C.
  // From (A→B) and (B→C), HS gives A→C.
  // So HS(allPQToNeg, exDefQ) inside allPQ context:
  // allPQ → (A → B), and B → C.
  // lift B→C over allPQ: A1
  const liftExDefQ = b.axiom(`(~(all x. ~Q(x)) -> (ex x. Q(x))) -> (${allPQ} -> (~(all x. ~Q(x)) -> (ex x. Q(x))))`);
  const allPQExDefQ = b.mp(exDefQ, liftExDefQ); // allPQ → (B → C)
  // A2[allPQ, A→B, B→C → ... ]: need allPQ → (A → C)
  // From allPQ → (A → B) and allPQ → (B → C):
  // We need to do HS inside the allPQ context.
  // B→C lifted into A: A1[(B→C), A]: (B→C) → (A→(B→C))
  // So allPQ → (B→C) → allPQ → (A→(B→C)) via A1 composition
  // Then A2[A, B, C]: (A→(B→C)) → ((A→B)→(A→C))
  // allPQ → ((A→B)→(A→C)) via HS
  // Then MP with allPQ → (A→B): allPQ → (A→C)

  const A_inner = "~(all x. ~P(x))";
  const B_inner = "~(all x. ~Q(x))";
  const C_inner = "(ex x. Q(x))";

  // Lift B→C into A context: A1
  const a1Lift = b.axiom(`(${B_inner} -> ${C_inner}) -> (${A_inner} -> (${B_inner} -> ${C_inner}))`);
  // HS(allPQExDefQ, a1Lift): allPQ → (A → (B → C))
  const allPQA_BC = b.hs(allPQExDefQ, a1Lift, allPQ,
    `${B_inner} -> ${C_inner}`,
    `${A_inner} -> (${B_inner} -> ${C_inner})`);
  // A2[A, B, C]: (A→(B→C)) → ((A→B)→(A→C))
  const a2inst = b.axiom(`(${A_inner} -> (${B_inner} -> ${C_inner})) -> ((${A_inner} -> ${B_inner}) -> (${A_inner} -> ${C_inner}))`);
  // HS(allPQA_BC, a2inst): allPQ → ((A→B)→(A→C))
  const allPQAB_AC = b.hs(allPQA_BC, a2inst, allPQ,
    `${A_inner} -> (${B_inner} -> ${C_inner})`,
    `(${A_inner} -> ${B_inner}) -> (${A_inner} -> ${C_inner})`);
  // A2[allPQ, A→B, A→C]: ... → (allPQ→(A→B)) → (allPQ→(A→C))
  const a2outer = b.axiom(`(${allPQ} -> ((${A_inner} -> ${B_inner}) -> (${A_inner} -> ${C_inner}))) -> ((${allPQ} -> (${A_inner} -> ${B_inner})) -> (${allPQ} -> (${A_inner} -> ${C_inner})))`);
  const step_ab_ac = b.mp(allPQAB_AC, a2outer);
  const allPQ_A_C = b.mp(allPQToNeg, step_ab_ac); // allPQ → (A → C) = allPQ → (~(all x. ~P(x)) → (ex x. Q(x)))

  // Phase 6: Bridge with EX-DEF fwd: (ex x. P(x)) → ~(all x. ~P(x))
  // We have allPQ → (~(all x. ~P(x)) → (ex x. Q(x)))
  // We want allPQ → ((ex x. P(x)) → (ex x. Q(x)))
  // Compose exDefP before ~(all x. ~P(x)):
  // exDefP: (ex x. P(x)) → ~(all x. ~P(x))
  // Lift exDefP over allPQ context:
  const liftExDefP = b.axiom(`((ex x. P(x)) -> ~(all x. ~P(x))) -> (${allPQ} -> ((ex x. P(x)) -> ~(all x. ~P(x))))`);
  const allPQExDefP = b.mp(exDefP, liftExDefP); // allPQ → (exP → A)

  // Now compose allPQ → (exP → A) with allPQ → (A → exQ)
  // A2[allPQ, exP→A, A→exQ]: ... → ((allPQ→(exP→A))→(allPQ→...))
  // Hmm, this needs a different approach. We need allPQ → (exP → exQ).
  // From allPQ → (exP → A) and allPQ → (A → exQ):
  // Need allPQ → (exP → exQ) via HS in allPQ context.

  const exP = "(ex x. P(x))";
  const exQ = "(ex x. Q(x))";

  // Lift (A → exQ) into exP context inside allPQ:
  // A1[(A→exQ), exP]: (A→exQ) → (exP → (A→exQ))
  const a1Lift2 = b.axiom(`(${A_inner} -> ${exQ}) -> (${exP} -> (${A_inner} -> ${exQ}))`);
  // HS(allPQ_A_C, a1Lift2): allPQ → (exP → (A→exQ))
  const allPQ_exP_A_exQ = b.hs(allPQ_A_C, a1Lift2, allPQ,
    `${A_inner} -> ${exQ}`,
    `${exP} -> (${A_inner} -> ${exQ})`);
  // A2[exP, A, exQ]: (exP→(A→exQ)) → ((exP→A)→(exP→exQ))
  const a2inst2 = b.axiom(`(${exP} -> (${A_inner} -> ${exQ})) -> ((${exP} -> ${A_inner}) -> (${exP} -> ${exQ}))`);
  // HS: allPQ → ((exP→A) → (exP→exQ))
  const allPQ_exPA_exPexQ = b.hs(allPQ_exP_A_exQ, a2inst2, allPQ,
    `${exP} -> (${A_inner} -> ${exQ})`,
    `(${exP} -> ${A_inner}) -> (${exP} -> ${exQ})`);
  // A2[allPQ, exP→A, exP→exQ]
  const a2final = b.axiom(`(${allPQ} -> ((${exP} -> ${A_inner}) -> (${exP} -> ${exQ}))) -> ((${allPQ} -> (${exP} -> ${A_inner})) -> (${allPQ} -> (${exP} -> ${exQ})))`);
  const step_final_a = b.mp(allPQ_exPA_exPexQ, a2final);
  b.mp(allPQExDefP, step_final_a); // allPQ → (exP → exQ)

  return b;
}

/**
 * pred-adv-12: (ex x. (ex y. P(x, y))) → (ex y. (ex x. P(x, y)))
 *
 * Strategy with EX-DEF bridges:
 * Work in ~all~ domain internally, bridge with EX-DEF at boundaries.
 *
 * Core: (all y. (all x. ~P(x,y))) → (all x. (all y. ~P(x,y))) [forall swap on ~P]
 * Then MT: ~(all x. (all y. ~P(x,y))) → ~(all y. (all x. ~P(x,y)))
 *
 * Bridge in:
 *   (ex x. (ex y. P(x,y)))
 *   → ~(all x. ~(ex y. P(x,y)))  [EX-DEF fwd outer]
 *   → ~(all x. ~~(all y. ~P(x,y)))  ... hmm, ~(ex y. P(x,y)) ≠ ~~(all y. ~P(x,y))
 *
 * The problem: ~(ex y. P(x,y)) is NOT ~~(all y. ~P(x,y)).
 * ~(ex y. P(x,y)) is a negation of an existential.
 *
 * We'd need to show ~(ex y. P(x,y)) = ~~(all y. ~P(x,y)) which requires
 * MT on EX-DEF bwd, giving ~(ex y. P(x,y)) → ~~(all y. ~P(x,y)).
 * But that's only one direction. We also need ~~(all y. ~P(x,y)) → ~(ex y. P(x,y)).
 * That comes from MT on EX-DEF fwd.
 *
 * Alternatively, use the double-negation form throughout:
 * We need: (ex x. (ex y. P(x,y))) → (ex y. (ex x. P(x,y)))
 *
 * A simpler approach using nested EX-DEF + forall swap:
 * 1. For the forward direction, show:
 *    (all y. (all x. ~P(x,y))) → (all x. (all y. ~P(x,y)))  [forall swap, 13 steps]
 * 2. MT on forall swap: ~(all x. (all y. ~P(x,y))) → ~(all y. (all x. ~P(x,y)))
 * 3. Outer EX-DEF:
 *    EX-DEF fwd: (ex x. F(x)) → ~(all x. ~F(x))
 *    where F(x) = (ex y. P(x,y))
 *    gives: (ex x. (ex y. P(x,y))) → ~(all x. ~(ex y. P(x,y)))
 *
 * But ~(all x. ~(ex y. P(x,y))) ≠ ~(all x. (all y. ~P(x,y)))
 * The left has ~(ex y. P(x,y)) inside, the right has (all y. ~P(x,y)).
 *
 * We need to bridge ~(ex y. P(x,y)) with (all y. ~P(x,y)).
 * pred-adv-02 gives: ~(ex y. P(x,y)) → (all y. ~P(x,y))
 * But we actually proved this already! It's one of our quests.
 * And pred-06 gives: (all y. ~P(x,y)) → ~(ex y. P(x,y))
 *
 * So we can convert between the two using pred-adv-02 and pred-06 patterns.
 *
 * Full plan:
 * a) pred-06 pattern for inner: (all y. ~P(x,y)) → ~(ex y. P(x,y))
 *    Use A3 + DNE + EX-DEF: 43 steps
 * b) pred-adv-02 pattern for inner: ~(ex y. P(x,y)) → (all y. ~P(x,y))
 *    Use A3 + DNI + EX-DEF: 45 steps
 *
 * Actually, this is getting extremely complex. Let me think about whether
 * we can avoid nesting.
 *
 * Wait — there might be a much simpler approach:
 * Instead of working with ∀∀ and flipping, work with individual EX-DEF steps.
 *
 * The idea:
 * 1. pred-04[y]: P(x,y) → (ex y. P(x,y))  [49 steps with EX-DEF bwd]
 * 2. pred-04[x]: (ex y. P(x,y)) → (ex x. (ex y. P(x,y)))... hmm,
 *    pred-04 gives φ → (ex v. φ) where φ doesn't reference v freely?
 *    No, pred-04 is P(x) → ex x. P(x), where x IS free in P(x).
 *
 * Actually: pred-04 gives: F(v) → (ex v. F(v)) for any F containing v.
 *
 * So:
 * pred-04[y]: P(x,y) → (ex y. P(x,y))
 * pred-04[x]: P(x,y) → (ex x. P(x,y))
 *
 * From P(x,y), we can derive both (ex y. P(x,y)) and (ex x. P(x,y)).
 * But we can't "extract" P(x,y) from (ex x. (ex y. P(x,y))).
 *
 * In Hilbert systems, there's no elimination rule for ∃.
 * We have to work through ¬∀¬ and contrapositive reasoning.
 *
 * OK let me just use the straightforward but long approach:
 * Core proof:
 * 1. forall swap: (all y. (all x. ~P(x,y))) → (all x. (all y. ~P(x,y)))  [13 steps]
 * 2. MT: ~(all x. (all y. ~P(x,y))) → ~(all y. (all x. ~P(x,y)))  [108 steps]
 * 3. pred-adv-02 pattern inner (y): ~(ex y. P(x,y)) → (all y. ~P(x,y))
 *    Gen[x] + A5 gives: ∀x.(~(ex y. P(x,y)) → (all y. ~P(x,y)))
 *    distForall: (all x. ~(ex y. P(x,y))) → (all x. (all y. ~P(x,y)))
 *    Wait, that's not quite right because we need forall distributing over the implication.
 *
 * This is getting very deeply nested. Given the extreme complexity of pred-adv-12,
 * let me use a slightly different approach.
 *
 * ALTERNATIVE: Use the ¬∀¬ form throughout and bridge only at the outer boundaries.
 *
 * EX-DEF fwd (outer): (ex x. (ex y. P(x,y))) → ~(all x. ~(ex y. P(x,y)))
 * We need to convert the inner: ~(all x. ~(ex y. P(x,y))) → ~(all y. ~(ex x. P(x,y)))
 * Then EX-DEF bwd (outer): ~(all y. ~(ex x. P(x,y))) → (ex y. (ex x. P(x,y)))
 *
 * For the middle part, we need:
 * (all y. ~(ex x. P(x,y))) → (all x. ~(ex y. P(x,y)))
 * Then MT gives the flip.
 *
 * To prove (all y. ~(ex x. P(x,y))) → (all x. ~(ex y. P(x,y))):
 * This requires: ~(ex x. P(x,y)) → ... work with individual terms ...
 *
 * Hmm. Actually, the crucial step is showing that from ~(ex y. P(x,y)) for all x,
 * we can derive ~(ex x. P(x,y)) for all y. This goes through all-swap on ~P.
 *
 * Let me try this clean structure:
 * Lemma: ~(ex v. F(v)) ↔ (all v. ~F(v)) [pred-06 and pred-adv-02 patterns]
 *
 * Using pred-06 inner [var y, body P(x,y)]:
 *   (all y. ~P(x,y)) → ~(ex y. P(x,y))  [43 steps]
 *
 * Using pred-adv-02 inner [var y, body P(x,y)]:
 *   ~(ex y. P(x,y)) → (all y. ~P(x,y))  [45 steps]
 *
 * Similar for var x.
 *
 * Plan:
 * A. pred-adv-02[x,P(x,y)]: ~(ex x. P(x,y)) → (all x. ~P(x,y))
 * B. Gen[y]+A5+distForall: (all y. ~(ex x. P(x,y))) → (all y. (all x. ~P(x,y)))
 * C. forall-swap: (all y. (all x. ~P(x,y))) → (all x. (all y. ~P(x,y)))
 * D. pred-06[y,P(x,y)]: (all y. ~P(x,y)) → ~(ex y. P(x,y))
 * E. Gen[x]+A5+distForall: (all x. (all y. ~P(x,y))) → (all x. ~(ex y. P(x,y)))
 * F. Compose B+C+E: (all y. ~(ex x. P(x,y))) → (all x. ~(ex y. P(x,y)))
 * G. MT: ~(all x. ~(ex y. P(x,y))) → ~(all y. ~(ex x. P(x,y)))
 * H. EX-DEF bwd: ~(all x. ~(ex y. P(x,y))) comes from (ex x. (ex y. P(x,y)))
 * I. EX-DEF fwd: ~(all y. ~(ex x. P(x,y))) gives (ex y. (ex x. P(x,y)))
 *
 * This is still very long but structurally clean.
 * Estimated: 45 + 27 + 13 + 43 + 27 + HS compositions + 108 + EX-DEF bridges ≈ 300+ steps
 *
 * This is the most complex quest. Let me implement it.
 */
function genPredAdv12(): ProofBuilder {
  const b = new ProofBuilder();

  // Step A: pred-adv-02 pattern [var=x, body=P(x,y)]:
  // ~(ex x. P(x,y)) → (all x. ~P(x,y))
  const exDefBwdX = b.axiom("~(all x. ~P(x, y)) -> (ex x. P(x, y))"); // EX-DEF bwd
  const dniExX = b.dni("(ex x. P(x, y))");
  const hsA = b.hs(exDefBwdX, dniExX,
    "~(all x. ~P(x, y))", "(ex x. P(x, y))", "~~(ex x. P(x, y))");
  const a3A = b.axiom("(~(all x. ~P(x, y)) -> ~~(ex x. P(x, y))) -> (~(ex x. P(x, y)) -> (all x. ~P(x, y)))");
  const predAdv02X = b.mp(hsA, a3A); // ~(ex x. P(x,y)) → (all x. ~P(x,y))

  // Step B: Gen[y] + distForall: (all y. ~(ex x. P(x,y))) → (all y. (all x. ~P(x,y)))
  const genB = b.gen(predAdv02X, "y");
  const distB = b.distForall("~(ex x. P(x, y))", "(all x. ~P(x, y))", "y");
  const stepB = b.mp(genB, distB);

  // Step C: forall swap: (all y. (all x. ~P(x,y))) → (all x. (all y. ~P(x,y)))
  const allYAllX = "all y. (all x. ~P(x, y))";
  const allXAllY = "all x. (all y. ~P(x, y))";
  const sw0 = b.axiom(`(${allYAllX}) -> (all x. ~P(x, y))`);
  const sw1 = b.axiom("(all x. ~P(x, y)) -> ~P(x, y)");
  const sw6 = b.hs(sw0, sw1, allYAllX, "all x. ~P(x, y)", "~P(x, y)");
  const fsw1 = b.gen(sw6, "y");
  const fsw2 = b.axiom(`(all y. ((${allYAllX}) -> ~P(x, y))) -> ((${allYAllX}) -> (all y. ~P(x, y)))`);
  const fsw3 = b.mp(fsw1, fsw2);
  const fsw4 = b.gen(fsw3, "x");
  const fsw5 = b.axiom(`(all x. ((${allYAllX}) -> (all y. ~P(x, y)))) -> ((${allYAllX}) -> (${allXAllY}))`);
  const forallSwap = b.mp(fsw4, fsw5);

  // Step D: pred-06 pattern [var=y, body=P(x,y)]:
  // (all y. ~P(x,y)) → ~(ex y. P(x,y))
  const dneExY = b.dne("(ex y. P(x, y))");
  const exDefFwdY = b.axiom("(ex y. P(x, y)) -> ~(all y. ~P(x, y))");
  const hsD = b.hs(dneExY, exDefFwdY,
    "~~(ex y. P(x, y))", "(ex y. P(x, y))", "~(all y. ~P(x, y))");
  const a3D = b.axiom("(~~(ex y. P(x, y)) -> ~(all y. ~P(x, y))) -> ((all y. ~P(x, y)) -> ~(ex y. P(x, y)))");
  const pred06Y = b.mp(hsD, a3D); // (all y. ~P(x,y)) → ~(ex y. P(x,y))

  // Step E: Gen[x] + distForall: (all x. (all y. ~P(x,y))) → (all x. ~(ex y. P(x,y)))
  // First need: allXAllY → (all y. ~P(x,y)) via A4
  const a4e = b.axiom(`(${allXAllY}) -> (all y. ~P(x, y))`);
  const allXAllYToNotExY = b.hs(a4e, pred06Y, allXAllY, "all y. ~P(x, y)", "~(ex y. P(x, y))");
  const genE = b.gen(allXAllYToNotExY, "x");
  const a5E = b.axiom(`(all x. ((${allXAllY}) -> ~(ex y. P(x, y)))) -> ((${allXAllY}) -> (all x. ~(ex y. P(x, y))))`);
  const stepE = b.mp(genE, a5E);

  // Step F: Compose B + C + E
  const bToSwap = b.hs(stepB, forallSwap,
    "all y. ~(ex x. P(x, y))", allYAllX, allXAllY);
  const fullFwd = b.hs(bToSwap, stepE,
    "all y. ~(ex x. P(x, y))", allXAllY, "all x. ~(ex y. P(x, y))");

  // Step G: MT
  const mtResult = b.mt("all y. ~(ex x. P(x, y))", "all x. ~(ex y. P(x, y))");
  const mtApplied = b.mp(fullFwd, mtResult);
  // ~(all x. ~(ex y. P(x,y))) → ~(all y. ~(ex x. P(x,y)))

  // Step H: EX-DEF fwd (outer x): (ex x. (ex y. P(x,y))) → ~(all x. ~(ex y. P(x,y)))
  const exDefFwdOuter = b.axiom("(ex x. (ex y. P(x, y))) -> ~(all x. ~(ex y. P(x, y)))");

  // Step I: EX-DEF bwd (outer y): ~(all y. ~(ex x. P(x,y))) → (ex y. (ex x. P(x,y)))
  const exDefBwdOuter = b.axiom("~(all y. ~(ex x. P(x, y))) -> (ex y. (ex x. P(x, y)))");

  // Final composition:
  const hs1 = b.hs(exDefFwdOuter, mtApplied,
    "(ex x. (ex y. P(x, y)))",
    "~(all x. ~(ex y. P(x, y)))",
    "~(all y. ~(ex x. P(x, y)))");
  b.hs(hs1, exDefBwdOuter,
    "(ex x. (ex y. P(x, y)))",
    "~(all y. ~(ex x. P(x, y)))",
    "(ex y. (ex x. P(x, y)))");

  return b;
}

// =============================================
// Main
// =============================================

const generators: ReadonlyArray<readonly [string, () => ProofBuilder]> = [
  ["pred-adv-02", genPredAdv02],
  ["pred-06", genPred06],
  ["pred-04", genPred04],
  ["pred-adv-06", genPredAdv06],
  ["pred-adv-08", genPredAdv08],
  ["pred-adv-13", genPredAdv13],
  ["pred-05", genPred05],
  ["pred-adv-03", genPredAdv03],
  ["pred-adv-04", genPredAdv04],
  ["pred-adv-12", genPredAdv12],
];

for (const [questId, gen] of generators) {
  try {
    const builder = gen();
    console.log(`// === ${questId}: ${builder.steps.length} steps ===`);
  } catch (e) {
    console.error(`Error generating ${questId}: ${e}`);
  }
}

// If quest ID argument provided, emit full TS
const emitQuest = process.argv[2];
if (emitQuest === "all") {
  for (const [questId, gen] of generators) {
    const builder = gen();
    console.log(`\n// === ${questId} (${builder.steps.length} steps) ===`);
    console.log(builder.emitTS());
  }
} else if (emitQuest) {
  const entry = generators.find(([id]) => id === emitQuest);
  if (entry) {
    const builder = entry[1]();
    console.log(`\n// Full output for ${emitQuest}:`);
    console.log(builder.emitTS());
  }
}
