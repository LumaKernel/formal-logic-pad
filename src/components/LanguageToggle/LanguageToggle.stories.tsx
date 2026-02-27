import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within, userEvent, fn } from "storybook/test";
import { useState, type ReactNode } from "react";
import type { Locale } from "../../i18n/config";
import { LanguageToggle } from "./LanguageToggle";

function LanguageToggleDemo({
  initialLocale = "en",
}: {
  readonly initialLocale?: Locale;
}): ReactNode {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  return (
    <div
      style={{
        padding: "2rem",
        background: "var(--color-bg-primary, #ffffff)",
        color: "var(--color-text-primary, #171717)",
        minHeight: "100px",
        fontFamily: "var(--font-ui)",
      }}
    >
      <LanguageToggle locale={locale} onLocaleChange={setLocale} />
      <p style={{ marginTop: "1rem" }}>
        Current locale: <strong>{locale}</strong>
      </p>
    </div>
  );
}

const meta = {
  title: "components/LanguageToggle",
  component: LanguageToggleDemo,
} satisfies Meta<typeof LanguageToggleDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Verify both buttons are rendered
    const enBtn = canvas.getByTestId("language-toggle-en");
    const jaBtn = canvas.getByTestId("language-toggle-ja");

    // EN should be active by default
    await expect(enBtn.getAttribute("aria-checked")).toBe("true");
    await expect(jaBtn.getAttribute("aria-checked")).toBe("false");

    // Click JA button
    await user.click(jaBtn);
    await expect(jaBtn.getAttribute("aria-checked")).toBe("true");
    await expect(enBtn.getAttribute("aria-checked")).toBe("false");

    // Click EN button to return
    await user.click(enBtn);
    await expect(enBtn.getAttribute("aria-checked")).toBe("true");
    await expect(jaBtn.getAttribute("aria-checked")).toBe("false");
  },
};

export const Japanese: Story = {
  args: {
    initialLocale: "ja",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const enBtn = canvas.getByTestId("language-toggle-en");
    const jaBtn = canvas.getByTestId("language-toggle-ja");

    // JA should be active
    await expect(jaBtn.getAttribute("aria-checked")).toBe("true");
    await expect(enBtn.getAttribute("aria-checked")).toBe("false");
  },
};

function LanguageToggleControlled(): ReactNode {
  const handleChange = fn();
  return (
    <div
      style={{
        padding: "2rem",
        background: "var(--color-bg-primary, #ffffff)",
        color: "var(--color-text-primary, #171717)",
        minHeight: "100px",
        fontFamily: "var(--font-ui)",
      }}
    >
      <LanguageToggle locale="en" onLocaleChange={handleChange} />
    </div>
  );
}

export const Controlled: Story = {
  render: () => <LanguageToggleControlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Both buttons should be rendered
    await expect(canvas.getByTestId("language-toggle-en")).toBeDefined();
    await expect(canvas.getByTestId("language-toggle-ja")).toBeDefined();

    // EN should be active (controlled)
    await expect(
      canvas.getByTestId("language-toggle-en").getAttribute("aria-checked"),
    ).toBe("true");
  },
};
