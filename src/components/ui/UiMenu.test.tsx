import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UiMenu } from "./UiMenu";

const items = [
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete", danger: true },
] as const;

describe("UiMenu", () => {
  it("renders menu items", () => {
    render(<UiMenu items={items} />);
    expect(screen.getAllByRole("menuitem")).toHaveLength(2);
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("calls onClick with domEvent", async () => {
    const onClick = vi.fn();
    render(<UiMenu items={[{ key: "a", label: "Action", onClick }]} />);
    await userEvent.click(screen.getByText("Action"));
    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick.mock.calls[0]?.[0]).toHaveProperty("domEvent");
  });

  it("handles item without onClick", async () => {
    render(<UiMenu items={[{ key: "a", label: "NoClick" }]} />);
    // Should not throw
    await userEvent.click(screen.getByText("NoClick"));
  });

  it("renders with undefined items", () => {
    render(<UiMenu items={undefined} />);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.queryAllByRole("menuitem")).toHaveLength(0);
  });

  it("applies danger styling to danger items", () => {
    render(<UiMenu items={items} />);
    const deleteBtn = screen.getByText("Delete");
    // Danger items get distinct color from normal items (light theme: #e06060)
    const normalBtn = screen.getByText("Edit");
    expect(deleteBtn.style.color).not.toBe(normalBtn.style.color);
  });

  it("applies non-danger styling to normal items", () => {
    render(<UiMenu items={items} />);
    const editBtn = screen.getByText("Edit");
    expect(editBtn.style.color).toBeTruthy();
  });

  it("has menu role on container", () => {
    render(<UiMenu items={items} />);
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("applies custom style", () => {
    render(<UiMenu items={items} style={{ maxWidth: "200px" }} />);
    expect(screen.getByRole("menu").style.maxWidth).toBe("200px");
  });
});
