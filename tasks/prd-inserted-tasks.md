# 差し込みタスク

- [x] Warning: Starting in Storybook 8.5.0-alpha.18, the "test.include" option in Vitest is discouraged in favor of just using the "stories" field in yo
    ur Storybook configuration.

    The values you passed to "test.include" will be ignored, please remove them from your Vitest configuration where the Storybook plugin is applied.

    More info: https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#addon-test-indexing-behavior-of-storybookaddon-test-is-changed
    対処しよう。
    → vitest.config.ts の top-level test.include を削除し、unit project のみに残すことで修正。Storybook project は storybookTest() plugin で stories フィールドから自動発見。
