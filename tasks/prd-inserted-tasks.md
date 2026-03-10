# 差し込みタスク

- [x] BACKが日本語化されてないね
    - [x] Light,Dark,Systemとかもそう。
    - [x] Start Quest, Add to my quests, cancelなども
    - [x] そもそもなぜ漏れる？地の文がないようにできてる？ → messages-as-props パターンでデフォルト英語＋next-intl注入方式に統一。Storybook等next-intl不可環境ではデフォルト英語が表示される設計
- [ ] ヘッダにGitHubへ飛べるボタンを控えめにおいておいて。
- [ ] Warning: Starting in Storybook 8.5.0-alpha.18, the "test.include" option in Vitest is discouraged in favor of just using the "stories" field in yo
    ur Storybook configuration.

    The values you passed to "test.include" will be ignored, please remove them from your Vitest configuration where the Storybook plugin is applied.

    More info: https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#addon-test-indexing-behavior-of-storybookaddon-test-is-changed
    対処しよう。
