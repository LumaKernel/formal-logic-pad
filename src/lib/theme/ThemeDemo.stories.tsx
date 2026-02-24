import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within, userEvent } from "storybook/test";
import { ThemeProvider, useThemeContext } from "./ThemeProvider";
import { nextThemeMode, THEME_MODES } from "./themeLogic";
import type { ReactNode } from "react";

function ThemeDemoContent(): ReactNode {
  const { mode, resolved, setMode } = useThemeContext();
  const isDark = resolved === "dark";
  const borderColor = isDark ? "#555" : "#ccc";
  return (
    <div
      style={{
        padding: "2rem",
        background: isDark ? "#1a1a2e" : "#ffffff",
        color: isDark ? "#ededed" : "#171717",
        minHeight: "200px",
        borderRadius: "8px",
        fontFamily: "sans-serif",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <h2>Theme Demo</h2>
      <p>
        Mode: <strong data-testid="demo-mode">{mode}</strong>
      </p>
      <p>
        Resolved: <strong data-testid="demo-resolved">{resolved}</strong>
      </p>
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        {THEME_MODES.map((m) => (
          <button
            key={m}
            data-testid={`demo-btn-${m satisfies string}`}
            onClick={() => setMode(m)}
            style={{
              padding: "0.5rem 1rem",
              border:
                mode === m
                  ? "2px solid #4a9eff"
                  : `1px solid ${borderColor satisfies string}`,
              borderRadius: "4px",
              background:
                mode === m ? (isDark ? "#2a3a5e" : "#e8f0ff") : "transparent",
              color: "inherit",
              cursor: "pointer",
              fontWeight: mode === m ? "bold" : "normal",
            }}
          >
            {m === "light" ? "Light" : m === "dark" ? "Dark" : "System"}
          </button>
        ))}
      </div>
      <button
        data-testid="demo-cycle"
        onClick={() => setMode(nextThemeMode(mode))}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          border: `1px solid ${borderColor satisfies string}`,
          borderRadius: "4px",
          background: "transparent",
          color: "inherit",
          cursor: "pointer",
        }}
      >
        Cycle Theme
      </button>
    </div>
  );
}

function ThemeDemo(): ReactNode {
  return (
    <ThemeProvider>
      <ThemeDemoContent />
    </ThemeProvider>
  );
}

const meta = {
  title: "theme/ThemeDemo",
  component: ThemeDemo,
} satisfies Meta<typeof ThemeDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Initial state: system mode
    const modeEl = canvas.getByTestId("demo-mode");
    await expect(modeEl.textContent).toBe("system");

    // Click dark button
    await user.click(canvas.getByTestId("demo-btn-dark"));
    await expect(modeEl.textContent).toBe("dark");
    await expect(canvas.getByTestId("demo-resolved").textContent).toBe("dark");

    // Click light button
    await user.click(canvas.getByTestId("demo-btn-light"));
    await expect(modeEl.textContent).toBe("light");
    await expect(canvas.getByTestId("demo-resolved").textContent).toBe("light");

    // Cycle button: light → dark
    await user.click(canvas.getByTestId("demo-cycle"));
    await expect(modeEl.textContent).toBe("dark");

    // Cycle button: dark → system
    await user.click(canvas.getByTestId("demo-cycle"));
    await expect(modeEl.textContent).toBe("system");

    // Click system button to reset
    await user.click(canvas.getByTestId("demo-btn-system"));
    await expect(modeEl.textContent).toBe("system");
  },
};
