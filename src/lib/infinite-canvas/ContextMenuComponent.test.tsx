import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ContextMenuItem } from "./contextMenu";
import { ContextMenuComponent } from "./ContextMenuComponent";

const SAMPLE_ITEMS: readonly ContextMenuItem[] = [
  { id: "edit", label: "Edit" },
  { id: "delete", label: "Delete" },
  { id: "disabled-item", label: "Disabled", disabled: true },
];

describe("ContextMenuComponent", () => {
  it("renders all menu items", () => {
    const menuRef = createRef<HTMLDivElement | null>();
    render(
      <ContextMenuComponent
        items={SAMPLE_ITEMS}
        screenPosition={{ x: 100, y: 200 }}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        menuRef={menuRef}
      />,
    );

    expect(screen.getByTestId("context-menu-item-edit")).toBeInTheDocument();
    expect(screen.getByTestId("context-menu-item-delete")).toBeInTheDocument();
    expect(
      screen.getByTestId("context-menu-item-disabled-item"),
    ).toBeInTheDocument();
  });

  it("renders at fixed position with correct coordinates", () => {
    const menuRef = createRef<HTMLDivElement | null>();
    render(
      <ContextMenuComponent
        items={SAMPLE_ITEMS}
        screenPosition={{ x: 150, y: 300 }}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        menuRef={menuRef}
      />,
    );

    const menu = screen.getByTestId("context-menu");
    expect(menu.style.position).toBe("fixed");
    expect(menu.style.left).toBe("150px");
    expect(menu.style.top).toBe("300px");
  });

  it("calls onSelect and onClose when a menu item is clicked", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const menuRef = createRef<HTMLDivElement | null>();
    render(
      <ContextMenuComponent
        items={SAMPLE_ITEMS}
        screenPosition={{ x: 100, y: 200 }}
        onSelect={onSelect}
        onClose={onClose}
        menuRef={menuRef}
      />,
    );

    fireEvent.click(screen.getByTestId("context-menu-item-edit"));

    expect(onSelect).toHaveBeenCalledWith("edit");
    expect(onClose).toHaveBeenCalled();
  });

  it("does not call onSelect when disabled item is clicked", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const menuRef = createRef<HTMLDivElement | null>();
    render(
      <ContextMenuComponent
        items={SAMPLE_ITEMS}
        screenPosition={{ x: 100, y: 200 }}
        onSelect={onSelect}
        onClose={onClose}
        menuRef={menuRef}
      />,
    );

    const disabledItem = screen.getByTestId("context-menu-item-disabled-item");
    fireEvent.click(disabledItem);

    // Disabled button click is ignored by the browser
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders disabled items with disabled attribute", () => {
    const menuRef = createRef<HTMLDivElement | null>();
    render(
      <ContextMenuComponent
        items={SAMPLE_ITEMS}
        screenPosition={{ x: 100, y: 200 }}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        menuRef={menuRef}
      />,
    );

    const disabledItem = screen.getByTestId("context-menu-item-disabled-item");
    expect(disabledItem).toBeDisabled();

    const enabledItem = screen.getByTestId("context-menu-item-edit");
    expect(enabledItem).not.toBeDisabled();
  });

  it("syncs menuRef to the container element", () => {
    const menuRef = createRef<HTMLDivElement | null>();
    render(
      <ContextMenuComponent
        items={SAMPLE_ITEMS}
        screenPosition={{ x: 100, y: 200 }}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        menuRef={menuRef}
      />,
    );

    expect(menuRef.current).toBe(screen.getByTestId("context-menu"));
  });

  it("has high z-index", () => {
    const menuRef = createRef<HTMLDivElement | null>();
    render(
      <ContextMenuComponent
        items={SAMPLE_ITEMS}
        screenPosition={{ x: 100, y: 200 }}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        menuRef={menuRef}
      />,
    );

    const menu = screen.getByTestId("context-menu");
    expect(menu.style.zIndex).toBe("2000");
  });

  it("displays item labels", () => {
    const menuRef = createRef<HTMLDivElement | null>();
    render(
      <ContextMenuComponent
        items={SAMPLE_ITEMS}
        screenPosition={{ x: 100, y: 200 }}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        menuRef={menuRef}
      />,
    );

    expect(screen.getByTestId("context-menu-item-edit").textContent).toBe(
      "Edit",
    );
    expect(screen.getByTestId("context-menu-item-delete").textContent).toBe(
      "Delete",
    );
  });

  it("highlights enabled item on mouse enter", () => {
    const menuRef = createRef<HTMLDivElement | null>();
    render(
      <ContextMenuComponent
        items={SAMPLE_ITEMS}
        screenPosition={{ x: 100, y: 200 }}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        menuRef={menuRef}
      />,
    );

    const editItem = screen.getByTestId("context-menu-item-edit");
    fireEvent.mouseEnter(editItem);
    expect(editItem.style.background).toBe("rgb(240, 240, 240)");
  });

  it("removes highlight on mouse leave", () => {
    const menuRef = createRef<HTMLDivElement | null>();
    render(
      <ContextMenuComponent
        items={SAMPLE_ITEMS}
        screenPosition={{ x: 100, y: 200 }}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        menuRef={menuRef}
      />,
    );

    const editItem = screen.getByTestId("context-menu-item-edit");
    fireEvent.mouseEnter(editItem);
    fireEvent.mouseLeave(editItem);
    expect(editItem.style.background).toBe("transparent");
  });

  it("does not highlight disabled item on mouse enter", () => {
    const menuRef = createRef<HTMLDivElement | null>();
    render(
      <ContextMenuComponent
        items={SAMPLE_ITEMS}
        screenPosition={{ x: 100, y: 200 }}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        menuRef={menuRef}
      />,
    );

    const disabledItem = screen.getByTestId("context-menu-item-disabled-item");
    fireEvent.mouseEnter(disabledItem);
    expect(disabledItem.style.background).toBe("transparent");
  });
});
