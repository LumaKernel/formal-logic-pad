import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GoalPanel } from "./GoalPanel";
import type { GoalPanelData } from "./goalPanelLogic";
import { defaultProofMessages } from "./proofMessages";

// --- ヘルパー ---

const msg = defaultProofMessages;

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
            label: "Goal: φ → φ",
            allowedAxiomIds: undefined,
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
    it("各ゴールのラベルとDSLテキストが表示される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            label: "Goal: φ → φ",
            allowedAxiomIds: undefined,
            status: "not-achieved",
          },
          {
            id: "g2",
            formulaText: "psi -> psi",
            label: undefined,
            allowedAxiomIds: undefined,
            status: "achieved",
          },
        ],
        achievedCount: 1,
        totalCount: 2,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);

      expect(screen.getByText("Goal: φ → φ")).toBeInTheDocument();
      expect(screen.getByText("phi -> phi")).toBeInTheDocument();
      // ラベルなしの場合は #2 が表示される
      expect(screen.getByText("#2")).toBeInTheDocument();
      expect(screen.getByText("psi -> psi")).toBeInTheDocument();
    });

    it("達成済みゴールは「Proved!」と表示される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            label: "Goal 1",
            allowedAxiomIds: undefined,
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
            label: "Goal 1",
            allowedAxiomIds: undefined,
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
            label: "Goal 1",
            allowedAxiomIds: undefined,
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
    it("allowedAxiomIdsがある場合は表示される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            label: "Goal 1",
            allowedAxiomIds: ["A1", "A2"],
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);
      expect(screen.getByText("Allowed axioms: A1, A2")).toBeInTheDocument();
    });

    it("allowedAxiomIdsがundefinedの場合は公理制限が表示されない", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            label: "Goal 1",
            allowedAxiomIds: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);
      expect(screen.queryByText(/Allowed axioms/u)).not.toBeInTheDocument();
    });
  });

  describe("進捗表示", () => {
    it("達成数/総数が表示される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            label: "Goal 1",
            allowedAxiomIds: undefined,
            status: "achieved",
          },
          {
            id: "g2",
            formulaText: "psi -> psi",
            label: "Goal 2",
            allowedAxiomIds: undefined,
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
            label: "Goal 1",
            allowedAxiomIds: undefined,
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
            label: "Goal 1",
            allowedAxiomIds: undefined,
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
            label: "Goal 1",
            allowedAxiomIds: undefined,
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
            label: "Goal 1",
            allowedAxiomIds: undefined,
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
            label: "Goal 1",
            allowedAxiomIds: undefined,
            status: "not-achieved",
          },
          {
            id: "g2",
            formulaText: "psi -> psi",
            label: "Goal 2",
            allowedAxiomIds: undefined,
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
