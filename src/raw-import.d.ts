/**
 * ?raw サフィックス付きインポートの型宣言。
 * ファイルの内容をテキスト文字列として返す。
 *
 * Vite (Storybook/Vitest) と Next.js webpack (next.config.ts の asset/source) の両方で動作。
 */
declare module "*?raw" {
  const content: string;
  export default content;
}
