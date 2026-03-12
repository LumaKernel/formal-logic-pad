#!/usr/bin/env -S npx tsx
/**
 * Integrates generated proofs into builtinModelAnswers.ts.
 * Replaces pragmatic single-axiom model answers with formalized multi-step proofs.
 *
 * Usage: npx tsx scripts/integrate-proofs.ts
 */

import * as fs from "fs";
import * as path from "path";

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

  private p(s: string): string { return `(${s})`; }

  hs(ab: number, bc: number, a: string, b: string, c: string): number {
    const pa = this.p(a), pb = this.p(b), pc = this.p(c);
    const s1 = this.axiom(`(${pb} -> ${pc}) -> (${pa} -> (${pb} -> ${pc}))`);
    const s2 = this.mp(bc, s1);
    const s3 = this.axiom(`(${pa} -> (${pb} -> ${pc})) -> ((${pa} -> ${pb}) -> (${pa} -> ${pc}))`);
    const s4 = this.mp(s2, s3);
    return this.mp(ab, s4);
  }

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

  dni(phi: string): number {
    const tripleNeg = this.dne(`~${phi}`);
    const a3 = this.axiom(`(~~~${phi} -> ~${phi}) -> (${phi} -> ~~${phi})`);
    return this.mp(tripleNeg, a3);
  }

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

  emitStepsTS(indent: string = "    "): string {
    const lines = this.steps.map((s, i) => {
      if (s._tag === "axiom") {
        const ft = JSON.stringify(s.formulaText);
        if (ft.length > 70) {
          return `${indent}// Step ${i}\n${indent}{\n${indent}  _tag: "axiom",\n${indent}  formulaText:\n${indent}    ${ft},\n${indent}},`;
        }
        return `${indent}// Step ${i}\n${indent}{ _tag: "axiom", formulaText: ${ft} },`;
      } else if (s._tag === "mp") {
        return `${indent}// Step ${i}\n${indent}{ _tag: "mp", leftIndex: ${s.leftIndex}, rightIndex: ${s.rightIndex} },`;
      } else {
        return `${indent}// Step ${i}\n${indent}{ _tag: "gen", premiseIndex: ${s.premiseIndex}, variableName: ${JSON.stringify(s.variableName)} },`;
      }
    });
    return lines.join("\n");
  }
}

// =============================================
// Quest generators (same as pred-proof-gen.ts)
// =============================================

function genPredAdv02(): ProofBuilder {
  const b = new ProofBuilder();
  const exDef = b.axiom("~(all x. ~P(x)) -> (ex x. P(x))");
  const dniEx = b.dni("(ex x. P(x))");
  const hsResult = b.hs(exDef, dniEx,
    "~(all x. ~P(x))", "(ex x. P(x))", "~~(ex x. P(x))");
  const a3 = b.axiom("(~(all x. ~P(x)) -> ~~(ex x. P(x))) -> (~(ex x. P(x)) -> (all x. ~P(x)))");
  b.mp(hsResult, a3);
  return b;
}

function genPred06(): ProofBuilder {
  const b = new ProofBuilder();
  const dneEx = b.dne("(ex x. P(x))");
  const exDef = b.axiom("(ex x. P(x)) -> ~(all x. ~P(x))");
  const hsResult = b.hs(dneEx, exDef,
    "~~(ex x. P(x))", "(ex x. P(x))", "~(all x. ~P(x))");
  const a3 = b.axiom("(~~(ex x. P(x)) -> ~(all x. ~P(x))) -> ((all x. ~P(x)) -> ~(ex x. P(x)))");
  b.mp(hsResult, a3);
  return b;
}

function genPred04(): ProofBuilder {
  const b = new ProofBuilder();
  const dneResult = b.dne("(all x. ~P(x))");
  const a4 = b.axiom("(all x. ~P(x)) -> ~P(x)");
  const hs1 = b.hs(dneResult, a4, "~~(all x. ~P(x))", "(all x. ~P(x))", "~P(x)");
  const a3 = b.axiom("(~~(all x. ~P(x)) -> ~P(x)) -> (P(x) -> ~(all x. ~P(x)))");
  const pToNotAll = b.mp(hs1, a3);
  const exDef = b.axiom("~(all x. ~P(x)) -> (ex x. P(x))");
  b.hs(pToNotAll, exDef, "P(x)", "~(all x. ~P(x))", "ex x. P(x)");
  return b;
}

function genPredAdv06(): ProofBuilder {
  const b = new ProofBuilder();
  const dneResult = b.dne("(all x. ~P(x))");
  const a4_inner = b.axiom("(all x. ~P(x)) -> ~P(x)");
  const hs1 = b.hs(dneResult, a4_inner, "~~(all x. ~P(x))", "(all x. ~P(x))", "~P(x)");
  const a3 = b.axiom("(~~(all x. ~P(x)) -> ~P(x)) -> (P(x) -> ~(all x. ~P(x)))");
  const pToNotAll = b.mp(hs1, a3);
  const exDef = b.axiom("~(all x. ~P(x)) -> (ex x. P(x))");
  const pred04 = b.hs(pToNotAll, exDef, "P(x)", "~(all x. ~P(x))", "ex x. P(x)");
  const a4_outer = b.axiom("(all x. P(x)) -> P(x)");
  b.hs(a4_outer, pred04, "(all x. P(x))", "P(x)", "ex x. P(x)");
  return b;
}

function genPredAdv08(): ProofBuilder {
  const b = new ProofBuilder();
  const dniPx = b.dni("P(x)");
  const a4 = b.axiom("(all x. P(x)) -> P(x)");
  const hs1 = b.hs(a4, dniPx, "(all x. P(x))", "P(x)", "~~P(x)");
  const gen1 = b.gen(hs1, "x");
  const a5 = b.axiom("(all x. ((all x. P(x)) -> ~~P(x))) -> ((all x. P(x)) -> (all x. ~~P(x)))");
  const allPToAllNNP = b.mp(gen1, a5);
  const dneEx = b.dne("(ex x. ~P(x))");
  const exDefFwd = b.axiom("(ex x. ~P(x)) -> ~(all x. ~~P(x))");
  const hsExDne = b.hs(dneEx, exDefFwd,
    "~~(ex x. ~P(x))", "(ex x. ~P(x))", "~(all x. ~~P(x))");
  const a3 = b.axiom("(~~(ex x. ~P(x)) -> ~(all x. ~~P(x))) -> ((all x. ~~P(x)) -> ~(ex x. ~P(x)))");
  const allNNPToNotExNot = b.mp(hsExDne, a3);
  b.hs(allPToAllNNP, allNNPToNotExNot,
    "(all x. P(x))", "(all x. ~~P(x))", "~(ex x. ~P(x))");
  return b;
}

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

function genPred05(): ProofBuilder {
  const b = new ProofBuilder();
  const dniPx = b.dni("P(x)");
  const a4 = b.axiom("(all x. P(x)) -> P(x)");
  const hs1 = b.hs(a4, dniPx, "(all x. P(x))", "P(x)", "~~P(x)");
  const gen1 = b.gen(hs1, "x");
  const a5 = b.axiom("(all x. ((all x. P(x)) -> ~~P(x))) -> ((all x. P(x)) -> (all x. ~~P(x)))");
  const fwdStep = b.mp(gen1, a5);
  const mtResult = b.mt("(all x. P(x))", "(all x. ~~P(x))");
  const mtApplied = b.mp(fwdStep, mtResult);
  const exDefFwd = b.axiom("(ex x. ~P(x)) -> ~(all x. ~~P(x))");
  b.hs(exDefFwd, mtApplied,
    "(ex x. ~P(x))", "~(all x. ~~P(x))", "~(all x. P(x))");
  return b;
}

function genPredAdv03(): ProofBuilder {
  const b = new ProofBuilder();
  const dnePx = b.dne("P(x)");
  const gen1 = b.gen(dnePx, "x");
  const dist = b.distForall("~~P(x)", "P(x)", "x");
  const fwd = b.mp(gen1, dist);
  const mtResult = b.mt("(all x. ~~P(x))", "(all x. P(x))");
  const mtApplied = b.mp(fwd, mtResult);
  const exDefBwd = b.axiom("~(all x. ~~P(x)) -> (ex x. ~P(x))");
  b.hs(mtApplied, exDefBwd,
    "~(all x. P(x))", "~(all x. ~~P(x))", "ex x. ~P(x)");
  return b;
}

function genPredAdv04(): ProofBuilder {
  const b = new ProofBuilder();
  const allPQ = "(all x. (P(x) -> Q(x)))";
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
  const mtOuter = b.mt("(all x. ~Q(x))", "(all x. ~P(x))");
  const allPQToNeg = b.hs(allPQToInner, mtOuter, allPQ,
    "(all x. ~Q(x)) -> (all x. ~P(x))",
    "~(all x. ~P(x)) -> ~(all x. ~Q(x))");
  const exDefP = b.axiom("(ex x. P(x)) -> ~(all x. ~P(x))");
  const exDefQ = b.axiom("~(all x. ~Q(x)) -> (ex x. Q(x))");
  const liftExDefQ = b.axiom(`(~(all x. ~Q(x)) -> (ex x. Q(x))) -> (${allPQ} -> (~(all x. ~Q(x)) -> (ex x. Q(x))))`);
  const allPQExDefQ = b.mp(exDefQ, liftExDefQ);
  const A_inner = "~(all x. ~P(x))";
  const B_inner = "~(all x. ~Q(x))";
  const C_inner = "(ex x. Q(x))";
  const a1Lift = b.axiom(`(${B_inner} -> ${C_inner}) -> (${A_inner} -> (${B_inner} -> ${C_inner}))`);
  const allPQA_BC = b.hs(allPQExDefQ, a1Lift, allPQ,
    `${B_inner} -> ${C_inner}`,
    `${A_inner} -> (${B_inner} -> ${C_inner})`);
  const a2inst = b.axiom(`(${A_inner} -> (${B_inner} -> ${C_inner})) -> ((${A_inner} -> ${B_inner}) -> (${A_inner} -> ${C_inner}))`);
  const allPQAB_AC = b.hs(allPQA_BC, a2inst, allPQ,
    `${A_inner} -> (${B_inner} -> ${C_inner})`,
    `(${A_inner} -> ${B_inner}) -> (${A_inner} -> ${C_inner})`);
  const a2outer = b.axiom(`(${allPQ} -> ((${A_inner} -> ${B_inner}) -> (${A_inner} -> ${C_inner}))) -> ((${allPQ} -> (${A_inner} -> ${B_inner})) -> (${allPQ} -> (${A_inner} -> ${C_inner})))`);
  const step_ab_ac = b.mp(allPQAB_AC, a2outer);
  const allPQ_A_C = b.mp(allPQToNeg, step_ab_ac);
  const exP = "(ex x. P(x))";
  const exQ = "(ex x. Q(x))";
  const liftExDefP = b.axiom(`((ex x. P(x)) -> ~(all x. ~P(x))) -> (${allPQ} -> ((ex x. P(x)) -> ~(all x. ~P(x))))`);
  const allPQExDefP = b.mp(exDefP, liftExDefP);
  const a1Lift2 = b.axiom(`(${A_inner} -> ${exQ}) -> (${exP} -> (${A_inner} -> ${exQ}))`);
  const allPQ_exP_A_exQ = b.hs(allPQ_A_C, a1Lift2, allPQ,
    `${A_inner} -> ${exQ}`,
    `${exP} -> (${A_inner} -> ${exQ})`);
  const a2inst2 = b.axiom(`(${exP} -> (${A_inner} -> ${exQ})) -> ((${exP} -> ${A_inner}) -> (${exP} -> ${exQ}))`);
  const allPQ_exPA_exPexQ = b.hs(allPQ_exP_A_exQ, a2inst2, allPQ,
    `${exP} -> (${A_inner} -> ${exQ})`,
    `(${exP} -> ${A_inner}) -> (${exP} -> ${exQ})`);
  const a2final = b.axiom(`(${allPQ} -> ((${exP} -> ${A_inner}) -> (${exP} -> ${exQ}))) -> ((${allPQ} -> (${exP} -> ${A_inner})) -> (${allPQ} -> (${exP} -> ${exQ})))`);
  const step_final_a = b.mp(allPQ_exPA_exPexQ, a2final);
  b.mp(allPQExDefP, step_final_a);
  return b;
}

function genPredAdv12(): ProofBuilder {
  const b = new ProofBuilder();
  const exDefBwdX = b.axiom("~(all x. ~P(x, y)) -> (ex x. P(x, y))");
  const dniExX = b.dni("(ex x. P(x, y))");
  const hsA = b.hs(exDefBwdX, dniExX,
    "~(all x. ~P(x, y))", "(ex x. P(x, y))", "~~(ex x. P(x, y))");
  const a3A = b.axiom("(~(all x. ~P(x, y)) -> ~~(ex x. P(x, y))) -> (~(ex x. P(x, y)) -> (all x. ~P(x, y)))");
  const predAdv02X = b.mp(hsA, a3A);
  const genB = b.gen(predAdv02X, "y");
  const distB = b.distForall("~(ex x. P(x, y))", "(all x. ~P(x, y))", "y");
  const stepB = b.mp(genB, distB);
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
  const dneExY = b.dne("(ex y. P(x, y))");
  const exDefFwdY = b.axiom("(ex y. P(x, y)) -> ~(all y. ~P(x, y))");
  const hsD = b.hs(dneExY, exDefFwdY,
    "~~(ex y. P(x, y))", "(ex y. P(x, y))", "~(all y. ~P(x, y))");
  const a3D = b.axiom("(~~(ex y. P(x, y)) -> ~(all y. ~P(x, y))) -> ((all y. ~P(x, y)) -> ~(ex y. P(x, y)))");
  const pred06Y = b.mp(hsD, a3D);
  const a4e = b.axiom(`(${allXAllY}) -> (all y. ~P(x, y))`);
  const allXAllYToNotExY = b.hs(a4e, pred06Y, allXAllY, "all y. ~P(x, y)", "~(ex y. P(x, y))");
  const genE = b.gen(allXAllYToNotExY, "x");
  const a5E = b.axiom(`(all x. ((${allXAllY}) -> ~(ex y. P(x, y)))) -> ((${allXAllY}) -> (all x. ~(ex y. P(x, y))))`);
  const stepE = b.mp(genE, a5E);
  const bToSwap = b.hs(stepB, forallSwap,
    "all y. ~(ex x. P(x, y))", allYAllX, allXAllY);
  const fullFwd = b.hs(bToSwap, stepE,
    "all y. ~(ex x. P(x, y))", allXAllY, "all x. ~(ex y. P(x, y))");
  const mtResult = b.mt("all y. ~(ex x. P(x, y))", "all x. ~(ex y. P(x, y))");
  const mtApplied = b.mp(fullFwd, mtResult);
  const exDefFwdOuter = b.axiom("(ex x. (ex y. P(x, y))) -> ~(all x. ~(ex y. P(x, y)))");
  const exDefBwdOuter = b.axiom("~(all y. ~(ex x. P(x, y))) -> (ex y. (ex x. P(x, y)))");
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
// Integration
// =============================================

interface QuestConfig {
  readonly questId: string;
  readonly varName: string;
  readonly generator: () => ProofBuilder;
  readonly docComment: string;
}

const quests: readonly QuestConfig[] = [
  {
    questId: "pred-adv-02",
    varName: "predAdv02NegationOfExistence",
    generator: genPredAdv02,
    docComment: `/**
 * pred-adv-02: 存在の否定 → 全称の否定
 *
 * ¬(∃x.P(x)) → (∀x.¬P(x))。
 * A3[α=(∀x.¬P(x)),β=¬(∃x.P(x))] + EX-DEF bwd + DNI + HS。
 * 45ステップ。
 */`,
  },
  {
    questId: "pred-06",
    varName: "pred06UnivNegToNegExist",
    generator: genPred06,
    docComment: `/**
 * pred-06: ∀x.¬P(x) → ¬∃x.P(x)
 *
 * A3[α=¬(∃x.P(x)),β=(∀x.¬P(x))] + DNE + EX-DEF fwd + HS。
 * 43ステップ。
 */`,
  },
  {
    questId: "pred-04",
    varName: "pred04ExistentialIntro",
    generator: genPred04,
    docComment: `/**
 * pred-04: 存在導入 P(x) → ∃x.P(x)
 *
 * DNE[(∀x.¬P(x))] + A4 + HS + A3 + EX-DEF bwd + HS。
 * 49ステップ。
 */`,
  },
  {
    questId: "pred-adv-06",
    varName: "predAdv06UniversalToExistential",
    generator: genPredAdv06,
    docComment: `/**
 * pred-adv-06: 全称から存在
 *
 * (∀x.P(x)) → (∃x.P(x))。
 * pred-04のインライン(P(x)→∃x.P(x)) + A4外 + HS。
 * 55ステップ。
 */`,
  },
  {
    questId: "pred-adv-08",
    varName: "predAdv08UniversalToNotExistNot",
    generator: genPredAdv08,
    docComment: `/**
 * pred-adv-08: 全称 → 存在否定の否定
 *
 * (∀x.P(x)) → ¬(∃x.¬P(x))。
 * DNI[P(x)] + A4 + Gen + A5 → (∀x.P(x))→(∀x.~~P(x))。
 * A3 + DNE + EX-DEF fwd → (∀x.~~P(x))→¬(∃x.¬P(x))。
 * HS合成。94ステップ。
 */`,
  },
  {
    questId: "pred-adv-13",
    varName: "predAdv13ContrapositiveUnderForall",
    generator: genPredAdv13,
    docComment: `/**
 * pred-adv-13: 全称下の対偶
 *
 * (∀x.(P(x)→Q(x))) → (∀x.(¬Q(x)→¬P(x)))。
 * A4 + MT[P(x),Q(x)] + HS + Gen + A5。108ステップ。
 */`,
  },
  {
    questId: "pred-05",
    varName: "pred05ExistNegToNegUniv",
    generator: genPred05,
    docComment: `/**
 * pred-05: ∃x.¬P(x) → ¬∀x.P(x)
 *
 * DNI[P(x)] + A4 + Gen + A5 → (∀x.P(x))→(∀x.~~P(x))。
 * MT[(∀x.P(x)),(∀x.~~P(x))] → ¬(∀x.~~P(x))→¬(∀x.P(x))。
 * EX-DEF fwd + HS。152ステップ。
 */`,
  },
  {
    questId: "pred-adv-03",
    varName: "predAdv03NegationOfUniversal",
    generator: genPredAdv03,
    docComment: `/**
 * pred-adv-03: 全称の否定 → 存在の否定
 *
 * ¬(∀x.P(x)) → (∃x.¬P(x))。
 * DNE[P(x)] + Gen + distForall → (∀x.~~P(x))→(∀x.P(x))。
 * MT + EX-DEF bwd + HS。171ステップ。
 */`,
  },
  {
    questId: "pred-adv-04",
    varName: "predAdv04ExistentialImplicationDistribution",
    generator: genPredAdv04,
    docComment: `/**
 * pred-adv-04: 存在の含意分配
 *
 * (∀x.(P(x)→Q(x))) → ((∃x.P(x)) → (∃x.Q(x)))。
 * MT[P(x),Q(x)] + Gen + distForall + MT外 + EX-DEF両方向 + HS合成。
 * 281ステップ。
 */`,
  },
  {
    questId: "pred-adv-12",
    varName: "predAdv12ExistentialSwap",
    generator: genPredAdv12,
    docComment: `/**
 * pred-adv-12: 存在量化子の交換
 *
 * (∃x.∃y.P(x,y)) → (∃y.∃x.P(x,y))。
 * pred-adv-02[x] + Gen + distForall + forall-swap + pred-06[y] + Gen + A5
 * + MT + EX-DEF両方向。262ステップ。
 */`,
  },
];

const targetFile = path.join(__dirname, "../src/lib/quest/builtinModelAnswers.ts");
let lines = fs.readFileSync(targetFile, "utf-8").split("\n");

function findAndReplaceBlock(
  fileLines: string[],
  varName: string,
  newBlock: string,
): string[] {
  // Find the line containing `const VARNAME: ModelAnswer = {`
  const constPattern = `const ${varName}: ModelAnswer = {`;
  const constLineIdx = fileLines.findIndex((line) => line.includes(constPattern));
  if (constLineIdx === -1) {
    throw new Error(`Could not find const line for ${varName}`);
  }

  // Find the JSDoc comment start before this line (scan backwards for /**)
  let jsdocStart = constLineIdx;
  for (let i = constLineIdx - 1; i >= 0; i--) {
    const trimmed = fileLines[i].trim();
    if (trimmed === "") continue; // skip blank lines between JSDoc and const
    if (trimmed.startsWith("*") || trimmed.startsWith("/**") || trimmed === "*/") {
      jsdocStart = i;
      if (trimmed.startsWith("/**")) break;
    } else {
      break; // hit non-JSDoc content
    }
  }

  // Find the closing `};` after the const line
  // Track brace depth to handle nested objects
  let braceDepth = 0;
  let blockEnd = constLineIdx;
  let foundOpenBrace = false;
  for (let i = constLineIdx; i < fileLines.length; i++) {
    const line = fileLines[i];
    for (const ch of line) {
      if (ch === "{") {
        braceDepth++;
        foundOpenBrace = true;
      } else if (ch === "}") {
        braceDepth--;
        if (foundOpenBrace && braceDepth === 0) {
          blockEnd = i;
          break;
        }
      }
    }
    if (foundOpenBrace && braceDepth === 0) break;
  }

  // Replace lines from jsdocStart to blockEnd (inclusive) with newBlock
  const newLines = newBlock.split("\n");
  const result = [
    ...fileLines.slice(0, jsdocStart),
    ...newLines,
    ...fileLines.slice(blockEnd + 1),
  ];

  console.log(`  Replaced lines ${jsdocStart + 1}-${blockEnd + 1} (${blockEnd - jsdocStart + 1} lines) with ${newLines.length} lines`);
  return result;
}

for (const quest of quests) {
  const builder = quest.generator();
  console.log(`${quest.questId}: ${builder.steps.length} steps`);

  const stepsTS = builder.emitStepsTS("    ");

  // Build the new ModelAnswer block
  const newBlock = `${quest.docComment}
const ${quest.varName}: ModelAnswer = {
  questId: "${quest.questId}",
  steps: [
${stepsTS}
  ],
};`;

  lines = findAndReplaceBlock(lines, quest.varName, newBlock);
}

fs.writeFileSync(targetFile, lines.join("\n"));
console.log("\nDone! All 10 proofs integrated.");
