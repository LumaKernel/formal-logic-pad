# 現在のタスク

**出典:** `tasks/inserted-tasks.md`

## 対象タスク

- [ ] 実際のカット除去クエストを作成する（cut付き証明 → cut除去で再証明）

## コンテキスト

- `QuestInitialState` で事前配置ノード/エッジを持つクエスト開始が可能
- `disallowedScRuleIds: ["cut"]` で cut 規則を禁止可能
- 既存 sc-ce カテゴリは「cut を使って証明」。新クエストは「cut 付き証明を見て、cut なしで再証明」

## テスト計画

- 新クエストは `builtinQuests` 配列に追加するのみ。型チェック + 既存テスト通過で十分
- HubPageView.stories.tsx は `builtinQuests.slice(0, 20)` なので影響なし
- モデル解答テストは今回のスコープ外（後続タスク）

## ストーリー計画

- UI変更なし。ストーリー追加不要。

## 実装計画

1. sc-ce カテゴリに 2-3 個のカット除去実践クエスト（sc-cer-01〜）を追加
   - initialState: カット付き証明のノード/エッジ
   - goals: 同じ定理を disallowedScRuleIds: ["cut"] で証明
2. クエスト翻訳を en.json / ja.json に追加
3. typecheck + lint 通過確認
