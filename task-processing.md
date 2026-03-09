## タスク: propositional-intermediate クエスト4問追加

**ソース:** `tasks/prd-logic-pad-world.md` — クエストモード拡充の一環

### 追加する4問

1. **prop-40: 推移律逆順 (B' combinator)**: `(φ → ψ) → ((ψ → χ) → (φ → χ))` — difficulty 3
2. **prop-41: W combinator (自己適用)**: `(φ → (φ → ψ)) → (φ → ψ)` — difficulty 3
3. **prop-42: 前提の吸収**: `(φ → (ψ → (φ → χ))) → (φ → (ψ → χ))` — difficulty 3
4. **prop-43: 含意の前方合成**: `(φ → (ψ → χ)) → ((θ → φ) → (θ → (ψ → χ)))` — difficulty 3

### テスト計画

- `builtinQuests.test.ts` のクエスト数を 227 → 231 に更新
- `builtinModelAnswers.test.ts` で4問の模範解答が自動検証される（既存パターン）

### ストーリー計画

- UI変更なし。HubPageView.stories.tsx は `builtinQuests.slice(0, 20)` のため更新不要

### 模範解答の設計

#### prop-40: (φ → ψ) → ((ψ → χ) → (φ → χ))

prop-07 (C combinator) を prop-10 (B combinator) に適用:
B = (ψ→χ)→((φ→ψ)→(φ→χ))
C(B) = (φ→ψ)→((ψ→χ)→(φ→χ))
つまり prop-07[φ/(ψ→χ), ψ/(φ→ψ), χ/(φ→χ)] をBに適用。

#### prop-41: (φ → (φ → ψ)) → (φ → ψ)

A2[ψ/φ, χ/ψ]: (φ→(φ→ψ))→((φ→φ)→(φ→ψ))
identity: φ→φ
合成して (φ→(φ→ψ))→(φ→ψ)

#### prop-42: (φ → (ψ → (φ → χ))) → (φ → (ψ → χ))

C combinator + W combinator 的合成

#### prop-43: (φ → (ψ → χ)) → ((θ → φ) → (θ → (ψ → χ)))

B combinator のインスタンス: (ψ→χ) を (φ→(ψ→χ)) に、φ を θ に置換
