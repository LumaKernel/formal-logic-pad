import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { LanguageToggle } from "./LanguageToggle";

describe("LanguageToggle", () => {
  it("renders two locale buttons", () => {
    render(<LanguageToggle locale="en" onLocaleChange={vi.fn()} />);
    expect(screen.getByTestId("language-toggle-en")).toBeDefined();
    expect(screen.getByTestId("language-toggle-ja")).toBeDefined();
  });

  it("renders with radiogroup role", () => {
    render(<LanguageToggle locale="en" onLocaleChange={vi.fn()} />);
    const group = screen.getByTestId("language-toggle");
    expect(group.getAttribute("role")).toBe("radiogroup");
    expect(group.getAttribute("aria-label")).toBe("Language selection");
  });

  it("shows locale labels", () => {
    render(<LanguageToggle locale="en" onLocaleChange={vi.fn()} />);
    expect(screen.getByText("EN")).toBeDefined();
    expect(screen.getByText("JA")).toBeDefined();
  });

  it("marks en as active when locale is en", () => {
    render(<LanguageToggle locale="en" onLocaleChange={vi.fn()} />);
    expect(
      screen.getByTestId("language-toggle-en").getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen.getByTestId("language-toggle-ja").getAttribute("aria-checked"),
    ).toBe("false");
  });

  it("marks ja as active when locale is ja", () => {
    render(<LanguageToggle locale="ja" onLocaleChange={vi.fn()} />);
    expect(
      screen.getByTestId("language-toggle-ja").getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen.getByTestId("language-toggle-en").getAttribute("aria-checked"),
    ).toBe("false");
  });

  it("has correct aria-labels", () => {
    render(<LanguageToggle locale="en" onLocaleChange={vi.fn()} />);
    expect(
      screen.getByTestId("language-toggle-en").getAttribute("aria-label"),
    ).toBe("Switch language to English");
    expect(
      screen.getByTestId("language-toggle-ja").getAttribute("aria-label"),
    ).toBe("Switch language to 日本語");
  });

  it("has role=radio on each button", () => {
    render(<LanguageToggle locale="en" onLocaleChange={vi.fn()} />);
    expect(screen.getByTestId("language-toggle-en").getAttribute("role")).toBe(
      "radio",
    );
    expect(screen.getByTestId("language-toggle-ja").getAttribute("role")).toBe(
      "radio",
    );
  });

  it("calls onLocaleChange when clicking a different locale", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LanguageToggle locale="en" onLocaleChange={onChange} />);

    await user.click(screen.getByTestId("language-toggle-ja"));
    expect(onChange).toHaveBeenCalledWith("ja");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("does not call onLocaleChange when clicking the active locale", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LanguageToggle locale="en" onLocaleChange={onChange} />);

    await user.click(screen.getByTestId("language-toggle-en"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("is keyboard accessible via Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LanguageToggle locale="en" onLocaleChange={onChange} />);

    // Tab to first button (en), then to ja button
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByTestId("language-toggle-ja"),
    );

    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("ja");
  });

  it("is keyboard accessible via Space", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LanguageToggle locale="en" onLocaleChange={onChange} />);

    // Tab to first button (en), then to ja button
    await user.tab();
    await user.tab();

    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith("ja");
  });
});
