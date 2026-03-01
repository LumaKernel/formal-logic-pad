# カバレッジ改善: ProofWorkspace.tsx の未カバー行テスト追加

ソース: カバレッジレポート（Stmts 95.06%, Lines 98.38%）

## 未カバー行と計画

### ProofWorkspace.tsx

1. **Lines 3698-3702**: `AllAchievedButAxiomViolation` の公理違反詳細表示
   - クエストモードで `allowedAxiomIds` 制限付きゴールを設定し、制限外公理で達成するシナリオ
   - テストファイル: `ProofWorkspace.test.tsx`

2. **Line 783**: `setWorkspaceWithAutoLayout` で autoLayout=true, ノード/コネクション数変化なし
   - autoLayout=true でノード内容のみ変更するシナリオ（数式テキスト変更等）
   - テストファイル: `ProofWorkspace.test.tsx`

3. **Line 1298**: TAB規則の適用成功ケース
   - TABシステムでTAB規則を正常に適用するシナリオ
   - テストファイル: `ProofWorkspace.test.tsx`

4. **Lines 2058-2059**: 代入プロンプトフォールバック（空エントリ）
   - メタ変数が見つからない場合のフォールバック
   - テストファイル: `ProofWorkspace.test.tsx`

5. **Line 2273**: ワークスペースメニューのクリック外閉じ
   - ワークスペースメニューを開いてメニュー外クリック
   - テストファイル: `ProofWorkspace.test.tsx`

6. **Lines 1500-1502**: マージ対象のprotected nodeフィルタ
   - マージモードでprotected nodeがある場合
   - テストファイル: `ProofWorkspace.test.tsx`

## テスト計画

- `ProofWorkspace.test.tsx` にテストケースを追加
- 上記6箇所のうち、テスト可能なものから着手
- ストーリー変更: 不要（UIロジックの網羅のみ）
