# 実行中タスク

## タスク（prd-inserted-tasks.md より）

- [ ] ノートの体系タグの近くにボタン、または体系名そのものをクリックから、体系に関する解説ウィンドウを起動できるように

## 周辺情報

- ProofWorkspace.tsx の3392-3403行目に体系バッジが表示されている
- 既存のリファレンスエントリ: system-lukasiewicz, system-mendelson, system-minimal, system-intuitionistic, system-classical, system-predicate
- ND/SC/TAB/AT系のリファレンスエントリはまだない
- DeductionSystem名 → ReferenceEntryId のマッピングが必要
- 既存パターン: axiomPaletteLogic.ts の axiomIdToReferenceEntryId Map

## テスト計画

1. `deductionSystemReferenceLogic.ts` に純粋マッピングロジック → `deductionSystemReferenceLogic.test.ts` でテスト
   - 各DeductionSystem名 → ReferenceEntryId のマッピングテスト
   - 未知の名前 → undefined を返すテスト
2. `ProofWorkspace.test.tsx` に体系名クリック → onOpenReferenceDetail コールバックのテスト追加

## ストーリー計画

- 既存のProofWorkspace.stories.tsx で体系バッジのクリック動作を確認
- referenceEntries prop が渡されている既存ストーリーで自動的に動作するはず

## 実装計画

1. `deductionSystemReferenceLogic.ts` を作成（DeductionSystem名 → ReferenceEntryId マッピング）
2. ProofWorkspace.tsx の体系バッジ(span)をクリック可能にして、onOpenReferenceDetail を呼ぶ
3. referenceEntries から該当エントリを検索してリファレンスを開く
