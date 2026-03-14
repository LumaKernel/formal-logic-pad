import "katex/dist/katex.min.css";
import "../src/app/globals.css";
import type { Decorator, Preview } from "@storybook/nextjs-vite";
import React, { useEffect, useRef, useMemo } from "react";
import { ConfigProvider, theme as antTheme } from "antd";

const THEME_TOOLBAR_ITEMS = [
  { value: "light", icon: "sun", title: "Light" },
  { value: "dark", icon: "moon", title: "Dark" },
  { value: "side-by-side", icon: "sidebyside", title: "Side by Side" },
];

/**
 * Wrapper component that strips data-testid from all descendant elements.
 *
 * Side-by-side mode renders the story twice, causing duplicate data-testid values.
 * Play functions use `within(canvasElement).getByTestId(...)` which fails with
 * "Found multiple elements". This wrapper strips testids from the secondary (dark)
 * pane so play functions only find elements in the primary (light) pane.
 */
function TestIdStripper({ children }: { readonly children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const stripTestIds = (root: Element) => {
      for (const el of root.querySelectorAll("[data-testid]")) {
        el.removeAttribute("data-testid");
      }
    };

    // Strip existing testids
    stripTestIds(container);

    // Observe for dynamically added elements
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            if (node.hasAttribute("data-testid")) {
              node.removeAttribute("data-testid");
            }
            stripTestIds(node);
          }
        }
        // Handle attribute changes on existing elements
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-testid" &&
          mutation.target instanceof Element &&
          mutation.target.hasAttribute("data-testid")
        ) {
          mutation.target.removeAttribute("data-testid");
        }
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-testid"],
    });

    return () => observer.disconnect();
  }, []);

  // eslint-disable-next-line react-hooks/refs -- ref is passed to a DOM element, not read during render
  return React.createElement("div", { ref: containerRef }, children);
}

/**
 * Ant Design theme wrapper for Storybook.
 * Provides ConfigProvider with appropriate algorithm based on resolved theme.
 */
function AntThemeWrapper({
  resolvedTheme,
  children,
}: {
  readonly resolvedTheme: "light" | "dark";
  readonly children: React.ReactNode;
}) {
  const themeConfig = useMemo(
    () => ({
      algorithm:
        resolvedTheme === "dark"
          ? antTheme.darkAlgorithm
          : antTheme.defaultAlgorithm,
      token: {
        colorPrimary: resolvedTheme === "dark" ? "#fafafa" : "#171717",
        colorBgContainer: resolvedTheme === "dark" ? "#0a0a0a" : "#ffffff",
        colorText: resolvedTheme === "dark" ? "#e0e0e0" : "#171717",
        colorTextSecondary: resolvedTheme === "dark" ? "#999999" : "#666666",
        colorBorder: resolvedTheme === "dark" ? "#262626" : "#e5e5e5",
        colorBgElevated: resolvedTheme === "dark" ? "#1e1e2e" : "#ffffff",
        colorError: resolvedTheme === "dark" ? "#ff6b6b" : "#e06060",
        colorSuccess: resolvedTheme === "dark" ? "#4ad97a" : "#2ecc71",
        colorWarning: resolvedTheme === "dark" ? "#e0a05a" : "#d9944a",
        borderRadius: 8,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
    }),
    [resolvedTheme],
  );

  return React.createElement(ConfigProvider, { theme: themeConfig }, children);
}

/**
 * Theme decorator that sets data-theme attribute on a wrapper div.
 * For "side-by-side" mode, renders the story twice (light + dark) in a flex container.
 * The dark pane's data-testid attributes are stripped to prevent duplicate testid conflicts
 * in play function interactions.
 */
const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals["theme"] ?? "light") as string;
  const isFullscreen =
    (context.parameters["layout"] as string | undefined) === "fullscreen";

  if (theme === "side-by-side") {
    const paneStyle = isFullscreen
      ? {
          flex: 1,
          backgroundColor: "var(--color-bg-primary)" as const,
          color: "var(--color-text-primary)" as const,
          overflow: "auto" as const,
          height: "100%" as const,
        }
      : {
          flex: 1,
          backgroundColor: "var(--color-bg-primary)" as const,
          color: "var(--color-text-primary)" as const,
          padding: "16px" as const,
          borderRadius: "8px" as const,
          overflow: "auto" as const,
        };

    return React.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: isFullscreen ? "0px" : "16px",
          width: "100%",
          ...(isFullscreen ? { height: "100%" } : { minHeight: "100%" }),
        },
      },
      React.createElement(
        "div",
        {
          "data-theme": "light",
          style: paneStyle,
        },
        !isFullscreen &&
          React.createElement(
            "div",
            {
              style: {
                marginBottom: "8px",
                fontSize: "12px",
                fontWeight: "bold",
                opacity: 0.5,
              },
            },
            "Light",
          ),
        React.createElement(
          AntThemeWrapper,
          { resolvedTheme: "light" },
          React.createElement(Story),
        ),
      ),
      React.createElement(
        "div",
        {
          "data-theme": "dark",
          style: paneStyle,
        },
        !isFullscreen &&
          React.createElement(
            "div",
            {
              style: {
                marginBottom: "8px",
                fontSize: "12px",
                fontWeight: "bold",
                opacity: 0.5,
              },
            },
            "Dark",
          ),
        React.createElement(
          AntThemeWrapper,
          { resolvedTheme: "dark" },
          React.createElement(TestIdStripper, null, React.createElement(Story)),
        ),
      ),
    );
  }

  const resolvedTheme =
    theme === "dark" ? ("dark" as const) : ("light" as const);

  return React.createElement(
    "div",
    {
      "data-theme": theme,
      style: isFullscreen
        ? {
            backgroundColor: "var(--color-bg-primary)",
            color: "var(--color-text-primary)",
            height: "100%",
          }
        : {
            backgroundColor: "var(--color-bg-primary)",
            color: "var(--color-text-primary)",
            minHeight: "100%",
            padding: "16px",
          },
    },
    React.createElement(
      AntThemeWrapper,
      { resolvedTheme },
      React.createElement(Story),
    ),
  );
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Theme for components",
      toolbar: {
        title: "Theme",
        items: THEME_TOOLBAR_ITEMS,
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [withTheme],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
};

export default preview;
