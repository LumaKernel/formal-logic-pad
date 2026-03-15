import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/**/*.stories.{ts,tsx}",
        "src/**/index.ts",
        "src/**/types.ts",
        // 純粋なデータ/型定義ファイル（ロジックなし）
        "src/lib/logic-lang/token.ts",
        "src/lib/script-runner/jsInterpreterTypes.ts",
        // Storybookテンプレート（サンプルコード、プロジェクトコードではない）
        "src/stories/**",
        // 不純な領域: フレームワークエントリーポイント・I/O・環境依存
        "src/app/**",
        "src/i18n/**",
        // Monaco Editor ラッパー（外部ライブラリ統合UI、ロジックは scriptEditorLogic.ts に分離）
        "src/components/ScriptEditor/ScriptEditorComponent.tsx",
        // Ant Design統合ラッパー（外部ライブラリ統合、ロジックは themeLogic.ts に分離）
        "src/lib/theme/AntDesignThemeProvider.tsx",
      ],
      reporter: ["text", "html", "lcov"],
    },
    pool: "forks",
    maxWorkers: 2,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["src/**/*.{test,spec}.{ts,tsx}"],
          exclude: ["src/**/*.local.{test,spec}.{ts,tsx}"],
          testTimeout: 30_000,
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
