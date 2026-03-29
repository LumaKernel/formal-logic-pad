# 差し込みタスク

- [ ] http://localhost:13006/?path=/story/pages-workspace--quest-complete-pred-adv-11-model-answer
  - 関係のない公理 (all x. (phi -> phi)) -> (phi -> (all x. phi)) が使われているがprovedになる。
  - [x] まず、ずっと書いているように、各ゴールは使っていい公理と共に定義される — 全127ヒルベルト流クエストに `allowedAxiomIds` を設定済み。模範解答で使用する公理のみ許可。
    - 構造は既存の `QuestDefinition.allowedAxiomIds` と `QuestGoalDefinition.allowedAxiomIds` をそのまま活用。
    - ND/SC/TAB/ATは既存の `allowedRuleIds`/`disallowedScRuleIds` で同等の制御が可能。
    - [x] 他の流派についても検討（ND/SC/TAB/AT向けの制約設定）
      - ND: 全35クエストに `allowedRuleIds` 設定（模範解答の使用ルールを自動抽出）
      - SC: 通常29クエストに `disallowedScRuleIds: ["cut"]` 設定
      - TAB/AT: インフラ不足（InferenceRuleIdが粗い、依存追跡関数未実装）のため将来タスク

- [ ] http://localhost:13006/?path=/story/pages-workspace--quest-complete-sc-01-from-hub などは、
  - 各ステップで、クエストが完了すべきでないタイミングで完了してないこと(provedとなっていない)をassertもするべきだ
  - [x] まずはこれをするタスクリストを各クエストについて作る (1 by 1) → `tasks/quest-intermediate-asserts.md` に作成

- [ ] vercelでビルドするときに、Next.js publicとして、どこかのサブディレクトリに、パス /storybook 配下に、ストーリーブックのプロダクションビルドを含めて配布されるようにしよう
  - Next.js側がプロダクションビルドされたとき(にビルドしてそのように構成される)のみでよい

- [ ] すべてのビルトインクエストについて、一個ずつ、以下のようなタスクリストを ./quest-stories.md に作る
  - すべてのタスクについて漏れなく入れる。また、1回のイテレーションで一個ずつ処理する。(一気にやるな、タスクリストにも明記しておけ)
  ```
  - [ ] (対象タスクを特定するための詳細)
      - [ ] Quest Complete ... タスクが存在していなければ作成する
      - [ ] 模範解答とクエスト攻略ストーリーをそれぞれ比べて、意図通りにそれぞれなっているか確認する
          - 必要に応じてそれぞれを修正する
  ```
