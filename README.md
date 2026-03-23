# Formal Proof Pad

[![codecov](https://codecov.io/gh/LumaKernel/formal-proof-pad/graph/badge.svg)](https://codecov.io/gh/LumaKernel/formal-proof-pad)

[日本語版 README はこちら](./README-ja.md)

An interactive web application for constructing formal proofs in propositional and predicate logic. Supports Hilbert-style, natural deduction, and sequent calculus proof systems.

## Features

- Visual proof construction on an infinite canvas with drag-and-drop
- Hilbert-style axiomatic proofs (modus ponens, generalization)
- Natural deduction (introduction and elimination rules)
- Sequent calculus (LJ / LK) with cut elimination
- Quest mode with guided exercises for propositional and predicate logic
- Truth table generation and formula evaluation
- Proof collection management (save, load, import/export)
- Dark and light theme support
- English and Japanese localization

## Requirements

- Node.js 22 or later
- npm

## Getting Started

```
npm install
npm run dev
```

The development server starts at http://localhost:13000.

## Testing

```
npm run test:run
npm run coverage
```

## Storybook

```
npm run storybook
```

Storybook starts at http://localhost:13006.

## License

See the repository for license information.
