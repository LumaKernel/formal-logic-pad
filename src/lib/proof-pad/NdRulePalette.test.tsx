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
    expect(screen.getByText("+ 仮定を追加")).toBeInTheDocument();
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

  it("各規則アイテムにrole=buttonはない（参照表示のみ）", () => {
    render(
      <NdRulePalette
        rules={nmRules}
        onAddAssumption={() => {}}
        testId="palette"
      />,
    );
    const ruleItem = screen.getByTestId("palette-rule-implication-intro");
    expect(ruleItem.getAttribute("role")).toBeNull();
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

  it("testIdなしでも正常にレンダリングされる", () => {
    const { container } = render(
      <NdRulePalette rules={nmRules} onAddAssumption={() => {}} />,
    );
    expect(container.textContent).toContain("Natural Deduction");
    expect(container.textContent).toContain("→導入 (→I)");
  });
});
