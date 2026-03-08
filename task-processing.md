## 実行中タスク

カバレッジ改善: scApplicationLogic.ts / tabApplicationLogic.ts のパラメータデフォルト(`?? ""` / `?? 0` / `?? 1`) と cutElimination.ts の switch-line artifact 対応

出典: カバレッジレポート（Branch 96.93% → 改善目標）

### テスト計画

- `scApplicationLogic.test.ts`: パラメータ省略時のデフォルト値テスト追加（conjunction-left componentIndex省略、universal-left/right/existential-left/right パラメータ省略）
- `tabApplicationLogic.test.ts`: パラメータ省略時のデフォルト値テスト追加（exchange exchangePosition省略、universal/neg-universal/existential/neg-existential パラメータ省略）
- 必要に応じて防御的コードにv8 ignoreを追加

### ストーリー計画

UI変更なし
