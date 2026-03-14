import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within, userEvent } from "storybook/test";
import { ThemeProvider } from "../../lib/theme/ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";
import type { CSSProperties, ReactNode } from "react";

const storyContainerStyle: Readonly<CSSProperties> = {
  minHeight: "100px",
  backgroundColor: "var(--ui-background)",
  padding: "2rem",
  fontFamily: "var(--font-ui)",
  color: "var(--ui-foreground)",
};

function ThemeToggleWithProvider(): ReactNode {
  return (
    <ThemeProvider>
      <div style={storyContainerStyle}>
        <ThemeToggle />
      </div>
    </ThemeProvider>
  );
}

const meta = {
  title: "components/ThemeToggle",
  component: ThemeToggleWithProvider,
} satisfies Meta<typeof ThemeToggleWithProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Verify all three buttons are rendered
    const lightBtn = canvas.getByTestId("theme-toggle-light");
    const darkBtn = canvas.getByTestId("theme-toggle-dark");
    const systemBtn = canvas.getByTestId("theme-toggle-system");

    // System should be active by default
    await expect(systemBtn.getAttribute("aria-checked")).toBe("true");
    await expect(lightBtn.getAttribute("aria-checked")).toBe("false");
    await expect(darkBtn.getAttribute("aria-checked")).toBe("false");

    // Click dark button
    await user.click(darkBtn);
    await expect(darkBtn.getAttribute("aria-checked")).toBe("true");
    await expect(systemBtn.getAttribute("aria-checked")).toBe("false");

    // Click light button
    await user.click(lightBtn);
    await expect(lightBtn.getAttribute("aria-checked")).toBe("true");
    await expect(darkBtn.getAttribute("aria-checked")).toBe("false");

    // Click system button to return to default
    await user.click(systemBtn);
    await expect(systemBtn.getAttribute("aria-checked")).toBe("true");
  },
};

function ThemeToggleIconsOnly(): ReactNode {
  return (
    <ThemeProvider>
      <div style={storyContainerStyle}>
        <ThemeToggle showLabels={false} />
      </div>
    </ThemeProvider>
  );
}

export const IconsOnly: Story = {
  render: () => <ThemeToggleIconsOnly />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // All three buttons should be rendered
    await expect(canvas.getByTestId("theme-toggle-light")).toBeDefined();
    await expect(canvas.getByTestId("theme-toggle-dark")).toBeDefined();
    await expect(canvas.getByTestId("theme-toggle-system")).toBeDefined();

    // Labels should not be visible
    await expect(canvas.queryByText("Light")).toBeNull();
    await expect(canvas.queryByText("Dark")).toBeNull();
    await expect(canvas.queryByText("System")).toBeNull();
  },
};
