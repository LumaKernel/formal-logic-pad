import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { ScProofTreePanel } from "./ScProofTreePanel";
import type { ScProofNode } from "../logic-core/sequentCalculus";
import {
  sequent,
  scIdentity,
  scCut,
  scWeakeningLeft,
  scWeakeningRight,
  scImplicationRight,
  scImplicationLeft,
  scConjunctionRight,
  scContractionLeft,
  scExchangeLeft,
} from "../logic-core/sequentCalculus";
import { metaVariable, implication, conjunction } from "../logic-core/formula";

// --- テスト用証明 ---

const phi = metaVariable("φ");
const psi = metaVariable("ψ");
const chi = metaVariable("χ");

function makeIdentityProof(): ScProofNode {
  return scIdentity(sequent([phi], [phi]));
}

function makeSimpleCutProof(): ScProofNode {
  const leftProof = scIdentity(sequent([phi], [phi]));
  const rightProof = scIdentity(sequent([phi], [psi]));
  return scCut(leftProof, rightProof, phi, sequent([phi], [psi]));
}

function makeImplicationProof(): ScProofNode {
  // φ ⊢ ψ から ⊢ φ → ψ を導く
  const premise = scIdentity(sequent([phi], [psi]));
  return scImplicationRight(premise, sequent([], [implication(phi, psi)]));
}

function makeDeepProof(): ScProofNode {
  // 3段階: Id → WL → CL → →R
  const leaf = scIdentity(sequent([phi], [phi]));
  const weak = scWeakeningLeft(leaf, psi, sequent([psi, phi], [phi]));
  const contr = scContractionLeft(weak, phi, sequent([phi], [phi]));
  return scImplicationRight(contr, sequent([], [implication(phi, phi)]));
}

function makeBranchingProof(): ScProofNode {
  // ∧R: 2つの前提を持つ二項規則
  const left = scIdentity(sequent([phi], [phi]));
  const right = scIdentity(sequent([psi], [psi]));
  return scConjunctionRight(
    left,
    right,
    sequent([phi, psi], [conjunction(phi, psi)]),
  );
}

function makeComplexProof(): ScProofNode {
  // 複雑な証明: 二項規則 + 構造規則 + カット
  const id1 = scIdentity(sequent([phi], [phi]));
  const id2 = scIdentity(sequent([psi], [psi]));
  const implLeft = scImplicationLeft(
    id1,
    id2,
    sequent([implication(phi, psi), phi], [psi]),
  );
  const exchange = scExchangeLeft(
    implLeft,
    0,
    sequent([phi, implication(phi, psi)], [psi]),
  );
  const weakened = scWeakeningRight(
    exchange,
    chi,
    sequent([phi, implication(phi, psi)], [psi, chi]),
  );
  return weakened;
}

// --- メタ ---

const meta: Meta<typeof ScProofTreePanel> = {
  title: "proof-pad/ScProofTreePanel",
  component: ScProofTreePanel,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ScProofTreePanel>;

// --- ストーリー ---

export const Identity: Story = {
  args: {
    proof: makeIdentityProof(),
    testId: "tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Proof Tree")).toBeInTheDocument();
    await expect(canvas.getByText("1 nodes, depth 0")).toBeInTheDocument();
    await expect(canvas.getByText("Id")).toBeInTheDocument();
  },
};

export const SimpleCut: Story = {
  args: {
    proof: makeSimpleCutProof(),
    testId: "tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("3 nodes, depth 1")).toBeInTheDocument();
    await expect(canvas.getByText("Cut")).toBeInTheDocument();
  },
};

export const ImplicationRight: Story = {
  args: {
    proof: makeImplicationProof(),
    testId: "tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("2 nodes, depth 1")).toBeInTheDocument();
    await expect(canvas.getByText("→R")).toBeInTheDocument();
    await expect(canvas.getByText("Id")).toBeInTheDocument();
  },
};

export const DeepTree: Story = {
  args: {
    proof: makeDeepProof(),
    testId: "tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("4 nodes, depth 3")).toBeInTheDocument();
    await expect(canvas.getByText("→R")).toBeInTheDocument();
    await expect(canvas.getByText("CL")).toBeInTheDocument();
    await expect(canvas.getByText("WL")).toBeInTheDocument();
    await expect(canvas.getByText("Id")).toBeInTheDocument();
  },
};

export const BranchingRule: Story = {
  args: {
    proof: makeBranchingProof(),
    testId: "tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("3 nodes, depth 1")).toBeInTheDocument();
    await expect(canvas.getByText("∧R")).toBeInTheDocument();
  },
};

export const ComplexProof: Story = {
  args: {
    proof: makeComplexProof(),
    testId: "tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Proof Tree")).toBeInTheDocument();
    await expect(canvas.getByText("→L")).toBeInTheDocument();
    await expect(canvas.getByText("XL")).toBeInTheDocument();
    await expect(canvas.getByText("WR")).toBeInTheDocument();
  },
};
