import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UiTabs } from "./UiTabs";

const items = [
  { key: "a", label: "Tab A" },
  { key: "b", label: "Tab B" },
  { key: "c", label: "Tab C" },
] as const;

describe("UiTabs", () => {
  it("renders all tabs", () => {
    render(<UiTabs activeKey="a" onChange={vi.fn()} items={items} />);
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("marks active tab with aria-selected", () => {
    render(<UiTabs activeKey="b" onChange={vi.fn()} items={items} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[2]).toHaveAttribute("aria-selected", "false");
  });

  it("calls onChange with clicked tab key", async () => {
    const onChange = vi.fn();
    render(<UiTabs activeKey="a" onChange={onChange} items={items} />);
    await userEvent.click(screen.getByText("Tab C"));
    expect(onChange).toHaveBeenCalledWith("c");
  });

  it("applies active styling (bold) to active tab", () => {
    render(<UiTabs activeKey="a" onChange={vi.fn()} items={items} />);
    const activeTab = screen.getByText("Tab A");
    expect(activeTab.style.fontWeight).toBe("600");
  });

  it("applies inactive styling to non-active tab", () => {
    render(<UiTabs activeKey="a" onChange={vi.fn()} items={items} />);
    const inactiveTab = screen.getByText("Tab B");
    expect(inactiveTab.style.fontWeight).toBe("400");
  });

  it("has tablist role on container", () => {
    render(<UiTabs activeKey="a" onChange={vi.fn()} items={items} />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("applies custom style", () => {
    render(
      <UiTabs
        activeKey="a"
        onChange={vi.fn()}
        items={items}
        style={{ marginTop: "8px" }}
      />,
    );
    expect(screen.getByRole("tablist").style.marginTop).toBe("8px");
  });
});
