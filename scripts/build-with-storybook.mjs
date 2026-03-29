/**
 * Production build script: Storybook + Next.js
 *
 * 1. Clean up public/storybook/ from previous build (prevents recursive copy)
 * 2. Build Storybook to storybook-static/ (default output)
 * 3. Move storybook-static/ to public/storybook/
 * 4. Build Next.js (which includes public/ in output)
 * 5. Clean up public/storybook/ after Next.js build
 *
 * This makes Storybook available at /storybook path in production.
 *
 * Note: Storybook's staticDirs copies ../public into its output. If
 * public/storybook/ exists during build, it creates a recursive copy.
 * Cleaning up before build prevents this.
 */

import { execSync } from "node:child_process";
import { existsSync, renameSync, rmSync } from "node:fs";

const run = (cmd) => {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { stdio: "inherit" });
};

// Step 1: Clean up stale public/storybook (prevents recursive staticDirs copy)
if (existsSync("public/storybook")) {
  rmSync("public/storybook", { recursive: true });
  console.log("✓ Cleaned up stale public/storybook");
}

// Step 2: Build Storybook
run("npx storybook build");

// Step 3: Move to public/storybook
renameSync("storybook-static", "public/storybook");
console.log("\n✓ Moved storybook-static → public/storybook\n");

// Step 4: Build Next.js
run("npx next build");

// Step 5: Clean up public/storybook (no longer needed after Next.js build)
if (existsSync("public/storybook")) {
  rmSync("public/storybook", { recursive: true });
  console.log("\n✓ Cleaned up public/storybook\n");
}
