import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScRulePalette } from "./ScRulePalette";
import { getAvailableScRules } from "./axiomPaletteLogic";
import { lkSystem, lmSystem } from "../logic-core/deductionSystem";

const lkRules = getAvailableScRules(lkSystem);
const lmRules = getAvailableScRules(lmSystem);

describe("ScRulePalette", () => {
  it("ヘッダーと推論規則一覧を表示する", () => {
    render(
      <ScRulePalette
        rules={lkRules}
        onAddSequent={() => {}}
        testId="palette"
      />,
    );
    expect(screen.getByText("Sequent Calculus")).toBeInTheDocument();
    expect(screen.getByText("Rules")).toBeInTheDocument();
    expect(screen.getByText("公理 (ID)")).toBeInTheDocument();
    expect(screen.getByText("カット (CUT)")).toBeInTheDocument();
  });

  it("LK全体系の19規則すべてが表示される", () => {
    render(
      <ScRulePalette
        rules={lkRules}
        onAddSequent={() => {}}
        testId="palette"
      />,
    );
    for (const rule of lkRules) {
      expect(
        screen.getByTestId(`palette-rule-${rule.id satisfies string}`),
      ).toBeInTheDocument();
    }
  });

  it("LM体系では⊥公理と右弱化が表示されない", () => {
    render(
      <ScRulePalette
        rules={lmRules}
        onAddSequent={() => {}}
        testId="palette"
      />,
    );
    expect(
      screen.queryByTestId("palette-rule-bottom-left"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("palette-rule-weakening-right"),
    ).not.toBeInTheDocument();
  });

  it("分岐規則に「分岐」バッジが表示される", () => {
    render(
      <ScRulePalette
        rules={lkRules}
        onAddSequent={() => {}}
        testId="palette"
      />,
    );
    const branchingRuleIds = [
      "cut",
      "implication-left",
      "conjunction-right",
      "disjunction-left",
    ];
    for (const ruleId of branchingRuleIds) {
      const ruleEl = screen.getByTestId(
        `palette-rule-${ruleId satisfies string}`,
      );
      expect(ruleEl.textContent).toContain("分岐");
    }
  });

  it("非分岐規則に「分岐」バッジが表示されない", () => {
    render(
      <ScRulePalette
        rules={lkRules}
        onAddSequent={() => {}}
        testId="palette"
      />,
    );
    const nonBranchingEl = screen.getByTestId("palette-rule-identity");
    expect(nonBranchingEl.textContent).not.toContain("分岐");
  });

  it("シーケント追加ボタンをクリックするとonAddSequentが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleAddSequent = vi.fn();
    render(
      <ScRulePalette
        rules={lkRules}
        onAddSequent={handleAddSequent}
        testId="palette"
      />,
    );
    await user.click(screen.getByTestId("palette-add-sequent"));
    expect(handleAddSequent).toHaveBeenCalledOnce();
  });

  it("シーケント追加ボタンはEnterキーでも動作する", async () => {
    const user = userEvent.setup();
    const handleAddSequent = vi.fn();
    render(
      <ScRulePalette
        rules={lkRules}
        onAddSequent={handleAddSequent}
        testId="palette"
      />,
    );
    const button = screen.getByTestId("palette-add-sequent");
    button.focus();
    await user.keyboard("{Enter}");
    expect(handleAddSequent).toHaveBeenCalledOnce();
  });

  it("シーケント追加ボタンはSpaceキーでも動作する", async () => {
    const user = userEvent.setup();
    const handleAddSequent = vi.fn();
    render(
      <ScRulePalette
        rules={lkRules}
        onAddSequent={handleAddSequent}
        testId="palette"
      />,
    );
    const button = screen.getByTestId("palette-add-sequent");
    button.focus();
    await user.keyboard(" ");
    expect(handleAddSequent).toHaveBeenCalledOnce();
  });

  it("空のルールリストではnullをレンダリングする", () => {
    const { container } = render(
      <ScRulePalette rules={[]} onAddSequent={() => {}} testId="palette" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("シーケント追加ボタンのホバーでスタイルが変化する", async () => {
    const user = userEvent.setup();
    render(
      <ScRulePalette
        rules={lkRules}
        onAddSequent={() => {}}
        testId="palette"
      />,
    );
    const button = screen.getByTestId("palette-add-sequent");
    await user.hover(button);
    await user.unhover(button);
    expect(button).toBeInTheDocument();
  });

  it("testIdが指定されない場合もレンダリングできる", () => {
    render(<ScRulePalette rules={lkRules} onAddSequent={() => {}} />);
    expect(screen.getByText("Sequent Calculus")).toBeInTheDocument();
  });

  it("規則クリックでonRuleClickが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleRuleClick = vi.fn();
    render(
      <ScRulePalette
        rules={lkRules}
        onAddSequent={() => {}}
        onRuleClick={handleRuleClick}
        testId="palette"
      />,
    );
    await user.click(screen.getByTestId("palette-rule-identity"));
    expect(handleRuleClick).toHaveBeenCalledOnce();
    expect(handleRuleClick).toHaveBeenCalledWith("identity");
  });

  it("規則のEnterキーでonRuleClickが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleRuleClick = vi.fn();
    render(
      <ScRulePalette
        rules={lkRules}
        onAddSequent={() => {}}
        onRuleClick={handleRuleClick}
        testId="palette"
      />,
    );
    const ruleEl = screen.getByTestId("palette-rule-identity");
    ruleEl.focus();
    await user.keyboard("{Enter}");
    expect(handleRuleClick).toHaveBeenCalledOnce();
    expect(handleRuleClick).toHaveBeenCalledWith("identity");
  });

  it("規則のSpaceキーでonRuleClickが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleRuleClick = vi.fn();
    render(
      <ScRulePalette
        rules={lkRules}
        onAddSequent={() => {}}
        onRuleClick={handleRuleClick}
        testId="palette"
      />,
    );
    const ruleEl = screen.getByTestId("palette-rule-identity");
    ruleEl.focus();
    await user.keyboard(" ");
    expect(handleRuleClick).toHaveBeenCalledOnce();
    expect(handleRuleClick).toHaveBeenCalledWith("identity");
  });

  it("selectedRuleIdで選択された規則のスタイルが変わる", () => {
    render(
      <ScRulePalette
        rules={lkRules}
        onAddSequent={() => {}}
        selectedRuleId="identity"
        testId="palette"
      />,
    );
    const selectedEl = screen.getByTestId("palette-rule-identity");
    expect(selectedEl.style.fontWeight).toBe("600");
    const nonSelectedEl = screen.getByTestId("palette-rule-cut");
    expect(nonSelectedEl.style.fontWeight).not.toBe("600");
  });

  it("onRuleClickなしでも規則はレンダリングされる", () => {
    render(
      <ScRulePalette
        rules={lkRules}
        onAddSequent={() => {}}
        testId="palette"
      />,
    );
    expect(screen.getByTestId("palette-rule-identity")).toBeInTheDocument();
  });

  it("規則アイテムのホバーでスタイルが変化する（非選択時）", async () => {
    const user = userEvent.setup();
    render(
      <ScRulePalette
        rules={lkRules}
        onAddSequent={() => {}}
        onRuleClick={() => {}}
        testId="palette"
      />,
    );
    const ruleEl = screen.getByTestId("palette-rule-identity");
    await user.hover(ruleEl);
    await user.unhover(ruleEl);
    expect(ruleEl).toBeInTheDocument();
  });

  it("選択中の規則アイテムのホバーでスタイルが変わらない", async () => {
    const user = userEvent.setup();
    render(
      <ScRulePalette
        rules={lkRules}
        onAddSequent={() => {}}
        selectedRuleId="identity"
        testId="palette"
      />,
    );
    const selectedEl = screen.getByTestId("palette-rule-identity");
    const bgBefore = selectedEl.style.background;
    await user.hover(selectedEl);
    expect(selectedEl.style.background).toBe(bgBefore);
    await user.unhover(selectedEl);
    expect(selectedEl.style.background).toBe(bgBefore);
  });
});
