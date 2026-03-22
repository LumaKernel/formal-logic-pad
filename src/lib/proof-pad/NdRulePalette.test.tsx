import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NdRulePalette } from "./NdRulePalette";
import { getAvailableNdRules } from "./axiomPaletteLogic";
import { nmSystem, njSystem, nkSystem } from "../logic-core/deductionSystem";

const nmRules = getAvailableNdRules(nmSystem);
const njRules = getAvailableNdRules(njSystem);
const nkRules = getAvailableNdRules(nkSystem);

describe("NdRulePalette", () => {
  it("ヘッダーと推論規則一覧を表示する", () => {
    render(
      <NdRulePalette
        rules={nmRules}
        onAddAssumption={() => {}}
        testId="palette"
      />,
    );
    expect(screen.getByText("Natural Deduction")).toBeInTheDocument();
    expect(screen.getByText("Rules")).toBeInTheDocument();
    expect(screen.getByText("→導入 (→I)")).toBeInTheDocument();
    expect(screen.getByText("→除去 (→E)")).toBeInTheDocument();
    expect(screen.getByText("∧導入 (∧I)")).toBeInTheDocument();
  });

  it("NMの9規則すべてが表示される", () => {
    render(
      <NdRulePalette
        rules={nmRules}
        onAddAssumption={() => {}}
        testId="palette"
      />,
    );
    for (const rule of nmRules) {
      expect(
        screen.getByTestId(`palette-rule-${rule.id satisfies string}`),
      ).toBeInTheDocument();
    }
  });

  it("NJではEFQが表示される", () => {
    render(
      <NdRulePalette
        rules={njRules}
        onAddAssumption={() => {}}
        testId="palette"
      />,
    );
    expect(screen.getByText("爆発律 (EFQ)")).toBeInTheDocument();
  });

  it("NKではDNEが表示される", () => {
    render(
      <NdRulePalette
        rules={nkRules}
        onAddAssumption={() => {}}
        testId="palette"
      />,
    );
    expect(screen.getByText("二重否定除去 (DNE)")).toBeInTheDocument();
  });

  it("「仮定を追加」ボタンが表示される", () => {
    render(
      <NdRulePalette
        rules={nmRules}
        onAddAssumption={() => {}}
        testId="palette"
      />,
    );
    expect(screen.getByText("+ Add Assumption")).toBeInTheDocument();
  });

  it("「仮定を追加」クリックでonAddAssumptionが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();
    render(
      <NdRulePalette
        rules={nmRules}
        onAddAssumption={handleAdd}
        testId="palette"
      />,
    );
    await user.click(screen.getByTestId("palette-add-assumption"));
    expect(handleAdd).toHaveBeenCalledTimes(1);
  });

  it("「仮定を追加」Enterキーでも呼ばれる", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();
    render(
      <NdRulePalette
        rules={nmRules}
        onAddAssumption={handleAdd}
        testId="palette"
      />,
    );
    const btn = screen.getByTestId("palette-add-assumption");
    btn.focus();
    await user.keyboard("{Enter}");
    expect(handleAdd).toHaveBeenCalledTimes(1);
  });

  it("「仮定を追加」Spaceキーでも呼ばれる", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();
    render(
      <NdRulePalette
        rules={nmRules}
        onAddAssumption={handleAdd}
        testId="palette"
      />,
    );
    const btn = screen.getByTestId("palette-add-assumption");
    btn.focus();
    await user.keyboard(" ");
    expect(handleAdd).toHaveBeenCalledTimes(1);
  });

  it("空のルールリストではnullを返す", () => {
    const { container } = render(
      <NdRulePalette rules={[]} onAddAssumption={() => {}} testId="palette" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("各規則アイテムにrole=buttonとtabIndex=0がある（クリック可能）", () => {
    render(
      <NdRulePalette
        rules={nmRules}
        onAddAssumption={() => {}}
        testId="palette"
      />,
    );
    const ruleItem = screen.getByTestId("palette-rule-implication-intro");
    expect(ruleItem.getAttribute("role")).toBe("button");
    expect(ruleItem.getAttribute("tabindex")).toBe("0");
  });

  it("規則アイテムクリックでonSelectRuleが呼ばれる", async () => {
    const user = userEvent.setup();
    const onSelectRule = vi.fn();
    render(
      <NdRulePalette
        rules={nmRules}
        onAddAssumption={() => {}}
        onSelectRule={onSelectRule}
        testId="palette"
      />,
    );
    const ruleItem = screen.getByTestId("palette-rule-implication-intro");
    await user.click(ruleItem);
    expect(onSelectRule).toHaveBeenCalledWith("implication-intro");
  });

  it("選択中の規則がハイライトされる", () => {
    render(
      <NdRulePalette
        rules={nmRules}
        onAddAssumption={() => {}}
        onSelectRule={() => {}}
        selectedRuleId="implication-intro"
        testId="palette"
      />,
    );
    const ruleItem = screen.getByTestId("palette-rule-implication-intro");
    expect(ruleItem.style.fontWeight).toBe("600");
  });

  it("「仮定を追加」ボタンにrole=buttonとtabIndex=0がある", () => {
    render(
      <NdRulePalette
        rules={nmRules}
        onAddAssumption={() => {}}
        testId="palette"
      />,
    );
    const btn = screen.getByTestId("palette-add-assumption");
    expect(btn.getAttribute("role")).toBe("button");
    expect(btn.getAttribute("tabindex")).toBe("0");
  });

  it("「仮定を追加」ボタンのhover/leaveでスタイルが変わる", async () => {
    const user = userEvent.setup();
    render(
      <NdRulePalette
        rules={nmRules}
        onAddAssumption={() => {}}
        testId="palette"
      />,
    );
    const btn = screen.getByTestId("palette-add-assumption");
    await user.hover(btn);
    // hoverでbackgroundが設定される
    expect(btn.style.background).not.toBe("");
    await user.unhover(btn);
    // leaveでbackgroundがクリアされる
    expect(btn.style.background).toBe("");
  });

  it("規則アイテムのhover/unhoverでスタイルが変わる（非選択時）", async () => {
    const user = userEvent.setup();
    render(
      <NdRulePalette
        rules={nmRules}
        onAddAssumption={() => {}}
        onSelectRule={() => {}}
        testId="palette"
      />,
    );
    const ruleEl = screen.getByTestId("palette-rule-implication-intro");
    await user.hover(ruleEl);
    expect(ruleEl.style.background).not.toBe("");
    await user.unhover(ruleEl);
    expect(ruleEl.style.background).toBe("");
  });

  it("選択中の規則アイテムのhover/unhoverでスタイルが変わらない", async () => {
    const user = userEvent.setup();
    render(
      <NdRulePalette
        rules={nmRules}
        onAddAssumption={() => {}}
        selectedRuleId="implication-intro"
        testId="palette"
      />,
    );
    const selectedEl = screen.getByTestId("palette-rule-implication-intro");
    const bgBefore = selectedEl.style.background;
    await user.hover(selectedEl);
    expect(selectedEl.style.background).toBe(bgBefore);
    await user.unhover(selectedEl);
    expect(selectedEl.style.background).toBe(bgBefore);
  });

  it("testIdなしでも正常にレンダリングされる", () => {
    const { container } = render(
      <NdRulePalette rules={nmRules} onAddAssumption={() => {}} />,
    );
    expect(container.textContent).toContain("Natural Deduction");
    expect(container.textContent).toContain("→導入 (→I)");
  });
});
