import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Either } from "effect";
import { GoalPanel } from "./GoalPanel";
import type { GoalPanelData } from "./goalPanelLogic";
import { defaultProofMessages } from "./proofMessages";
import { parseString } from "../logic-lang/parser";
import type { Formula } from "../logic-core/formula";

// --- ヘルパー ---

const msg = defaultProofMessages;

function parseFormula(text: string): Formula {
  const result = parseString(text);
  if (Either.isLeft(result))
    throw new Error(`Parse failed: ${text satisfies string}`);
  return result.right;
}

const phiImpliesPhi = parseFormula("phi -> phi");
const psiImpliesPsi = parseFormula("psi -> psi");
const a1Template = parseFormula("phi -> (psi -> phi)");
const a2Template = parseFormula(
  "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
);

function makeData(overrides?: Partial<GoalPanelData>): GoalPanelData {
  return {
    items: [],
    achievedCount: 0,
    totalCount: 0,
    ...overrides,
  };
}

// --- テスト ---

describe("GoalPanel", () => {
  describe("表示/非表示", () => {
    it("ゴールが空の場合は何も表示しない", () => {
      const { container } = render(
        <GoalPanel data={makeData()} messages={msg} testId="gp" />,
      );
      expect(container.innerHTML).toBe("");
    });

    it("ゴールがある場合はパネルが表示される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal: φ → φ",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);
      expect(screen.getByTestId("gp")).toBeInTheDocument();
    });
  });

  describe("ゴール一覧の表示", () => {
    it("パース済み数式はFormulaDisplayでレンダリングされる", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal: φ → φ",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            status: "not-achieved",
          },
          {
            id: "g2",
            formulaText: "psi -> psi",
            formula: psiImpliesPsi,
            label: undefined,
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            status: "achieved",
          },
        ],
        achievedCount: 1,
        totalCount: 2,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);

      expect(screen.getByText("Goal: φ → φ")).toBeInTheDocument();
      // FormulaDisplay renders with role="math" and aria-label
      const mathEls = screen.getAllByRole("math");
      expect(mathEls).toHaveLength(2);
      expect(mathEls[0]).toHaveAttribute("aria-label", "φ → φ");
      expect(mathEls[1]).toHaveAttribute("aria-label", "ψ → ψ");
      // ラベルなしの場合は #2 が表示される
      expect(screen.getByText("#2")).toBeInTheDocument();
    });

    it("パースエラー時はプレーンテキストにフォールバックする", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "invalid !!!",
            formula: undefined,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            status: "parse-error",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);
      expect(screen.getByText("invalid !!!")).toBeInTheDocument();
      expect(screen.queryByRole("math")).not.toBeInTheDocument();
    });

    it("達成済みゴールは「Proved!」と表示される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            status: "achieved",
          },
        ],
        achievedCount: 1,
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);
      expect(screen.getByText(msg.goalProved)).toBeInTheDocument();
    });

    it("未達成ゴールは「Not yet」と表示される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);
      expect(screen.getByText(msg.goalNotYet)).toBeInTheDocument();
    });

    it("パースエラーのゴールは「Invalid formula」と表示される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "invalid !!!",
            formula: undefined,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            status: "parse-error",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);
      expect(screen.getByText(msg.goalInvalidFormula)).toBeInTheDocument();
    });
  });

  describe("公理制限の表示", () => {
    it("allowedAxiomDetailsがある場合は公理名と数式が表示される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: ["A1", "A2"],
            allowedAxiomDetails: [
              {
                id: "A1",
                displayName: "A1 (K)",
                formula: a1Template,
              },
              {
                id: "A2",
                displayName: "A2 (S)",
                formula: a2Template,
              },
            ],
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);
      expect(screen.getByText("Allowed axioms: A1, A2")).toBeInTheDocument();
      expect(screen.getByText("A1 (K):")).toBeInTheDocument();
      expect(screen.getByText("A2 (S):")).toBeInTheDocument();
      // 公理数式はrole="math"で表示される（ゴール自体の数式 + 公理2つ = 3つ）
      const mathEls = screen.getAllByRole("math");
      expect(mathEls).toHaveLength(3);
    });

    it("allowedAxiomDetailsがundefinedの場合は公理制限が表示されない", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);
      expect(screen.queryByText(/Allowed axioms/u)).not.toBeInTheDocument();
    });

    it("allowedAxiomIdsがありdetailsが空の場合はIDのみフォールバック表示", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: ["UNKNOWN"],
            allowedAxiomDetails: [],
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);
      expect(screen.getByText("Allowed axioms: UNKNOWN")).toBeInTheDocument();
    });
  });

  describe("進捗表示", () => {
    it("達成数/総数が表示される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            status: "achieved",
          },
          {
            id: "g2",
            formulaText: "psi -> psi",
            formula: psiImpliesPsi,
            label: "Goal 2",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        achievedCount: 1,
        totalCount: 2,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });
  });

  describe("折りたたみ", () => {
    it("閉じるボタンで折りたためる", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);

      // パネルが表示されている
      expect(screen.getByTestId("gp")).toBeInTheDocument();

      // 折りたたみボタンをクリック
      fireEvent.click(screen.getByTestId("gp-collapse"));

      // パネルが折りたたまれてトグルボタンが表示される
      expect(screen.queryByTestId("gp")).not.toBeInTheDocument();
      expect(screen.getByTestId("gp-toggle")).toBeInTheDocument();
    });

    it("トグルボタンで展開できる", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);

      // 折りたたむ
      fireEvent.click(screen.getByTestId("gp-collapse"));
      expect(screen.getByTestId("gp-toggle")).toBeInTheDocument();

      // 展開する
      fireEvent.click(screen.getByTestId("gp-toggle"));
      expect(screen.getByTestId("gp")).toBeInTheDocument();
    });

    it("キーボードでも折りたたみ可能", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);

      // Enter キーで折りたたむ
      fireEvent.keyDown(screen.getByTestId("gp-collapse"), { key: "Enter" });
      expect(screen.getByTestId("gp-toggle")).toBeInTheDocument();

      // Space キーで展開する
      fireEvent.keyDown(screen.getByTestId("gp-toggle"), { key: " " });
      expect(screen.getByTestId("gp")).toBeInTheDocument();
    });

    it("Enter/Space以外のキーでは折りたたみ状態が変わらない", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);

      // Tab キーではcollapseが発生しない
      fireEvent.keyDown(screen.getByTestId("gp-collapse"), { key: "Tab" });
      expect(screen.getByTestId("gp")).toBeInTheDocument();

      // 折りたたむ
      fireEvent.click(screen.getByTestId("gp-collapse"));
      expect(screen.getByTestId("gp-toggle")).toBeInTheDocument();

      // Escape キーではtoggleが発生しない
      fireEvent.keyDown(screen.getByTestId("gp-toggle"), { key: "Escape" });
      expect(screen.getByTestId("gp-toggle")).toBeInTheDocument();
    });
  });

  describe("testId", () => {
    it("各アイテムにtestIdが付与される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            status: "not-achieved",
          },
          {
            id: "g2",
            formulaText: "psi -> psi",
            formula: psiImpliesPsi,
            label: "Goal 2",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            status: "achieved",
          },
        ],
        achievedCount: 1,
        totalCount: 2,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);
      expect(screen.getByTestId("gp-item-0")).toBeInTheDocument();
      expect(screen.getByTestId("gp-item-1")).toBeInTheDocument();
    });
  });
});
