import "katex/dist/katex.min.css";
import "../src/app/globals.css";
import type { Decorator, Preview } from "@storybook/nextjs-vite";
import React from "react";

const THEME_TOOLBAR_ITEMS = [
  { value: "light", icon: "sun", title: "Light" },
  { value: "dark", icon: "moon", title: "Dark" },
  { value: "side-by-side", icon: "sidebyside", title: "Side by Side" },
];

/**
 * Theme decorator that sets data-theme attribute on a wrapper div.
 * For "side-by-side" mode, renders the story twice (light + dark) in a flex container.
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
          ...(isFullscreen
            ? { height: "100%" }
            : { minHeight: "100%" }),
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
        React.createElement(Story),
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
        React.createElement(Story),
      ),
    );
  }

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
    React.createElement(Story),
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
