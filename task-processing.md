## タスク

`tasks/prd-more-tasks.md` より:

- [ ] cmd(ctrl) +/- で拡大縮小できてほしい

## 周辺情報

- ProofWorkspace.tsx にはキーボードショートカットハンドラ（handleKeyDown）があるが、ズームのCmd+/-は未実装
- InfiniteCanvas ライブラリ側（useKeyboardShortcuts.ts, keyboardShortcuts.ts）にはCmd+/-ズーム対応済みだが、ProofWorkspace は useKeyboardShortcuts を使っていない（独自のhandleKeyDownで処理）
- `computeZoomInViewport` / `computeZoomOutViewport` がzoomControls.tsに存在し、viewport + containerSizeからズーム後のviewportを計算
- ブラウザデフォルトの Cmd+/- はページ全体のズームなので、preventDefault が必要

## テスト計画

- ProofWorkspace.stories.tsx に新ストーリー追加は不要（既存の v8 ignore 領域のキーボードイベントはブラウザテストで検証）
- ブラウザテスト（Playwright MCP）で検証:
  1. ProofWorkspaceのストーリーでCmd+/-(ズームイン/アウト)を発火し、ズームレベルが変わることを確認

## ストーリー計画

- UI変更なし（キーボードショートカットの追加のみ）。既存のストーリーで動作確認
