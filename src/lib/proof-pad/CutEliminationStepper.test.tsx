import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CutEliminationStepper } from "./CutEliminationStepper";
import type { CutEliminationStepperData } from "./cutEliminationStepperLogic";
import {
  computeCutEliminationStepperData,
  resolveStepperState,
} from "./cutEliminationStepperLogic";
import { defaultProofMessages } from "./proofMessages";
import { eliminateCutsWithSteps } from "../logic-core/cutElimination";
import { sequent, scIdentity, scCut } from "../logic-core/sequentCalculus";
import { metaVariable } from "../logic-core/formula";

// --- テスト用ヘルパー ---

const phi = metaVariable("\u03C6");

function makeIdentityProof() {
  return scIdentity(sequent([phi], [phi]));
}

function makeSimpleCutProof() {
  const leftProof = scIdentity(sequent([phi], [phi]));
  const rightProof = scIdentity(sequent([phi], [phi]));
  return scCut(leftProof, rightProof, phi, sequent([phi], [phi]));
}

function makeCutStepperData(stepIndex: number): CutEliminationStepperData {
  const proof = makeSimpleCutProof();
  const baseData = computeCutEliminationStepperData(proof);
  const { steps } = eliminateCutsWithSteps(proof);
  return resolveStepperState(baseData, stepIndex, proof, steps);
}

function makeCutFreeStepperData(): CutEliminationStepperData {
  const proof = makeIdentityProof();
  const baseData = computeCutEliminationStepperData(proof);
  const { steps } = eliminateCutsWithSteps(proof);
  return resolveStepperState(baseData, -1, proof, steps);
}

// --- テスト ---

describe("CutEliminationStepper", () => {
  describe("\u30AB\u30C3\u30C8\u30D5\u30EA\u30FC\u8A3C\u660E", () => {
    it("\u30AB\u30C3\u30C8\u30D5\u30EA\u30FC\u30E9\u30D9\u30EB\u3092\u8868\u793A\u3059\u308B", () => {
      const data = makeCutFreeStepperData();
      render(
        <CutEliminationStepper
          data={data}
          onStepChange={() => {}}
          messages={defaultProofMessages}
          testId="stepper"
        />,
      );

      expect(
        screen.getByText(defaultProofMessages.cutEliminationCutFree),
      ).toBeInTheDocument();
    });

    it("\u30B3\u30F3\u30C8\u30ED\u30FC\u30EB\u30DC\u30BF\u30F3\u304C\u8868\u793A\u3055\u308C\u306A\u3044", () => {
      const data = makeCutFreeStepperData();
      render(
        <CutEliminationStepper
          data={data}
          onStepChange={() => {}}
          messages={defaultProofMessages}
          testId="stepper"
        />,
      );

      expect(screen.queryByTestId("stepper-next")).not.toBeInTheDocument();
      expect(screen.queryByTestId("stepper-prev")).not.toBeInTheDocument();
    });

    it("\u300C\u30AB\u30C3\u30C8\u306A\u3057\u300D\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u8868\u793A\u3059\u308B", () => {
      const data = makeCutFreeStepperData();
      render(
        <CutEliminationStepper
          data={data}
          onStepChange={() => {}}
          messages={defaultProofMessages}
          testId="stepper"
        />,
      );

      expect(
        screen.getByText(defaultProofMessages.cutEliminationNoCuts),
      ).toBeInTheDocument();
    });
  });

  describe("\u30AB\u30C3\u30C8\u3042\u308A\u8A3C\u660E", () => {
    it("\u521D\u671F\u72B6\u614B\u3067\u30B3\u30F3\u30C8\u30ED\u30FC\u30EB\u304C\u8868\u793A\u3055\u308C\u308B", () => {
      const data = makeCutStepperData(-1);
      render(
        <CutEliminationStepper
          data={data}
          onStepChange={() => {}}
          messages={defaultProofMessages}
          testId="stepper"
        />,
      );

      expect(screen.getByTestId("stepper-next")).toBeInTheDocument();
      expect(screen.getByTestId("stepper-prev")).toBeInTheDocument();
      expect(screen.getByTestId("stepper-first")).toBeInTheDocument();
      expect(screen.getByTestId("stepper-last")).toBeInTheDocument();
    });

    it("\u521D\u671F\u72B6\u614B\u3067prev\u304Cdisabled", () => {
      const data = makeCutStepperData(-1);
      render(
        <CutEliminationStepper
          data={data}
          onStepChange={() => {}}
          messages={defaultProofMessages}
          testId="stepper"
        />,
      );

      expect(screen.getByTestId("stepper-prev")).toBeDisabled();
      expect(screen.getByTestId("stepper-first")).toBeDisabled();
    });

    it("next\u30AF\u30EA\u30C3\u30AF\u3067onStepChange\u304C\u547C\u3070\u308C\u308B", async () => {
      const user = userEvent.setup();
      const onStepChange = vi.fn();
      const data = makeCutStepperData(-1);

      render(
        <CutEliminationStepper
          data={data}
          onStepChange={onStepChange}
          messages={defaultProofMessages}
          testId="stepper"
        />,
      );

      await user.click(screen.getByTestId("stepper-next"));
      expect(onStepChange).toHaveBeenCalledWith(0);
    });

    it("prev\u30AF\u30EA\u30C3\u30AF\u3067onStepChange\u304C\u547C\u3070\u308C\u308B", async () => {
      const user = userEvent.setup();
      const onStepChange = vi.fn();
      const data = makeCutStepperData(0);

      render(
        <CutEliminationStepper
          data={data}
          onStepChange={onStepChange}
          messages={defaultProofMessages}
          testId="stepper"
        />,
      );

      await user.click(screen.getByTestId("stepper-prev"));
      expect(onStepChange).toHaveBeenCalledWith(-1);
    });

    it("first\u30AF\u30EA\u30C3\u30AF\u3067-1\u304C\u547C\u3070\u308C\u308B", async () => {
      const user = userEvent.setup();
      const onStepChange = vi.fn();
      const data = makeCutStepperData(2);

      render(
        <CutEliminationStepper
          data={data}
          onStepChange={onStepChange}
          messages={defaultProofMessages}
          testId="stepper"
        />,
      );

      await user.click(screen.getByTestId("stepper-first"));
      expect(onStepChange).toHaveBeenCalledWith(-1);
    });

    it("last\u30AF\u30EA\u30C3\u30AF\u3067\u6700\u5F8C\u306E\u30B9\u30C6\u30C3\u30D7\u304C\u547C\u3070\u308C\u308B", async () => {
      const user = userEvent.setup();
      const onStepChange = vi.fn();
      const data = makeCutStepperData(-1);

      render(
        <CutEliminationStepper
          data={data}
          onStepChange={onStepChange}
          messages={defaultProofMessages}
          testId="stepper"
        />,
      );

      await user.click(screen.getByTestId("stepper-last"));
      expect(onStepChange).toHaveBeenCalledWith(data.totalSteps - 1);
    });

    it("\u9032\u6357\u8868\u793A\u304C\u6B63\u3057\u3044", () => {
      const data = makeCutStepperData(-1);
      render(
        <CutEliminationStepper
          data={data}
          onStepChange={() => {}}
          messages={defaultProofMessages}
          testId="stepper"
        />,
      );

      expect(screen.getByTestId("stepper-progress")).toHaveTextContent(
        defaultProofMessages.cutEliminationInitialState,
      );
    });

    it("\u30B9\u30C6\u30C3\u30D70\u3067\u306F\u30B9\u30C6\u30C3\u30D7\u60C5\u5831\u304C\u8868\u793A\u3055\u308C\u308B", () => {
      const data = makeCutStepperData(0);
      render(
        <CutEliminationStepper
          data={data}
          onStepChange={() => {}}
          messages={defaultProofMessages}
          testId="stepper"
        />,
      );

      // ステップ情報（depth/rank）が表示される
      const progressEl = screen.getByTestId("stepper-progress");
      expect(progressEl.textContent).toContain("1");
    });

    it("\u6700\u5F8C\u306E\u30B9\u30C6\u30C3\u30D7\u3067\u7D50\u679C\u30B9\u30C6\u30FC\u30BF\u30B9\u304C\u8868\u793A\u3055\u308C\u308B", () => {
      const data = makeCutStepperData(999); // clampされて最後のステップへ
      render(
        <CutEliminationStepper
          data={data}
          onStepChange={() => {}}
          messages={defaultProofMessages}
          testId="stepper"
        />,
      );

      expect(screen.getByTestId("stepper-result")).toBeInTheDocument();
      expect(screen.getByTestId("stepper-result")).toHaveTextContent(
        defaultProofMessages.cutEliminationSuccess,
      );
    });

    it("\u6700\u5F8C\u306E\u30B9\u30C6\u30C3\u30D7\u3067next\u304Cdisabled", () => {
      const data = makeCutStepperData(999);
      render(
        <CutEliminationStepper
          data={data}
          onStepChange={() => {}}
          messages={defaultProofMessages}
          testId="stepper"
        />,
      );

      expect(screen.getByTestId("stepper-next")).toBeDisabled();
      expect(screen.getByTestId("stepper-last")).toBeDisabled();
    });
  });

  describe("data-testid", () => {
    it("testId\u304C\u3042\u308B\u5834\u5408\u306Fdata-testid\u304C\u8A2D\u5B9A\u3055\u308C\u308B", () => {
      const data = makeCutStepperData(-1);
      render(
        <CutEliminationStepper
          data={data}
          onStepChange={() => {}}
          messages={defaultProofMessages}
          testId="stepper"
        />,
      );

      expect(screen.getByTestId("stepper")).toBeInTheDocument();
    });

    it("testId\u304C\u306A\u3044\u5834\u5408\u3082\u30EC\u30F3\u30C0\u30EA\u30F3\u30B0\u3055\u308C\u308B", () => {
      const data = makeCutStepperData(-1);
      const { container } = render(
        <CutEliminationStepper
          data={data}
          onStepChange={() => {}}
          messages={defaultProofMessages}
        />,
      );

      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("\u30AF\u30EA\u30C3\u30AF\u4F1D\u64AD\u505C\u6B62", () => {
    it("click\u304CstopPropagation\u3055\u308C\u308B", async () => {
      const user = userEvent.setup();
      const outerClick = vi.fn();
      const data = makeCutStepperData(-1);

      render(
        <div onClick={outerClick} role="presentation">
          <CutEliminationStepper
            data={data}
            onStepChange={() => {}}
            messages={defaultProofMessages}
            testId="stepper"
          />
        </div>,
      );

      await user.click(screen.getByTestId("stepper"));
      expect(outerClick).not.toHaveBeenCalled();
    });
  });
});
