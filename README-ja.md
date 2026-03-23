# Formal Proof Pad

[![codecov](https://codecov.io/gh/LumaKernel/formal-proof-pad/graph/badge.svg)](https://codecov.io/gh/LumaKernel/formal-proof-pad)

[English README](./README.md)

命題論理と述語論理の形式的証明を対話的に構築するWebアプリケーション。ヒルベルト流、自然演繹、シーケント計算の証明体系に対応している。

## 機能

- 無限キャンバス上でのドラッグ&ドロップによる証明構築
- ヒルベルト流公理的証明（モーダスポネンス、汎化）
- 自然演繹（導入規則、除去規則）
- シーケント計算（LJ / LK）、カット除去付き
- 命題論理・述語論理の演習問題（クエストモード）
- 真理値表の生成と論理式の評価
- 証明コレクションの管理（保存、読込、インポート/エクスポート）
- ダーク/ライトテーマ
- 英語・日本語対応

## 要件

- Node.js 22以降
- npm

## 開発の開始

```
npm install
npm run dev
```

開発サーバーは http://localhost:13000 で起動する。

## テスト

```
npm run test:run
npm run coverage
```

## Storybook

```
npm run storybook
```

Storybookは http://localhost:13006 で起動する。

## ライセンス

ライセンス情報はリポジトリを参照のこと。
