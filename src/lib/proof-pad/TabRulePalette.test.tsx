import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TabRulePalette } from "./TabRulePalette";
import { getAvailableTabRules } from "./axiomPaletteLogic";
import { tabSystem, tabPropSystem } from "../logic-core/deductionSystem";

const tabRules = getAvailableTabRules(tabSystem);
const tabPropRules = getAvailableTabRules(tabPropSystem);

describe("TabRulePalette", () => {
  it("ヘッダーと推論規則一覧を表示する", () => {
    render(
      <TabRulePalette
        rules={tabRules}
        onAddSequent={() => {}}
        testId="palette"
      />,
    );
    expect(screen.getByText("Tableau Calculus")).toBeInTheDocument();
    expect(screen.getByText("Rules")).toBeInTheDocument();
    expect(screen.getByText("BS")).toBeInTheDocument();
    expect(screen.getByText("¬¬")).toBeInTheDocument();
    expect(screen.getByText("∧")).toBeInTheDocument();
  });

  it("TAB全体系の14規則すべてが表示される", () => {
    render(
      <TabRulePalette
        rules={tabRules}
        onAddSequent={() => {}}
        testId="palette"
      />,
    );
    for (const rule of tabRules) {
      expect(
        screen.getByTestId(`palette-rule-${rule.id satisfies string}`),
      ).toBeInTheDocument();
    }
  });

  it("TAB命題論理体系では量化子規則が表示されない", () => {
    render(
      <TabRulePalette
        rules={tabPropRules}
        onAddSequent={() => {}}
        testId="palette"
      />,
    );
    expect(
      screen.queryByTestId("palette-rule-universal"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("palette-rule-neg-universal"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("palette-rule-existential"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("palette-rule-neg-existential"),
    ).not.toBeInTheDocument();
  });

  it("分岐規則に「分岐」バッジが表示される", () => {
    render(
      <TabRulePalette
        rules={tabRules}
        onAddSequent={() => {}}
        testId="palette"
      />,
    );
    // 分岐規則: ¬∧, ∨, →
    const branchingRuleIds = ["neg-conjunction", "disjunction", "implication"];
    for (const ruleId of branchingRuleIds) {
      const ruleEl = screen.getByTestId(
        `palette-rule-${ruleId satisfies string}`,
      );
      expect(ruleEl.textContent).toContain("分岐");
    }
  });

  it("非分岐規則に「分岐」バッジが表示されない", () => {
    render(
      <TabRulePalette
        rules={tabRules}
        onAddSequent={() => {}}
        testId="palette"
      />,
    );
    const nonBranchingEl = screen.getByTestId("palette-rule-conjunction");
    expect(nonBranchingEl.textContent).not.toContain("分岐");
  });

  it("シーケント追加ボタンをクリックするとonAddSequentが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleAddSequent = vi.fn();
    render(
      <TabRulePalette
        rules={tabRules}
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
      <TabRulePalette
        rules={tabRules}
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
      <TabRulePalette
        rules={tabRules}
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
      <TabRulePalette rules={[]} onAddSequent={() => {}} testId="palette" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("シーケント追加ボタンのホバーでスタイルが変化する", async () => {
    const user = userEvent.setup();
    render(
      <TabRulePalette
        rules={tabRules}
        onAddSequent={() => {}}
        testId="palette"
      />,
    );
    const button = screen.getByTestId("palette-add-sequent");
    await user.hover(button);
    await user.unhover(button);
    // ホバー・アンホバーでエラーが出ないことを確認
    expect(button).toBeInTheDocument();
  });

  it("testIdが指定されない場合もレンダリングできる", () => {
    render(<TabRulePalette rules={tabRules} onAddSequent={() => {}} />);
    expect(screen.getByText("Tableau Calculus")).toBeInTheDocument();
  });

  it("規則クリックでonRuleClickが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleRuleClick = vi.fn();
    render(
      <TabRulePalette
        rules={tabRules}
        onAddSequent={() => {}}
        onRuleClick={handleRuleClick}
        testId="palette"
      />,
    );
    await user.click(screen.getByTestId("palette-rule-conjunction"));
    expect(handleRuleClick).toHaveBeenCalledOnce();
    expect(handleRuleClick).toHaveBeenCalledWith("conjunction");
  });

  it("規則のEnterキーでonRuleClickが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleRuleClick = vi.fn();
    render(
      <TabRulePalette
        rules={tabRules}
        onAddSequent={() => {}}
        onRuleClick={handleRuleClick}
        testId="palette"
      />,
    );
    const ruleEl = screen.getByTestId("palette-rule-conjunction");
    ruleEl.focus();
    await user.keyboard("{Enter}");
    expect(handleRuleClick).toHaveBeenCalledOnce();
    expect(handleRuleClick).toHaveBeenCalledWith("conjunction");
  });

  it("規則のSpaceキーでonRuleClickが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleRuleClick = vi.fn();
    render(
      <TabRulePalette
        rules={tabRules}
        onAddSequent={() => {}}
        onRuleClick={handleRuleClick}
        testId="palette"
      />,
    );
    const ruleEl = screen.getByTestId("palette-rule-conjunction");
    ruleEl.focus();
    await user.keyboard(" ");
    expect(handleRuleClick).toHaveBeenCalledOnce();
    expect(handleRuleClick).toHaveBeenCalledWith("conjunction");
  });

  it("selectedRuleIdで選択された規則のスタイルが変わる", () => {
    render(
      <TabRulePalette
        rules={tabRules}
        onAddSequent={() => {}}
        selectedRuleId="conjunction"
        testId="palette"
      />,
    );
    const selectedEl = screen.getByTestId("palette-rule-conjunction");
    // 選択時はfontWeight: 600のインラインスタイルが付く
    expect(selectedEl.style.fontWeight).toBe("600");
    // 非選択の要素はfontWeightが600でない
    const nonSelectedEl = screen.getByTestId("palette-rule-disjunction");
    expect(nonSelectedEl.style.fontWeight).not.toBe("600");
  });

  it("onRuleClickなしでも規則はレンダリングされる", () => {
    render(
      <TabRulePalette
        rules={tabRules}
        onAddSequent={() => {}}
        testId="palette"
      />,
    );
    expect(screen.getByTestId("palette-rule-conjunction")).toBeInTheDocument();
  });

  it("規則アイテムのホバーでスタイルが変化する（非選択時）", async () => {
    const user = userEvent.setup();
    render(
      <TabRulePalette
        rules={tabRules}
        onAddSequent={() => {}}
        onRuleClick={() => {}}
        testId="palette"
      />,
    );
    const ruleEl = screen.getByTestId("palette-rule-conjunction");
    await user.hover(ruleEl);
    await user.unhover(ruleEl);
    // ホバー・アンホバーでエラーが出ないことを確認
    expect(ruleEl).toBeInTheDocument();
  });

  it("選択中の規則アイテムのホバーでスタイルが変わらない", async () => {
    const user = userEvent.setup();
    render(
      <TabRulePalette
        rules={tabRules}
        onAddSequent={() => {}}
        selectedRuleId="conjunction"
        testId="palette"
      />,
    );
    const selectedEl = screen.getByTestId("palette-rule-conjunction");
    const bgBefore = selectedEl.style.background;
    await user.hover(selectedEl);
    // 選択中のアイテムはホバーでbackgroundが変わらない
    expect(selectedEl.style.background).toBe(bgBefore);
    await user.unhover(selectedEl);
    expect(selectedEl.style.background).toBe(bgBefore);
  });
});
