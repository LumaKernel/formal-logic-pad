import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AtRulePalette } from "./AtRulePalette";
import { getAvailableAtRules } from "./axiomPaletteLogic";
import { atSystem, atPropSystem } from "../logic-core/deductionSystem";

const atRules = getAvailableAtRules(atSystem);
const atPropRules = getAvailableAtRules(atPropSystem);

describe("AtRulePalette", () => {
  it("ヘッダーと推論規則一覧を表示する", () => {
    render(
      <AtRulePalette
        rules={atRules}
        onAddFormula={() => {}}
        testId="palette"
      />,
    );
    expect(screen.getByText("Analytic Tableau")).toBeInTheDocument();
    expect(screen.getByText("T(∧)")).toBeInTheDocument();
    expect(screen.getByText("F(∨)")).toBeInTheDocument();
    expect(screen.getByText("×")).toBeInTheDocument();
  });

  it("AT全体系の15規則すべてが表示される", () => {
    render(
      <AtRulePalette
        rules={atRules}
        onAddFormula={() => {}}
        testId="palette"
      />,
    );
    for (const rule of atRules) {
      expect(
        screen.getByTestId(`palette-rule-${rule.id satisfies string}`),
      ).toBeInTheDocument();
    }
  });

  it("AT命題論理体系では量化子規則が表示されない", () => {
    render(
      <AtRulePalette
        rules={atPropRules}
        onAddFormula={() => {}}
        testId="palette"
      />,
    );
    expect(
      screen.queryByTestId("palette-rule-gamma-univ"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("palette-rule-gamma-neg-exist"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("palette-rule-delta-neg-univ"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("palette-rule-delta-exist"),
    ).not.toBeInTheDocument();
  });

  it("β規則に「分岐」バッジが表示される", () => {
    render(
      <AtRulePalette
        rules={atRules}
        onAddFormula={() => {}}
        testId="palette"
      />,
    );
    const branchingRuleIds = ["beta-neg-conj", "beta-disj", "beta-impl"];
    for (const ruleId of branchingRuleIds) {
      const ruleEl = screen.getByTestId(
        `palette-rule-${ruleId satisfies string}`,
      );
      expect(ruleEl.textContent).toContain("分岐");
    }
  });

  it("α規則に「分岐」バッジが表示されない", () => {
    render(
      <AtRulePalette
        rules={atRules}
        onAddFormula={() => {}}
        testId="palette"
      />,
    );
    const nonBranchingEl = screen.getByTestId("palette-rule-alpha-conj");
    expect(nonBranchingEl.textContent).not.toContain("分岐");
  });

  it("署名付き論理式追加ボタンをクリックするとonAddFormulaが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleAddFormula = vi.fn();
    render(
      <AtRulePalette
        rules={atRules}
        onAddFormula={handleAddFormula}
        testId="palette"
      />,
    );
    await user.click(screen.getByTestId("palette-add-formula"));
    expect(handleAddFormula).toHaveBeenCalledOnce();
  });

  it("署名付き論理式追加ボタンはEnterキーでも動作する", async () => {
    const user = userEvent.setup();
    const handleAddFormula = vi.fn();
    render(
      <AtRulePalette
        rules={atRules}
        onAddFormula={handleAddFormula}
        testId="palette"
      />,
    );
    const button = screen.getByTestId("palette-add-formula");
    button.focus();
    await user.keyboard("{Enter}");
    expect(handleAddFormula).toHaveBeenCalledOnce();
  });

  it("署名付き論理式追加ボタンはSpaceキーでも動作する", async () => {
    const user = userEvent.setup();
    const handleAddFormula = vi.fn();
    render(
      <AtRulePalette
        rules={atRules}
        onAddFormula={handleAddFormula}
        testId="palette"
      />,
    );
    const button = screen.getByTestId("palette-add-formula");
    button.focus();
    await user.keyboard(" ");
    expect(handleAddFormula).toHaveBeenCalledOnce();
  });

  it("空のルールリストではnullをレンダリングする", () => {
    const { container } = render(
      <AtRulePalette rules={[]} onAddFormula={() => {}} testId="palette" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("署名付き論理式追加ボタンのホバーでスタイルが変化する", async () => {
    const user = userEvent.setup();
    render(
      <AtRulePalette
        rules={atRules}
        onAddFormula={() => {}}
        testId="palette"
      />,
    );
    const button = screen.getByTestId("palette-add-formula");
    await user.hover(button);
    await user.unhover(button);
    expect(button).toBeInTheDocument();
  });

  it("testIdが指定されない場合もレンダリングできる", () => {
    render(<AtRulePalette rules={atRules} onAddFormula={() => {}} />);
    expect(screen.getByText("Analytic Tableau")).toBeInTheDocument();
  });

  it("規則クリックでonRuleClickが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleRuleClick = vi.fn();
    render(
      <AtRulePalette
        rules={atRules}
        onAddFormula={() => {}}
        onRuleClick={handleRuleClick}
        testId="palette"
      />,
    );
    await user.click(screen.getByTestId("palette-rule-alpha-conj"));
    expect(handleRuleClick).toHaveBeenCalledOnce();
    expect(handleRuleClick).toHaveBeenCalledWith("alpha-conj");
  });

  it("規則のEnterキーでonRuleClickが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleRuleClick = vi.fn();
    render(
      <AtRulePalette
        rules={atRules}
        onAddFormula={() => {}}
        onRuleClick={handleRuleClick}
        testId="palette"
      />,
    );
    const ruleEl = screen.getByTestId("palette-rule-alpha-conj");
    ruleEl.focus();
    await user.keyboard("{Enter}");
    expect(handleRuleClick).toHaveBeenCalledOnce();
    expect(handleRuleClick).toHaveBeenCalledWith("alpha-conj");
  });

  it("規則のSpaceキーでonRuleClickが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleRuleClick = vi.fn();
    render(
      <AtRulePalette
        rules={atRules}
        onAddFormula={() => {}}
        onRuleClick={handleRuleClick}
        testId="palette"
      />,
    );
    const ruleEl = screen.getByTestId("palette-rule-alpha-conj");
    ruleEl.focus();
    await user.keyboard(" ");
    expect(handleRuleClick).toHaveBeenCalledOnce();
    expect(handleRuleClick).toHaveBeenCalledWith("alpha-conj");
  });

  it("selectedRuleIdで選択された規則のスタイルが変わる", () => {
    render(
      <AtRulePalette
        rules={atRules}
        onAddFormula={() => {}}
        selectedRuleId="alpha-conj"
        testId="palette"
      />,
    );
    const selectedEl = screen.getByTestId("palette-rule-alpha-conj");
    expect(selectedEl.style.fontWeight).toBe("600");
    const nonSelectedEl = screen.getByTestId("palette-rule-beta-disj");
    expect(nonSelectedEl.style.fontWeight).not.toBe("600");
  });

  it("onRuleClickなしでも規則はレンダリングされる", () => {
    render(
      <AtRulePalette
        rules={atRules}
        onAddFormula={() => {}}
        testId="palette"
      />,
    );
    expect(screen.getByTestId("palette-rule-alpha-conj")).toBeInTheDocument();
  });

  it("規則アイテムのホバーでスタイルが変化する（非選択時）", async () => {
    const user = userEvent.setup();
    render(
      <AtRulePalette
        rules={atRules}
        onAddFormula={() => {}}
        onRuleClick={() => {}}
        testId="palette"
      />,
    );
    const ruleEl = screen.getByTestId("palette-rule-alpha-conj");
    await user.hover(ruleEl);
    await user.unhover(ruleEl);
    expect(ruleEl).toBeInTheDocument();
  });

  it("選択中の規則アイテムのホバーでスタイルが変わらない", async () => {
    const user = userEvent.setup();
    render(
      <AtRulePalette
        rules={atRules}
        onAddFormula={() => {}}
        selectedRuleId="alpha-conj"
        testId="palette"
      />,
    );
    const selectedEl = screen.getByTestId("palette-rule-alpha-conj");
    const bgBefore = selectedEl.style.background;
    await user.hover(selectedEl);
    expect(selectedEl.style.background).toBe(bgBefore);
    await user.unhover(selectedEl);
    expect(selectedEl.style.background).toBe(bgBefore);
  });

  it("セクションヘッダーが正しく表示される", () => {
    render(
      <AtRulePalette
        rules={atRules}
        onAddFormula={() => {}}
        testId="palette"
      />,
    );
    expect(screen.getByText("α (non-branching)")).toBeInTheDocument();
    expect(screen.getByText("β (branching)")).toBeInTheDocument();
    expect(screen.getByText("γ/δ (quantifiers)")).toBeInTheDocument();
    expect(screen.getByText("Closure")).toBeInTheDocument();
  });

  it("命題論理体系ではγ/δセクションが表示されない", () => {
    render(
      <AtRulePalette
        rules={atPropRules}
        onAddFormula={() => {}}
        testId="palette"
      />,
    );
    expect(screen.getByText("α (non-branching)")).toBeInTheDocument();
    expect(screen.getByText("β (branching)")).toBeInTheDocument();
    expect(screen.queryByText("γ/δ (quantifiers)")).not.toBeInTheDocument();
    expect(screen.getByText("Closure")).toBeInTheDocument();
  });
});
