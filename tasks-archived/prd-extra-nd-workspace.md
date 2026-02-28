# PRD: ND (自然演繹) ワークスペース対応 — アーカイブ済み

- [x] **ND-001: 現状のND起動ブロッカー調査**
  - `questStartLogic.ts` の style チェックの詳細確認
  - ProofWorkspace が Hilbert 前提でハードコードされている箇所の洗い出し
  - ND対応に必要な変更箇所のリストアップ

- [x] **ND-002: ワークスペースのノード種別をND規則に拡張**
  - NDの推論規則（→I, →E, ∧I, ∧E, ∨I, ∨E, ¬I, ¬E, ∀I, ∀E, ∃I, ∃E）に対応するノード/エッジ種別の設計
  - 仮定の「スコープ」（discharge）の表現方法の設計
  - 既存のHilbertモードとの共存設計

- [x] **ND-003: ND用公理パレットの実装**
  - NDでは公理パレットの代わりに推論規則パレットが必要
  - 仮定の導入UIの設計

- [x] **ND-004: ND用バリデーションロジック**
  - 各ND規則の適用バリデーション（`naturalDeduction.ts` のロジックをUI層に接続）
  - 仮定のdischarge管理

- [x] **ND-005: questStartLogicのND対応**
  - `style !== "hilbert"` ブロッカーの解除
  - NDクエスト (qNd01-qNd14) が実際に起動できるようにする
