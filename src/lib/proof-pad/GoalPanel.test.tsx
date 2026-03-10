import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Either } from "effect";
import { GoalPanel } from "./GoalPanel";
import type { GoalPanelData } from "./goalPanelLogic";
import { defaultProofMessages } from "./proofMessages";
import { parseString } from "../logic-lang/parser";
import type { Formula } from "../logic-core/formula";
import { allReferenceEntries } from "../reference/referenceContent";

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
            violatingAxiomDetails: undefined,
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
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
          {
            id: "g2",
            formulaText: "psi -> psi",
            formula: psiImpliesPsi,
            label: undefined,
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
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
            violatingAxiomDetails: undefined,
            status: "parse-error",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);
      expect(screen.getByText("invalid !!!")).toBeInTheDocument();
      // パースエラー時もフォールバックspan にrole="math"とaria-labelが付与される
      const fallbackEl = screen.getByRole("math");
      expect(fallbackEl).toBeInTheDocument();
      expect(fallbackEl).toHaveAttribute("aria-label", "invalid !!!");
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
            violatingAxiomDetails: undefined,
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
            violatingAxiomDetails: undefined,
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
            violatingAxiomDetails: undefined,
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
            violatingAxiomDetails: undefined,
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
            violatingAxiomDetails: undefined,
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
            violatingAxiomDetails: undefined,
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
            violatingAxiomDetails: undefined,
            status: "achieved",
          },
          {
            id: "g2",
            formulaText: "psi -> psi",
            formula: psiImpliesPsi,
            label: "Goal 2",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
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
            violatingAxiomDetails: undefined,
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
            violatingAxiomDetails: undefined,
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
            violatingAxiomDetails: undefined,
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
            violatingAxiomDetails: undefined,
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

  describe("折りたたみ状態でのドラッグ", () => {
    it("折りたたみ状態でonDragHandlePointerDownが呼ばれる", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      const onDragHandlePointerDown = vi.fn();
      render(
        <GoalPanel
          data={data}
          messages={msg}
          testId="gp"
          position={{ x: 100, y: 50 }}
          onDragHandlePointerDown={onDragHandlePointerDown}
        />,
      );

      // 折りたたむ
      fireEvent.click(screen.getByTestId("gp-collapse"));
      expect(screen.getByTestId("gp-toggle")).toBeInTheDocument();

      // 折りたたみボタンのpointerdownでドラッグハンドルが呼ばれる
      fireEvent.pointerDown(screen.getByTestId("gp-toggle"));
      expect(onDragHandlePointerDown).toHaveBeenCalledTimes(1);
    });

    it("wasDraggedRef.current=falseの場合はクリックでトグルされる", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      const wasDraggedRef = { current: false };
      render(
        <GoalPanel
          data={data}
          messages={msg}
          testId="gp"
          position={{ x: 100, y: 50 }}
          onDragHandlePointerDown={vi.fn()}
          wasDraggedRef={wasDraggedRef}
        />,
      );

      // 折りたたむ
      fireEvent.click(screen.getByTestId("gp-collapse"));
      expect(screen.getByTestId("gp-toggle")).toBeInTheDocument();

      // wasDraggedRef.current=falseなのでクリックでトグルされる
      fireEvent.click(screen.getByTestId("gp-toggle"));
      expect(screen.getByTestId("gp")).toBeInTheDocument();
    });

    it("wasDraggedRef.current=trueの場合はクリックでトグルされない", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      const wasDraggedRef = { current: true };
      render(
        <GoalPanel
          data={data}
          messages={msg}
          testId="gp"
          position={{ x: 100, y: 50 }}
          onDragHandlePointerDown={vi.fn()}
          wasDraggedRef={wasDraggedRef}
        />,
      );

      // 折りたたむ
      fireEvent.click(screen.getByTestId("gp-collapse"));
      expect(screen.getByTestId("gp-toggle")).toBeInTheDocument();

      // wasDraggedRef.current=trueなのでクリックでトグルされない（ドラッグ後のクリック）
      fireEvent.click(screen.getByTestId("gp-toggle"));
      expect(screen.getByTestId("gp-toggle")).toBeInTheDocument();
    });

    it("折りたたみ状態のカーソルがgrabになる", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      render(
        <GoalPanel
          data={data}
          messages={msg}
          testId="gp"
          position={{ x: 100, y: 50 }}
          onDragHandlePointerDown={vi.fn()}
        />,
      );

      // 折りたたむ
      fireEvent.click(screen.getByTestId("gp-collapse"));
      const toggle = screen.getByTestId("gp-toggle");
      expect(toggle.style.cursor).toBe("grab");
    });

    it("position未指定+ドラッグハンドルありでもカーソルがgrabになる", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      render(
        <GoalPanel
          data={data}
          messages={msg}
          testId="gp"
          onDragHandlePointerDown={vi.fn()}
        />,
      );

      // 折りたたむ
      fireEvent.click(screen.getByTestId("gp-collapse"));
      const toggle = screen.getByTestId("gp-toggle");
      expect(toggle.style.cursor).toBe("grab");
    });

    it("ドラッグハンドルなしの折りたたみカーソルがpointerになる", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);

      // 折りたたむ
      fireEvent.click(screen.getByTestId("gp-collapse"));
      const toggle = screen.getByTestId("gp-toggle");
      expect(toggle.style.cursor).toBe("pointer");
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
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
          {
            id: "g2",
            formulaText: "psi -> psi",
            formula: psiImpliesPsi,
            label: "Goal 2",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
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

  describe("制限違反の表示", () => {
    it("公理制限違反のゴールは「Axiom violation」と表示される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: ["A1"],
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
            status: "achieved-but-axiom-violation",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);
      expect(screen.getByText(msg.goalAxiomViolation)).toBeInTheDocument();
      expect(screen.queryByText(msg.goalProved)).not.toBeInTheDocument();
    });

    it("規則制限違反のゴールは「Rule violation」と表示される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
            status: "achieved-but-rule-violation",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);
      expect(screen.getByText(msg.goalRuleViolation)).toBeInTheDocument();
      expect(screen.queryByText(msg.goalProved)).not.toBeInTheDocument();
    });

    it("違反あり・達成済みが混在する場合、それぞれ正しく表示される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
            status: "achieved-but-axiom-violation",
          },
          {
            id: "g2",
            formulaText: "psi -> psi",
            formula: psiImpliesPsi,
            label: "Goal 2",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
            status: "achieved",
          },
        ],
        achievedCount: 1,
        totalCount: 2,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);
      expect(screen.getByText(msg.goalAxiomViolation)).toBeInTheDocument();
      expect(screen.getByText(msg.goalProved)).toBeInTheDocument();
    });

    it("violatingAxiomDetailsがある場合、違反公理名と数式がインライン表示される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: ["A1"],
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: [
              {
                id: "A2",
                displayName: "A2 (S)",
                formula: a2Template,
              },
            ],
            status: "achieved-but-axiom-violation",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);
      expect(screen.getByText("Violating axioms: A2")).toBeInTheDocument();
      expect(screen.getByText("A2 (S):")).toBeInTheDocument();
    });

    it("violatingAxiomDetailsがundefinedの場合、違反公理セクションは表示されない", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);
      expect(screen.queryByText(/Violating axioms/u)).not.toBeInTheDocument();
    });
  });

  describe("ゴール詳細パネル（questInfo付き）", () => {
    const questInfo = {
      description: "φ → φ を証明せよ。SKK = I の対応を体験する。",
      hints: [
        "A1とA2の具体的なインスタンスを組み合わせます。",
        "A1: φ → ((φ → φ) → φ) のインスタンスを作ってみましょう。",
      ],
      learningPoint:
        "A2 (S公理) は「関数適用の分配」に相当する。この証明はSKK = I の対応。",
    };

    it("questInfo付きの場合、クリックで詳細パネルが展開される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal: φ → φ",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
        questInfo,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);

      // 詳細パネルは初期状態では非表示
      expect(screen.queryByText(questInfo.description)).not.toBeInTheDocument();
      expect(
        screen.queryByText(msg.goalDetailDescription),
      ).not.toBeInTheDocument();

      // 展開インジケータ（▶）が表示される
      expect(screen.getByText("▶")).toBeInTheDocument();

      // ゴールアイテムをクリックして展開
      fireEvent.click(screen.getByTestId("gp-item-0"));

      // 詳細パネルが表示される
      expect(screen.getByText(questInfo.description)).toBeInTheDocument();
      expect(screen.getByText(msg.goalDetailDescription)).toBeInTheDocument();
      expect(screen.getByText(msg.goalDetailLearningPoint)).toBeInTheDocument();
      expect(screen.getByText(questInfo.learningPoint)).toBeInTheDocument();

      // 展開インジケータが▼に変わる
      expect(screen.getByText("▼")).toBeInTheDocument();
    });

    it("再クリックで詳細パネルが閉じる", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal: φ → φ",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
        questInfo,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);

      // 展開
      fireEvent.click(screen.getByTestId("gp-item-0"));
      expect(screen.getByText(questInfo.description)).toBeInTheDocument();

      // 再クリックで閉じる
      fireEvent.click(screen.getByTestId("gp-item-0"));
      expect(screen.queryByText(questInfo.description)).not.toBeInTheDocument();
    });

    it("ヒントは折り畳みで段階的に表示される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: undefined,
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
        questInfo,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);

      // 展開
      fireEvent.click(screen.getByTestId("gp-item-0"));

      // ヒントのトグルが表示される（ヒント本文はまだ非表示）
      expect(screen.getByTestId("gp-hint-toggle-0")).toBeInTheDocument();
      expect(screen.getByTestId("gp-hint-toggle-1")).toBeInTheDocument();
      expect(screen.queryByText(questInfo.hints[0]!)).not.toBeInTheDocument();

      // ヒント1を開く
      fireEvent.click(screen.getByTestId("gp-hint-toggle-0"));
      expect(screen.getByText(questInfo.hints[0]!)).toBeInTheDocument();
      // ヒント2はまだ非表示
      expect(screen.queryByText(questInfo.hints[1]!)).not.toBeInTheDocument();

      // ヒント2を開く
      fireEvent.click(screen.getByTestId("gp-hint-toggle-1"));
      expect(screen.getByText(questInfo.hints[1]!)).toBeInTheDocument();
    });

    it("questInfoなしの場合は展開インジケータが表示されない", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);

      // 展開インジケータは表示されない
      expect(screen.queryByText("▶")).not.toBeInTheDocument();
      expect(screen.queryByText("▼")).not.toBeInTheDocument();
    });

    it("詳細パネルに違反公理が警告色で表示される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: ["A1"],
            allowedAxiomDetails: [
              {
                id: "A1",
                displayName: "A1 (K)",
                formula: a1Template,
              },
            ],
            violatingAxiomDetails: [
              {
                id: "A2",
                displayName: "A2 (S)",
                formula: a2Template,
              },
            ],
            status: "achieved-but-axiom-violation",
          },
        ],
        totalCount: 1,
        questInfo,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);

      // 展開
      fireEvent.click(screen.getByTestId("gp-item-0"));

      // 違反公理セクションが詳細パネル内に表示される
      expect(screen.getByTestId("gp-violating-axioms")).toBeInTheDocument();
      expect(screen.getByText("Violating axioms: A2")).toBeInTheDocument();
      expect(screen.getByText("A2 (S):")).toBeInTheDocument();
    });

    it("詳細パネルで違反公理がない場合はセクションが表示されない", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: undefined,
            allowedAxiomDetails: undefined,
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
        questInfo,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);

      // 展開
      fireEvent.click(screen.getByTestId("gp-item-0"));

      // 違反公理セクションは非表示
      expect(
        screen.queryByTestId("gp-violating-axioms"),
      ).not.toBeInTheDocument();
    });

    it("詳細パネルに使用可能な公理が表示される", () => {
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
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
        questInfo,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);

      // 展開
      fireEvent.click(screen.getByTestId("gp-item-0"));

      // 公理情報が詳細パネル内に表示される
      expect(screen.getByText("A1 (K):")).toBeInTheDocument();
      expect(screen.getByText("A2 (S):")).toBeInTheDocument();
    });
  });

  describe("参照リンク（referenceEntries付き）", () => {
    const questInfo = {
      description: "φ → φ を証明せよ。",
      hints: [],
      learningPoint: "基本的な証明。",
    };

    it("referenceEntries指定時に公理の横に(?)ボタンが表示される", () => {
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
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
        questInfo,
      });
      render(
        <GoalPanel
          data={data}
          messages={msg}
          referenceEntries={allReferenceEntries}
          locale="ja"
          testId="gp"
        />,
      );

      // 展開
      fireEvent.click(screen.getByTestId("gp-item-0"));

      // 各公理の横に(?)ボタンが表示される
      expect(screen.getByTestId("gp-axiom-ref-A1")).toBeInTheDocument();
      expect(screen.getByTestId("gp-axiom-ref-A2")).toBeInTheDocument();
    });

    it("referenceEntries未指定時は(?)ボタンが表示されない", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: ["A1"],
            allowedAxiomDetails: [
              {
                id: "A1",
                displayName: "A1 (K)",
                formula: a1Template,
              },
            ],
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
        questInfo,
      });
      render(<GoalPanel data={data} messages={msg} testId="gp" />);

      // 展開
      fireEvent.click(screen.getByTestId("gp-item-0"));

      // (?)ボタンは非表示
      expect(screen.queryByTestId("gp-axiom-ref-A1")).not.toBeInTheDocument();
    });

    it("リファレンスエントリに該当しない公理IDの場合は(?)が表示されない", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: ["PA1"],
            allowedAxiomDetails: [
              {
                id: "PA1",
                displayName: "PA1",
                formula: a1Template,
              },
            ],
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
        questInfo,
      });
      render(
        <GoalPanel
          data={data}
          messages={msg}
          referenceEntries={allReferenceEntries}
          locale="ja"
          testId="gp"
        />,
      );

      // 展開
      fireEvent.click(screen.getByTestId("gp-item-0"));

      // PA1にはリファレンスエントリがないので(?)非表示
      expect(screen.queryByTestId("gp-axiom-ref-PA1")).not.toBeInTheDocument();
    });

    it("(?)ボタンクリックでポップオーバーが表示される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: ["A1"],
            allowedAxiomDetails: [
              {
                id: "A1",
                displayName: "A1 (K)",
                formula: a1Template,
              },
            ],
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
        questInfo,
      });
      render(
        <GoalPanel
          data={data}
          messages={msg}
          referenceEntries={allReferenceEntries}
          locale="ja"
          testId="gp"
        />,
      );

      // 展開
      fireEvent.click(screen.getByTestId("gp-item-0"));

      // (?)トリガーボタンをクリック
      fireEvent.click(screen.getByTestId("gp-axiom-ref-A1-trigger"));

      // ポップオーバーが表示される
      expect(screen.getByTestId("gp-axiom-ref-A1-popover")).toBeInTheDocument();
    });

    it("onOpenReferenceDetailが呼ばれる", () => {
      const handleDetail = vi.fn();
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: ["A1"],
            allowedAxiomDetails: [
              {
                id: "A1",
                displayName: "A1 (K)",
                formula: a1Template,
              },
            ],
            violatingAxiomDetails: undefined,
            status: "not-achieved",
          },
        ],
        totalCount: 1,
        questInfo,
      });
      render(
        <GoalPanel
          data={data}
          messages={msg}
          referenceEntries={allReferenceEntries}
          locale="ja"
          onOpenReferenceDetail={handleDetail}
          testId="gp"
        />,
      );

      // 展開
      fireEvent.click(screen.getByTestId("gp-item-0"));

      // (?)トリガーボタンをクリック
      fireEvent.click(screen.getByTestId("gp-axiom-ref-A1-trigger"));

      // ポップオーバーの「詳しく見る」ボタンをクリック
      const detailButton = screen.getByTestId("gp-axiom-ref-A1-detail-btn");
      fireEvent.click(detailButton);

      expect(handleDetail).toHaveBeenCalledWith("axiom-a1");
    });

    it("違反公理にもreferenceEntries指定時に(?)ボタンが表示される", () => {
      const data = makeData({
        items: [
          {
            id: "g1",
            formulaText: "phi -> phi",
            formula: phiImpliesPhi,
            label: "Goal 1",
            allowedAxiomIds: ["A1"],
            allowedAxiomDetails: [
              {
                id: "A1",
                displayName: "A1 (K)",
                formula: a1Template,
              },
            ],
            violatingAxiomDetails: [
              {
                id: "A2",
                displayName: "A2 (S)",
                formula: a2Template,
              },
            ],
            status: "achieved-but-axiom-violation",
          },
        ],
        totalCount: 1,
        questInfo,
      });
      render(
        <GoalPanel
          data={data}
          messages={msg}
          referenceEntries={allReferenceEntries}
          locale="ja"
          testId="gp"
        />,
      );

      // 展開
      fireEvent.click(screen.getByTestId("gp-item-0"));

      // 違反公理の(?)ボタンが表示される
      expect(screen.getByTestId("gp-violating-ref-A2")).toBeInTheDocument();
    });
  });
});
