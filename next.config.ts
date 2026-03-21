import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,
  webpack: (config) => {
    // ?raw サフィックスでファイルをテキスト文字列としてインポート可能にする
    // (Vite の ?raw と同等。builtin-api.d.ts 等をMonaco Editorに渡す用途)
    config.module.rules.push({
      resourceQuery: /raw/,
      type: "asset/source",
    });
    return config;
  },
};

export default withNextIntl(nextConfig);
