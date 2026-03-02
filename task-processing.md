# 申し送り事項

## 模範解答の残りの問題

### propositional-intermediate (2問残り)

- prop-08: 3段推移律 (φ→ψ)→((ψ→χ)→((χ→θ)→(φ→θ))) — 推移律2回適用で長い
- prop-12: 左結合化 ((φ→ψ)→(φ→χ))→(φ→(ψ→χ)) — prop-34 + prop-07 インラインで ~39ステップ

### propositional-negation (6問残り)

- prop-16: MT (φ→ψ)→(~ψ→~φ) — DNI + A3 + 推移律、~50+ステップ
- prop-20: LEM ~phi \/ phi — Disjunction は独立ASTノード。~~phi->phi (DNE) では equalFormula で一致しない。Disjunctionノード生成方法の調査が必要
- prop-21: Peirce ((φ→ψ)→φ)→φ — 非常に長い
- prop-26: CM (φ→~φ)→~φ — Clavius[¬φ] + DNE合成、~70+ステップ
- prop-27: CON2 (φ→~ψ)→(ψ→~φ) — DNI + A3合成、~50+ステップ
- prop-29: TND (φ→ψ)→((~φ→ψ)→ψ) — 非常に長い

### 方針

- 短い証明のもの (prop-08, prop-12) は手動構築可能
- 長いもの (50+ステップ) はプログラマティック生成 (関数でステップ配列を合成) の検討を推奨
- prop-20 は Disjunction AST ノードの生成方法の調査が先決
