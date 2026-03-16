/**
 * scProofTreeRendererLogic のテスト。
 *
 * ScProofNode → Gentzenスタイル表示データ変換ロジックを検証する。
 */

import { describe, expect, it } from "vitest";
import type { Formula } from "../logic-core/formula";
import { MetaVariable } from "../logic-core/formula";
import type { ScProofNode } from "../logic-core/sequentCalculus";
import {
  scIdentity,
  scBottomLeft,
  scCut,
  scWeakeningLeft,
  scWeakeningRight,
  scContractionLeft,
  scContractionRight,
  scExchangeLeft,
  scExchangeRight,
  scImplicationLeft,
  scImplicationRight,
  scConjunctionLeft,
  scConjunctionRight,
  scDisjunctionLeft,
  scDisjunctionRight,
  scNegationLeft,
  scNegationRight,
  scUniversalLeft,
  scUniversalRight,
  scExistentialLeft,
  scExistentialRight,
  sequent,
} from "../logic-core/sequentCalculus";
import {
  getScRuleLabel,
  convertScProofTreeToDisplay,
  computeProofTreeStats,
} from "./scProofTreeRendererLogic";

// ── テストヘルパー ──────────────────────────────────────────

const phi: Formula = new MetaVariable({ name: "φ" });
const psi: Formula = new MetaVariable({ name: "ψ" });

// ── getScRuleLabel ──────────────────────────────────────────

describe("getScRuleLabel", () => {
  it.each([
    ["ScIdentity", "Id"],
    ["ScBottomLeft", "⊥L"],
    ["ScCut", "Cut"],
    ["ScWeakeningLeft", "WL"],
    ["ScWeakeningRight", "WR"],
    ["ScContractionLeft", "CL"],
    ["ScContractionRight", "CR"],
    ["ScExchangeLeft", "XL"],
    ["ScExchangeRight", "XR"],
    ["ScImplicationLeft", "→L"],
    ["ScImplicationRight", "→R"],
    ["ScConjunctionLeft", "∧L"],
    ["ScConjunctionRight", "∧R"],
    ["ScDisjunctionLeft", "∨L"],
    ["ScDisjunctionRight", "∨R"],
    ["ScNegationLeft", "¬L"],
    ["ScNegationRight", "¬R"],
    ["ScUniversalLeft", "∀L"],
    ["ScUniversalRight", "∀R"],
    ["ScExistentialLeft", "∃L"],
    ["ScExistentialRight", "∃R"],
  ] as const)("%s → %s", (tag, expected) => {
    expect(getScRuleLabel(tag)).toBe(expected);
  });
});

// ── convertScProofTreeToDisplay ────────────────────────────

describe("convertScProofTreeToDisplay", () => {
  it("公理ノード（前提なし）を変換する", () => {
    const proof = scIdentity(sequent([phi], [phi]));
    const result = convertScProofTreeToDisplay(proof);

    expect(result.nodes.size).toBe(1);
    const root = result.nodes.get(result.rootId);
    expect(root).toBeDefined();
    expect(root?.ruleLabel).toBe("Id");
    expect(root?.premiseIds).toEqual([]);
    expect(root?.depth).toBe(0);
    expect(root?.conclusionText).toContain("⊢");
  });

  it("⊥L公理を変換する", () => {
    const proof = scBottomLeft(sequent([phi], [phi]));
    const result = convertScProofTreeToDisplay(proof);

    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("⊥L");
    expect(root?.premiseIds).toEqual([]);
  });

  it("単項規則（→R）を変換する", () => {
    const premise = scIdentity(sequent([phi], [psi]));
    const proof = scImplicationRight(premise, sequent([], [phi]));
    const result = convertScProofTreeToDisplay(proof);

    expect(result.nodes.size).toBe(2);
    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("→R");
    expect(root?.premiseIds).toHaveLength(1);
    expect(root?.depth).toBe(0);

    const premiseNode = result.nodes.get(root!.premiseIds[0]!);
    expect(premiseNode?.ruleLabel).toBe("Id");
    expect(premiseNode?.depth).toBe(1);
  });

  it("二項規則（Cut）を変換する", () => {
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([phi], [psi]));
    const proof = scCut(left, right, phi, sequent([phi], [psi]));
    const result = convertScProofTreeToDisplay(proof);

    expect(result.nodes.size).toBe(3);
    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("Cut");
    expect(root?.premiseIds).toHaveLength(2);
  });

  it("二項規則（→L）を変換する", () => {
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([psi], [psi]));
    const proof = scImplicationLeft(left, right, sequent([phi], [psi]));
    const result = convertScProofTreeToDisplay(proof);

    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("→L");
    expect(root?.premiseIds).toHaveLength(2);
  });

  it("二項規則（∧R）を変換する", () => {
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([psi], [psi]));
    const proof = scConjunctionRight(left, right, sequent([phi], [psi]));
    const result = convertScProofTreeToDisplay(proof);

    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("∧R");
    expect(root?.premiseIds).toHaveLength(2);
  });

  it("二項規則（∨L）を変換する", () => {
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([psi], [psi]));
    const proof = scDisjunctionLeft(left, right, sequent([phi], [psi]));
    const result = convertScProofTreeToDisplay(proof);

    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("∨L");
    expect(root?.premiseIds).toHaveLength(2);
  });

  it("深いツリーの深さが正しく計算される", () => {
    const leaf = scIdentity(sequent([phi], [phi]));
    const mid = scWeakeningLeft(leaf, psi, sequent([psi, phi], [phi]));
    const root = scContractionLeft(mid, phi, sequent([phi], [phi]));
    const result = convertScProofTreeToDisplay(root);

    expect(result.nodes.size).toBe(3);
    const rootNode = result.nodes.get(result.rootId);
    expect(rootNode?.depth).toBe(0);

    const midNode = result.nodes.get(rootNode!.premiseIds[0]!);
    expect(midNode?.depth).toBe(1);
    expect(midNode?.ruleLabel).toBe("WL");

    const leafNode = result.nodes.get(midNode!.premiseIds[0]!);
    expect(leafNode?.depth).toBe(2);
    expect(leafNode?.ruleLabel).toBe("Id");
  });

  it("全単項規則の前提数が1になる", () => {
    const leaf = scIdentity(sequent([phi], [phi]));

    const unaryRules: readonly ScProofNode[] = [
      scWeakeningLeft(leaf, phi, sequent([phi], [phi])),
      scWeakeningRight(leaf, phi, sequent([phi], [phi])),
      scContractionLeft(leaf, phi, sequent([phi], [phi])),
      scContractionRight(leaf, phi, sequent([phi], [phi])),
      scExchangeLeft(leaf, 0, sequent([phi], [phi])),
      scExchangeRight(leaf, 0, sequent([phi], [phi])),
      scImplicationRight(leaf, sequent([phi], [phi])),
      scConjunctionLeft(leaf, 1, sequent([phi], [phi])),
      scDisjunctionRight(leaf, 1, sequent([phi], [phi])),
      scNegationLeft(leaf, sequent([phi], [phi])),
      scNegationRight(leaf, sequent([phi], [phi])),
      scUniversalLeft(leaf, sequent([phi], [phi])),
      scUniversalRight(leaf, sequent([phi], [phi])),
      scExistentialLeft(leaf, sequent([phi], [phi])),
      scExistentialRight(leaf, sequent([phi], [phi])),
    ];

    for (const rule of unaryRules) {
      const result = convertScProofTreeToDisplay(rule);
      const root = result.nodes.get(result.rootId);
      expect(root?.premiseIds).toHaveLength(1);
    }
  });

  it("IDがユニークである", () => {
    const leaf1 = scIdentity(sequent([phi], [phi]));
    const leaf2 = scIdentity(sequent([psi], [psi]));
    const root = scCut(leaf1, leaf2, phi, sequent([phi], [psi]));
    const result = convertScProofTreeToDisplay(root);

    const ids = [...result.nodes.keys()];
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── computeProofTreeStats ──────────────────────────────────

describe("computeProofTreeStats", () => {
  it("公理ノード1つの統計", () => {
    const proof = scIdentity(sequent([phi], [phi]));
    const data = convertScProofTreeToDisplay(proof);
    const stats = computeProofTreeStats(data);

    expect(stats.totalNodes).toBe(1);
    expect(stats.maxDepth).toBe(0);
    expect(stats.usedRules).toEqual(["Id"]);
  });

  it("複数規則の統計", () => {
    const leaf = scIdentity(sequent([phi], [phi]));
    const mid = scWeakeningLeft(leaf, psi, sequent([psi, phi], [phi]));
    const root = scContractionLeft(mid, phi, sequent([phi], [phi]));
    const data = convertScProofTreeToDisplay(root);
    const stats = computeProofTreeStats(data);

    expect(stats.totalNodes).toBe(3);
    expect(stats.maxDepth).toBe(2);
    expect(stats.usedRules).toEqual(["CL", "Id", "WL"]);
  });

  it("二項規則を含む統計", () => {
    const left = scIdentity(sequent([phi], [phi]));
    const right = scIdentity(sequent([psi], [psi]));
    const root = scCut(left, right, phi, sequent([phi], [psi]));
    const data = convertScProofTreeToDisplay(root);
    const stats = computeProofTreeStats(data);

    expect(stats.totalNodes).toBe(3);
    expect(stats.maxDepth).toBe(1);
    expect(stats.usedRules).toEqual(["Cut", "Id"]);
  });
});
