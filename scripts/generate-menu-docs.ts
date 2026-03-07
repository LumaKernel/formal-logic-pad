#!/usr/bin/env npx tsx
/**
 * dev/menu-ux-design.md の「現状のアクション一覧と起点」セクションを
 * menuActionDefinition.ts のデータから自動生成して更新するスクリプト。
 *
 * 使い方:
 *   chmod +x scripts/generate-menu-docs.ts
 *   ./scripts/generate-menu-docs.ts
 *
 * または:
 *   npx tsx scripts/generate-menu-docs.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  allMenuActions,
  generateMenuDocMarkdown,
} from "../src/lib/proof-pad/menuActionDefinition";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DESIGN_DOC_PATH = resolve(__dirname, "../dev/menu-ux-design.md");

// 生成するセクション
const generatedSection = generateMenuDocMarkdown(allMenuActions, "ja");

// 既存ファイルを読み込み
const existingContent = readFileSync(DESIGN_DOC_PATH, "utf-8");

// セクションの開始マーカーと次のセクション開始を特定
const sectionStart = "## 現状のアクション一覧と起点";
const startIndex = existingContent.indexOf(sectionStart);

if (startIndex === -1) {
  // セクションが存在しない場合、背景・課題セクションの後に挿入
  const bgSection = "## 背景・課題";
  const bgIndex = existingContent.indexOf(bgSection);
  if (bgIndex === -1) {
    console.error(
      "Error: Neither '## 現状のアクション一覧と起点' nor '## 背景・課題' found in design doc",
    );
    process.exit(1);
  }

  // 背景セクションの次のセクション（## で始まる行）を探す
  const afterBg = existingContent.indexOf("\n## ", bgIndex + bgSection.length);
  const insertPos = afterBg === -1 ? existingContent.length : afterBg;

  const newContent =
    existingContent.slice(0, insertPos) +
    "\n" +
    generatedSection +
    "\n" +
    existingContent.slice(insertPos);

  writeFileSync(DESIGN_DOC_PATH, newContent, "utf-8");
  console.log("Inserted new section into", DESIGN_DOC_PATH);
} else {
  // 既存セクションを置換: 次の "## " まで（または EOF）
  const nextSectionIndex = existingContent.indexOf(
    "\n## ",
    startIndex + sectionStart.length,
  );
  const endIndex =
    nextSectionIndex === -1 ? existingContent.length : nextSectionIndex;

  const newContent =
    existingContent.slice(0, startIndex) +
    generatedSection +
    "\n" +
    existingContent.slice(endIndex);

  writeFileSync(DESIGN_DOC_PATH, newContent, "utf-8");
  console.log("Updated section in", DESIGN_DOC_PATH);
}
