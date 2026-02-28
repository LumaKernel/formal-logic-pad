# PRD: ND (自然演繹) ワークスペース対応

> **優先度: 低** — 他の主要タスク完了後に着手する。大規模タスクのため、細かいサブタスクに分割して段階的に進める。

## 背景

現在NDクエスト (qNd01-qNd14) は `questStartLogic.ts` で `style !== "hilbert"` チェックにより起動不可。
ProofWorkspace を NaturalDeductionSystem に対応させ、NDクエストを実際にプレイ可能にする必要がある。
E6 (量化子NDクエスト) の前提条件でもある。

## サブタスク（段階的に進める）

- [ ] **ND-001: 現状のND起動ブロッカー調査**
  - `questStartLogic.ts` の style チェックの詳細確認
  - ProofWorkspace が Hilbert 前提でハードコードされている箇所の洗い出し
  - ND対応に必要な変更箇所のリストアップ

- [ ] **ND-002: ワークスペースのノード種別をND規則に拡張**
  - NDの推論規則（→I, →E, ∧I, ∧E, ∨I, ∨E, ¬I, ¬E, ∀I, ∀E, ∃I, ∃E）に対応するノード/エッジ種別の設計
  - 仮定の「スコープ」（discharge）の表現方法の設計
  - 既存のHilbertモードとの共存設計

- [ ] **ND-003: ND用公理パレットの実装**
  - NDでは公理パレットの代わりに推論規則パレットが必要
  - 仮定の導入UIの設計

- [ ] **ND-004: ND用バリデーションロジック**
  - 各ND規則の適用バリデーション（`naturalDeduction.ts` のロジックをUI層に接続）
  - 仮定のdischarge管理

- [ ] **ND-005: questStartLogicのND対応**
  - `style !== "hilbert"` ブロッカーの解除
  - NDクエスト (qNd01-qNd14) が実際に起動できるようにする

- [ ] **ND-006: E6 量化子NDクエストの実装**
  - ND-005完了後に着手
  - ∀I(Gen), ∀E(A4), ∃I, ∃Eの固有変数条件を学ぶクエスト群
