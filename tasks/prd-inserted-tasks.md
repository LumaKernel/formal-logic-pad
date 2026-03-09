# 差し込みタスク

- [ ] マイコレクションはメニューから開くものではなく、常駐ウィンドウとしてあってよいだろう。
  - [ ] 折り畳むなどはできてよさそうだ
- [-] bug: 論理式ノードが結局、ダブルクリックで編集開始できない
- [ ] コンテキストメニューからの論理式ノード追加をしたときは、編集中の状態へ自動移行したほうがよい
- [ ] MP適用などのモーダルの、論理式入力のところは、論理式入力のための共通UIをせっかく作ったのだから、それを利用したクリックから開始して、離れたらrenderされるやつを使うほうがよいだろう
  - [ ] 基本すべての箇所において、 phi -> phi とかのままではなく、編集から離れたら render されるように共通化されるべき
- [ ] SHIFT押しながら、cmd(ctrl on win)押しながらで、選択を個別ノードごとに切り替える (選択なしなら選択を開始する) ことができるように
- [ ] 各種浮いているウィンドウは移動できるように。パッド内の端にはスナップするように。また、他のウィンドウもよけて自動調整した場所にスナップされるように。
  - [ ] まずは純粋関数から
- [ ] story customquestlist ← 結局カスタムクエストはどこから使えるのか？タブなどが無いように見えるが
  - [ ] 当時のコミットと意図から確認
- [ ] Proof Complete (Axiom Restriction Violated) ← その場合はCompletedではないんよ。Goal一覧でもProofedとすべきではなく、そちらにナンタラviolatedと書いてあげるのがよいだろう。
- [ ] FORMATTING_ERROR: The intl string context variable "axiomIds" was not provided to the string "不足する公理: {axiomIds}"
      src/app/workspace/[id]/WorkspaceContent.tsx (219:31) @ useProofMessagesFromIntl

          217 |       collectionRootEntries: t("collectionRootEntries"),
          218 |       collectionFolderEntryCount: String(t.raw("collectionFolderEntryCount")),
        > 219 |       collectionAxiomWarning: t("collectionAxiomWarning"),
              |                               ^
          220 |       collectionStyleMismatch: t("collectionStyleMismatch"),
          221 |     }),
          222 |     [t],

        Call Stack 27
        Show 23 ignore-listed frame(s)
        useProofMessagesFromIntl
        src/app/workspace/[id]/WorkspaceContent.tsx (219:31)
        WorkspaceInner
        src/app/workspace/[id]/WorkspaceContent.tsx (232:3)
