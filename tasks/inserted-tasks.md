# 差し込みタスク

- [ ] v8 ignoreすべきところは、ひとつの場所に集約されているべきだと考える。
  - [x] まずは現在の v8 ignore を分析、分類。（851箇所/107ファイル。12カテゴリに分類。task-processing.mdに詳細記録）
  - [x] map系は、 https://github.com/LumaKernel/const-map-ts の makeConstMap を利用できるところは利用する（workspaceBridge.ts scTagToRuleName をmakeConstMap化。referenceEntry.ts/questDefinition.ts はmodule-level Map化。makeConstMapWithReturnTypeは未使用）
    - 一旦、makeConstMapWithReturnTypeはバグってるので利用しない。
  - [x] `.../_unsafe` のようなフォルダに v8 ignore をすべき対象を集約する。（src/lib/\_unsafe/ にunsafeMapGet, unsafeAssertDefined作成。coverage除外。referenceViewerLogic, goalPanelLogic, commandPaletteに適用。v8 ignore 4箇所削除）
    - このフォルダ自体はその近い関心の場所にローカルに作ってよい。が、なるべく数が少なくなるように、そして、ignoreしてしかるべきところがはっきりするように切り分ける。
    - [ ] modelAnswer.ts（57箇所）への\_unsafe適用は未実施。applyNdStep/resolveNodeIdパターンが大量にあり別途対応が必要

- [ ] ドキュメント内の用語でもすぐ飛べるような仕組みを用意
  - [ ] 既存の飛ばすことができる用語は飛ぶように変更していく
- [ ] 既存のドキュメントに現在のアプリの仕様と乖離して古い記述がないか精査

- [ ] 参考文献の書き方はもっとしっかり。下側に文献リストを表示できる機能と、そこへのリンクと戻り。戸次、だけではなく、もっとアカデミックで標準的な方法で
