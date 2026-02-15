import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders with label", () => {
    render(<Button label="Click me" />);
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button label="Click me" onClick={handleClick} />);

    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("renders primary variant", () => {
    render(<Button label="Primary" primary />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("storybook-button--primary");
  });

  it("renders secondary variant by default", () => {
    render(<Button label="Secondary" />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("storybook-button--secondary");
  });

  it("renders different sizes", () => {
    const { rerender } = render(<Button label="Small" size="small" />);
    expect(screen.getByRole("button").className).toContain(
      "storybook-button--small",
    );

    rerender(<Button label="Large" size="large" />);
    expect(screen.getByRole("button").className).toContain(
      "storybook-button--large",
    );
  });
});
