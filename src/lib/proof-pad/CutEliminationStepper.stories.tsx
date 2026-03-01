import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within, userEvent } from "storybook/test";
import { useState, useCallback } from "react";
import { CutEliminationStepper } from "./CutEliminationStepper";
import {
  computeCutEliminationStepperData,
  resolveStepperState,
} from "./cutEliminationStepperLogic";
import { defaultProofMessages } from "./proofMessages";
import { eliminateCutsWithSteps } from "../logic-core/cutElimination";
import type { CutEliminationOptions } from "../logic-core/cutElimination";
import type { ScProofNode } from "../logic-core/sequentCalculus";
import {
  sequent,
  scIdentity,
  scCut,
  scWeakeningRight,
} from "../logic-core/sequentCalculus";
import { metaVariable, implication } from "../logic-core/formula";

// --- テスト用証明 ---

const phi = metaVariable("\u03C6");
const psi = metaVariable("\u03C8");

function makeIdentityProof(): ScProofNode {
  return scIdentity(sequent([phi], [phi]));
}

function makeSimpleCutProof(): ScProofNode {
  const leftProof = scIdentity(sequent([phi], [phi]));
  const rightProof = scIdentity(sequent([phi], [phi]));
  return scCut(leftProof, rightProof, phi, sequent([phi], [phi]));
}

function makeRank0CutProof(): ScProofNode {
  const leftBase = scIdentity(sequent([phi], [phi]));
  const leftProof = scWeakeningRight(leftBase, psi, sequent([phi], [phi, psi]));
  const rightProof = scIdentity(sequent([psi], [psi]));
  return scCut(leftProof, rightProof, psi, sequent([phi], [phi, psi]));
}

function makeNestedCutProof(): ScProofNode {
  // \u30CD\u30B9\u30C8\u3055\u308C\u305F\u30AB\u30C3\u30C8: \u30AB\u30C3\u30C8\u306E\u5DE6\u524D\u63D0\u306B\u3082\u30AB\u30C3\u30C8\u304C\u3042\u308B
  const inner = makeSimpleCutProof();
  const rightProof = scIdentity(sequent([phi], [phi]));
  return scCut(inner, rightProof, phi, sequent([phi], [phi]));
}

function makeImplicationCutProof(): ScProofNode {
  // \u542B\u610F\u3092\u542B\u3080\u30AB\u30C3\u30C8
  const phiImplPsi = implication(phi, psi);
  // left: \u03C6 \u22A2 \u03C6 \u2192 \u03C8 (\u2192\u53F3\u898F\u5247: \u03C6, \u03C6 \u22A2 \u03C8 \u304B\u3089)
  // \u7C21\u7565\u5316: identity \u3067 \u03C6\u2192\u03C8 \u22A2 \u03C6\u2192\u03C8 \u3092\u4F7F\u3046
  const leftProof = scIdentity(sequent([phiImplPsi], [phiImplPsi]));
  const rightProof = scIdentity(sequent([phiImplPsi], [phiImplPsi]));
  return scCut(
    leftProof,
    rightProof,
    phiImplPsi,
    sequent([phiImplPsi], [phiImplPsi]),
  );
}

// --- \u30E9\u30C3\u30D1\u30FC\u30B3\u30F3\u30DD\u30FC\u30CD\u30F3\u30C8 ---

function StepperWrapper({
  proof,
  options,
}: {
  readonly proof: ScProofNode;
  readonly options?: CutEliminationOptions;
}) {
  const [stepIndex, setStepIndex] = useState(-1);

  const baseData = computeCutEliminationStepperData(proof, options);
  const { steps } = eliminateCutsWithSteps(proof, options);
  const data = resolveStepperState(baseData, stepIndex, proof, steps);

  const handleStepChange = useCallback((index: number) => {
    setStepIndex(index);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: 500,
        height: 300,
        background: "#f5f3ed",
        border: "1px solid #ccc",
        borderRadius: 8,
      }}
    >
      <CutEliminationStepper
        data={data}
        onStepChange={handleStepChange}
        messages={defaultProofMessages}
        testId="stepper"
      />
    </div>
  );
}

// --- Storybook ---

const meta: Meta<typeof CutEliminationStepper> = {
  title: "proof-pad/CutEliminationStepper",
  component: CutEliminationStepper,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof CutEliminationStepper>;

export const CutFree: Story = {
  render: () => <StepperWrapper proof={makeIdentityProof()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stepper = canvas.getByTestId("stepper");
    await expect(stepper).toBeInTheDocument();
    // \u30AB\u30C3\u30C8\u30D5\u30EA\u30FC\u306E\u30E9\u30D9\u30EB\u304C\u8868\u793A\u3055\u308C\u308B
    await expect(canvas.getByText("Cut-free")).toBeInTheDocument();
    await expect(
      canvas.getByText("Proof is already cut-free"),
    ).toBeInTheDocument();
  },
};

export const SimpleCut: Story = {
  render: () => <StepperWrapper proof={makeSimpleCutProof()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stepper = canvas.getByTestId("stepper");
    await expect(stepper).toBeInTheDocument();
    // \u521D\u671F\u72B6\u614B
    await expect(canvas.getByTestId("stepper-progress")).toHaveTextContent(
      "Initial proof",
    );
    // next\u30DC\u30BF\u30F3\u3092\u30AF\u30EA\u30C3\u30AF
    const user = userEvent.setup();
    await user.click(canvas.getByTestId("stepper-next"));
    // \u30B9\u30C6\u30C3\u30D7\u304C\u9032\u3093\u3060
    await expect(canvas.getByTestId("stepper-progress")).toHaveTextContent(
      /Step/,
    );
  },
};

export const Rank0Cut: Story = {
  render: () => <StepperWrapper proof={makeRank0CutProof()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("stepper")).toBeInTheDocument();
    // last\u30DC\u30BF\u30F3\u3067\u6700\u5F8C\u307E\u3067\u30B9\u30AD\u30C3\u30D7
    const user = userEvent.setup();
    await user.click(canvas.getByTestId("stepper-last"));
    // \u6210\u529F\u7D50\u679C\u304C\u8868\u793A\u3055\u308C\u308B
    await expect(canvas.getByTestId("stepper-result")).toHaveTextContent(
      "Cut elimination succeeded",
    );
  },
};

export const NestedCut: Story = {
  render: () => <StepperWrapper proof={makeNestedCutProof()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("stepper")).toBeInTheDocument();
    // \u30B9\u30C6\u30C3\u30D7\u3092\u6700\u5F8C\u307E\u3067\u9032\u3081\u3066\u6210\u529F\u3092\u78BA\u8A8D
    const user = userEvent.setup();
    await user.click(canvas.getByTestId("stepper-last"));
    await expect(canvas.getByTestId("stepper-result")).toHaveTextContent(
      "Cut elimination succeeded",
    );
  },
};

export const StepNavigation: Story = {
  render: () => <StepperWrapper proof={makeSimpleCutProof()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // next\u2192prev\u3067\u521D\u671F\u72B6\u614B\u306B\u623B\u308B
    await user.click(canvas.getByTestId("stepper-next"));
    await expect(canvas.getByTestId("stepper-progress")).toHaveTextContent(
      /Step/,
    );
    await user.click(canvas.getByTestId("stepper-first"));
    await expect(canvas.getByTestId("stepper-progress")).toHaveTextContent(
      "Initial proof",
    );
  },
};

export const ImplicationCut: Story = {
  render: () => <StepperWrapper proof={makeImplicationCutProof()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("stepper")).toBeInTheDocument();
    // \u542B\u610F\u3092\u542B\u3080\u30AB\u30C3\u30C8\u3082\u9664\u53BB\u3067\u304D\u308B
    const user = userEvent.setup();
    await user.click(canvas.getByTestId("stepper-last"));
    await expect(canvas.getByTestId("stepper-result")).toHaveTextContent(
      "Cut elimination succeeded",
    );
  },
};

export const StepLimitExceeded: Story = {
  render: () => (
    <StepperWrapper proof={makeNestedCutProof()} options={{ maxSteps: 1 }} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("stepper")).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(canvas.getByTestId("stepper-last"));
    await expect(canvas.getByTestId("stepper-result")).toHaveTextContent(
      /Step limit exceeded/,
    );
  },
};
