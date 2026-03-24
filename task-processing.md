# 現在のタスク

**出典:** `tasks/inserted-tasks.md` line 46

> 各ウィンドウでセレクトしてcmd-cしてもテキストをコピーできない。コピーのフックの判定が広すぎる可能性がある。

## 原因分析

`ProofWorkspace.tsx` の `handleKeyDown` (line 4686) が `container` にアタッチされており、
Cmd+C を `e.preventDefault()` で奪っている。INPUT/TEXTAREA/contentEditable のみスキップしているが、
パネル内のテキスト選択（div/span等）はスキップ対象外のため、ネイティブコピーが阻害される。

## 修正方針

`window.getSelection()?.toString()` が非空の場合、Cmd+C をスキップしてブラウザネイティブのコピーを許可する。

## テスト計画

- `ProofWorkspace.tsx` のキーボードハンドラは `/* v8 ignore start */` 内（JSDOMでは検証不可）
- ブラウザテスト（Playwright MCP）で、パネル内テキスト選択→Cmd+C が動作することを確認

## ストーリー計画

- 既存ストーリーで確認。新規ストーリーは不要。
