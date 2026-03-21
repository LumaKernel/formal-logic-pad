from: tasks/inserted-tasks.md (line 5)

タスク: スクリプトを各種目的で書くということに際した入門的ドキュメントをより充実させよう

## 計画

### テスト計画

- referenceContent.test.ts: 新しいガイドエントリ ID が allReferenceEntries に含まれることを確認（既存パターンに沿う）
- 既存の網羅性テストが新エントリを含めて通ることを確認

### ストーリー計画

- ReferenceTab ストーリーは全エントリ表示なので自動的にカバーされる

### 実装方針

1. referenceContent.ts に "guide-intro-scripting" ガイドエントリを追加
   - スクリプトエディタの概要、使い方、テンプレートの利用方法、API 概要
   - 日英両方の本文
   - order: 15（最後の guide の次）
2. 関連エントリ・キーワード設定
