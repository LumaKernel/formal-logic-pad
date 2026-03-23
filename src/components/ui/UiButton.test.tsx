import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UiButton } from "./UiButton";

describe("UiButton", () => {
  it("renders children", () => {
    render(<UiButton>Click me</UiButton>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("handles click", async () => {
    const onClick = vi.fn();
    render(<UiButton onClick={onClick}>Click</UiButton>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders icon alongside children", () => {
    render(<UiButton icon={<span data-testid="icon">★</span>}>Label</UiButton>);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveTextContent("Label");
  });

  it("applies primary type styles", () => {
    render(<UiButton type="primary">Primary</UiButton>);
    const btn = screen.getByRole("button");
    expect(btn.style.backgroundColor).toBeTruthy();
  });

  it("applies text type styles", () => {
    render(<UiButton type="text">Text</UiButton>);
    const btn = screen.getByRole("button");
    expect(btn.style.backgroundColor).toBe("transparent");
  });

  it("applies link type styles", () => {
    render(<UiButton type="link">Link</UiButton>);
    const btn = screen.getByRole("button");
    expect(btn.style.backgroundColor).toBe("transparent");
  });

  it("applies danger + primary styles", () => {
    render(
      <UiButton type="primary" danger>
        Danger
      </UiButton>,
    );
    const btn = screen.getByRole("button");
    expect(btn.style.backgroundColor).toBeTruthy();
  });

  it("applies small size", () => {
    render(<UiButton size="small">Small</UiButton>);
    const btn = screen.getByRole("button");
    expect(btn.style.fontSize).toBe("0.8125rem");
  });

  it("applies round shape", () => {
    render(<UiButton shape="round">Round</UiButton>);
    const btn = screen.getByRole("button");
    expect(btn.style.borderRadius).toBe("9999px");
  });

  it("applies disabled state", () => {
    render(<UiButton disabled>Disabled</UiButton>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn.style.opacity).toBe("0.5");
  });

  it("sets htmlType", () => {
    render(<UiButton htmlType="submit">Submit</UiButton>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("passes data-testid", () => {
    render(<UiButton data-testid="my-btn">Test</UiButton>);
    expect(screen.getByTestId("my-btn")).toBeInTheDocument();
  });

  it("passes aria-label", () => {
    render(<UiButton aria-label="action">Act</UiButton>);
    expect(screen.getByLabelText("action")).toBeInTheDocument();
  });

  it("passes title", () => {
    render(<UiButton title="tooltip">Tip</UiButton>);
    expect(screen.getByTitle("tooltip")).toBeInTheDocument();
  });

  it("passes aria-expanded", () => {
    render(<UiButton aria-expanded={true}>Expand</UiButton>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("applies custom style override", () => {
    render(<UiButton style={{ marginTop: "10px" }}>Styled</UiButton>);
    expect(screen.getByRole("button").style.marginTop).toBe("10px");
  });

  it("defaults to button type", () => {
    render(<UiButton>Default</UiButton>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});
