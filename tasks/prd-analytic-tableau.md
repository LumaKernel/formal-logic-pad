# PRD: 分析的タブロー（Analytic Tableau）

## はじめに

bekki.pdf 第6章に基づき、分析的タブロー（analytic tableaux / semantic tableaux）を実装する。分析的タブローは背理法に基づく証明法であり、証明したい命題の否定を仮定し、木構造上で規則を適用しながらすべての枝を閉じること（矛盾の導出）で証明を完成させる。

既に実装済みの TAB（タブロー式シーケント計算, Ch.12）とは本質的に同じ規則を持つが、表現方法が根本的に異なる:

- **TAB**: シーケント Γ ⇒ の左辺に論理式を並べる。ノードはシーケント
- **分析的タブロー**: 木構造の枝に論理式を並べる。ノードは個別の論理式。枝が分岐し、φと¬φが同一枝上に出現すると閉じる

教育的には、分析的タブローの方が直感的（「矛盾を見つけるゲーム」）であり、TABとの対比でシーケント計算の理解も深まる。

## 設計方針

### 既存 TAB との関係

- 分析的タブローは **独立した証明システム** として実装する（TABの別表記ではなく）
- データ型・ロジック・テストは `src/lib/logic-core/analyticTableau.ts` に配置
- UI統合は既存の InfiniteCanvas + ProofWorkspace パターンに従う
- TABとの等価性はリファレンスエントリで解説する

### アーキテクチャ

3層分離パターンに従う:

1. **純粋データ定義 + バリデーション** (`analyticTableau.ts`): 木構造・規則・閉じ判定
2. **適用ロジック** (`atApplicationLogic.ts`): ワークスペース上での規則適用
3. **UI** (`AtRulePalette.tsx` + `ProofWorkspace.tsx` 統合)

## タスク一覧

### AT-001: 分析的タブローのデータ型定義とバリデーション

**説明:** 分析的タブローの木構造・規則・閉じ判定を純粋ロジックとして定義する。

**受け入れ基準:**

- [x] `src/lib/logic-core/analyticTableau.ts` を新規作成
- [x] **署名付き論理式（Signed Formula）** の定義:
  - `SignedFormula`: `{ sign: "T" | "F"; formula: Formula }` （T=真を仮定, F=偽を仮定）
  - bekki 6.5節の簡略化記法に対応: T(φ) = φ, F(φ) = ¬φ と同等だが、内部的に符号を保持
- [x] **タブロー規則の定義** (定義6.2 + 6.24 に基づく):
  - 非分岐規則（α規則）:
    - T(φ∧ψ) → T(φ), T(ψ)
    - F(φ∨ψ) → F(φ), F(ψ)
    - F(φ→ψ) → T(φ), F(ψ)
    - T(¬¬φ) → T(φ) / F(¬¬φ) → F(φ)（二重否定除去）
    - T(¬φ) → F(φ) / F(¬φ) → T(φ)（否定の符号反転）
  - 分岐規則（β規則）:
    - F(φ∧ψ) → [F(φ) | F(ψ)]
    - T(φ∨ψ) → [T(φ) | T(ψ)]
    - T(φ→ψ) → [F(φ) | T(ψ)]
  - 量化子規則（γ/δ規則）:
    - γ: T(∀ξφ) → T(φ[τ/ξ]), F(∃ξφ) → F(φ[τ/ξ]) （任意の項τ）
    - δ: F(∀ξφ) → F(φ[ζ/ξ]), T(∃ξφ) → T(φ[ζ/ξ]) （固有変数ζ）
  - 公理（枝の閉じ条件）:
    - 同一枝上に T(φ) と F(φ) が存在 → 閉じる（×）
    - 注: ⊥/⊤ は Formula union に存在しないため対応しない
- [x] **タブロー規則ID** の定義: `AtRuleId` discriminated union
- [x] **分類ヘルパー**: `isAlphaRule`, `isBetaRule`, `isGammaRule`, `isDeltaRule`, `getAtRuleDisplayName`, `allAtRuleIds`
- [x] **バリデーション**: 規則適用の正当性チェック（対象論理式の構造、固有変数条件など）
- [x] `src/lib/logic-core/analyticTableau.test.ts`: 全規則のテスト + 閉じ判定 + 実践的証明例
- [x] `src/lib/logic-core/index.ts`: エクスポート追加
- [x] 型チェック/lint/test が通る

### AT-002: 分析的タブローの規則適用ロジック [x]

**説明:** ワークスペース上での分析的タブロー規則適用のバリデーションと InferenceEdge 統合。

**受け入れ基準:**

- [x] `src/lib/proof-pad/atApplicationLogic.ts` を新規作成
- [x] `AtInferenceEdge` 型の定義（InferenceEdge union に追加）:
  - `AtAlphaEdge`: α規則（1前提 → 1or2結論）
  - `AtBetaEdge`: β規則（1前提 → 2枝分岐）
  - `AtClosedEdge`: 枝の閉じマーク（公理に相当）
  - `AtGammaEdge` / `AtDeltaEdge`: 量化子規則
- [x] **規則適用バリデーション**: `validateAtApplication()` — Either ベースの結果型
- [x] **エラー型**: `AtFormulaParseError`, `AtPrincipalFormulaMismatch`, `AtEigenVariableError`, `AtTermParseError`
- [x] `src/lib/proof-pad/atApplicationLogic.test.ts`: 全規則のバリデーションテスト
- [x] `src/lib/proof-pad/inferenceEdge.ts` に AT エッジの型ガード・ユーティリティ追加
- [x] `src/lib/proof-pad/inferenceEdgeLabelLogic.ts` に AT エッジの色・ラベル追加
- [x] `src/lib/proof-pad/edgeBadgeEditLogic.ts` に AT エッジ対応追加
- [x] `src/lib/proof-pad/workspaceExport.ts` に AT エッジのシリアライゼーションスキーマ追加
- [x] `src/lib/proof-pad/workspaceState.ts` に AT 規則適用の状態管理関数追加
- [x] 型チェック/lint/test が通る

### AT-003: 分析的タブロー規則パレット UI [x]

**説明:** 分析的タブロー用の規則パレット UI コンポーネントを作成し、ProofWorkspace に統合する。

**受け入れ基準:**

- [x] `src/lib/proof-pad/AtRulePalette.tsx` を新規作成
  - α規則・β規則・量化子規則・閉じマークをグループ化して表示
  - 各規則のクリックで適用モードに入る
  - 「論理式追加」ボタン（タブローの根を作成）
- [x] `src/lib/proof-pad/AtRulePalette.test.tsx`: コンポーネントテスト
- [x] `ProofWorkspace.tsx` に AT パレットの統合
  - 演繹体系が「分析的タブロー」の場合に AT パレットを表示
  - 規則クリック → ノード選択 → 規則適用フロー
- [x] deductionSystem.ts に `"analytic-tableau"` を DeductionSystemId に追加
- [x] ノートブック作成時に分析的タブローを選択可能にする
- [x] 型チェック/lint/test が通る
- [x] Playwright MCP でブラウザ確認・スクリーンショット

### AT-004: 分析的タブロー用クエスト [x]

**説明:** 分析的タブローの学習用クエストを追加する。

**受け入れ基準:**

- [x] `src/lib/quest/builtinQuests.ts` に分析的タブロークエスト5-10問を追加:
  - 基本: P ∨ ¬P の証明（排中律）
  - 含意: P → (Q → P) の証明
  - 二重否定: ¬¬P → P の証明
  - 分配律: P ∧ (Q ∨ R) ⊨ (P ∧ Q) ∨ (P ∧ R)
  - 対偶: (P → Q) → (¬Q → ¬P) の証明
  - De Morgan: ¬(P ∧ Q) ⊨ ¬P ∨ ¬Q
  - 量化子基本: ∀x.F(x) ⊨ ∃x.F(x)
- [x] `src/lib/quest/builtinQuests.test.ts`: クエスト数更新
- [x] 型チェック/lint/test が通る

### AT-005: 分析的タブローのリファレンスエントリ

**説明:** 分析的タブローの解説リファレンスエントリを追加する。

**受け入れ基準:**

- [ ] `src/lib/reference/referenceContent.ts` に分析的タブローのリファレンスエントリ追加:
  - 分析的タブローとは何か（背理法ベースの証明法）
  - α規則（非分岐）とβ規則（分岐）の解説
  - 枝の閉じ条件と証明の完成
  - 量化子規則（γ/δ規則）と固有変数条件
  - TAB（タブロー式シーケント計算）との対応関係
  - 簡略化記法（6.5節）の解説
- [ ] `src/lib/reference/referenceContent.test.ts`: エントリ数更新
- [ ] EN/JA 両方のパラグラフを作成
- [ ] 型チェック/lint/test が通る

## 設計詳細

### 署名付き論理式（Signed Formula）

分析的タブローの核心は「符号付き論理式」。bekki では [[φ]]\_M,g = 0 / 1 で表記しているが、実装では簡略化記法（6.5節）を採用する:

```
T(φ) ≡ φ が真と仮定     ≡ [[φ]] = 1  ≡ 簡略表記: φ
F(φ) ≡ φ が偽と仮定     ≡ [[φ]] = 0  ≡ 簡略表記: ¬φ
```

内部表現は `{ sign: "T" | "F"; formula: Formula }` とし、表示時に簡略化記法（符号なし、否定として）も選択可能にする。

### ワークスペースでの表現

TAB と同様に、**ワークスペース上ではノード + エッジのグラフ構造**で表現する。ただし:

- **TABのノード**: シーケント（カンマ区切りの論理式リスト）
- **ATのノード**: 個別の署名付き論理式（1ノード = 1論理式）

ATでは1つのノードが1つの署名付き論理式を持ち、木の枝に沿って論理式が並ぶ。分岐規則ではノードが2つの子枝に分かれる。

### TAB との等価性

Ch.12 で証明されている等価性:

- TAB の Γ ⇒ は、分析的タブローの T(Γの各式) に対応
- TAB の規則と分析的タブローの規則は1対1対応
- 分析的タブローで閉じる ⟺ TABで証明可能

この対応関係はリファレンスエントリ（AT-005）で解説する。

## 依存関係

- AT-001 は独立して実装可能（logic-core のみ）
- AT-002 は AT-001 に依存
- AT-003 は AT-002 に依存
- AT-004 は AT-003 に依存（クエストは UI が必要）
- AT-005 は AT-001 に依存（内容的には独立）

## 優先度

1. AT-001 (データ型) → AT-002 (適用ロジック) → AT-003 (UI) の順で実装
2. AT-005 (リファレンス) は AT-001 完了後いつでも着手可能
3. AT-004 (クエスト) は AT-003 完了後に着手
