# 差し込みタスク

- [ ] http://localhost:13000/workspace/notebook-... ノート作成して開始するとエラーが出る
      Removing a style property during rerender (background) when a conflicting property is set (backgroundColor) can lead to styling bugs. To avoid this, don't mix shorthand and non-shorthand properties for the same value; instead, replace the shorthand with separate values.

        src/lib/formula-input/FormulaInput.tsx (296:9) @ FormulaInput

          294 |           </div>
          295 |         )}
        > 296 |         <input
              |         ^
          297 |           ref={inputRef}
          298 |           type="text"
          299 |           value={value}

        Call Stack 138
        Show 130 ignore-listed frame(s)
        input
        unknown (0:0)
        FormulaInput
        src/lib/formula-input/FormulaInput.tsx (296:9)
        ProofWorkspace[substPromptEntries.map()]
        src/lib/proof-pad/ProofWorkspace.tsx (3731:17)
        ProofWorkspace
        src/lib/proof-pad/ProofWorkspace.tsx (3705:30)
        WorkspacePageView
        src/app/workspace/[id]/WorkspacePageView.tsx (177:11)
        WorkspaceInner
        src/app/workspace/[id]/WorkspaceContent.tsx (262:5)
        WorkspaceContent
        src/app/workspace/[id]/WorkspaceContent.tsx (279:7)
        WorkspacePage
        src/app/workspace/[id]/page.tsx (10:10)

- [ ] サブツリーだけでなく、そのノードまでの証明で必要なものをすべて選択、というのも提供しよう。
- [ ] 自由帳への変換はもとのクエスト版も残して。(なので、複製して変換、というのが正しい挙動とも言えそう)
- [ ] セレクションメニューとして、マージできないものなのにマージアクションは有効であるべきではないだろう。
- [ ] なにもないところのコンテキストメニューではペーストが出るべきだろう
- [ ] ノートAから証明図をコピーして、別の(近いタイプの)ノートBへペーストして証明を続きから書ける、というストーリーを作成しよう。必要に応じて機能追加もしよう。
- [ ] ノートAから証明図をコピーして、別の(互換性のないタイプの)ノートBへペーストしようとするが、互換性がない旨のエラーが表示される、というストーリーを作成しよう。必要に応じて機能追加もしよう。
- [ ] セレクションのメニューに「ペースト」は必要だろうか？
- [ ] セレクションしながら一個を移動したら、選択されてるすべてが同時に相対的な位置を保って平行に移動することを期待するのが通常だろう。ストーリーと機能追加を。
- [ ] ノードをドラッグで掴みながら移動しているときもたまにブラウザネイティブのセレクションが開始してしまう。イベントを止めるべきだろう。
- [ ] クエストを自由帳に変換したら、ゴール一覧は消えるべきだろうし、そもそも適切にdiscriminated unionにして存在すらそもそもできないようにするべきだろう。
      変換された自由帳は、かつてクエストであったことを完全に忘却すべきだ。
- [ ] ノートの体系タグの近くにボタン、または体系名そのものをクリックから、体系に関する解説ウィンドウを起動できるように
- [ ] 各公理呼び出しの近くにクリックから、体系に関する解説ウィンドウを起動できるような機能を追加
- [ ] 証明を保存する、マイなんたらみたいな、自分だけの証明コレクションを作れるようにしよう。
  - [ ] 目的は、再利用するための機能を提供すること。
  - [ ] 特定のノードについて、そのメニューから、それを証明する証明図をそこに追加できる
  - [ ] 追加自体は追加の入力などは必要とせず完了する。
  - [ ] あとで詳細的に、名前やメモは簡単に追加して管理できる。
  - [ ] フォルダ分けなどでの管理もできる
  - [ ] 証明は互換性があれば、公理系が違うものでも呼び出せる。
    - 証明自体は、公理系の情報は忘れて、互換性が重要なノートのモードについてのみ知っている状態に
  - [ ] 公理の互換性がなくても呼びだせるが、単に、公理系にない公理が使われていたら、警告マークがついて、それでも呼び出すことができる、という仕組みにする
- [ ] http://localhost:13000/ ノートブック一覧側でも、クエストについては、クエストの進行状況(computable)を一覧からも確認できるようにしてほしい。
- [-] 論理式ノードを追加してダブルクリックしても編集を開始できない。また、クリックして…と表示されるままになっている。クリックではなくダブルクリックだろう。
- [-] 論理式ノードに、「論理式を編集」的なコンテキストメニューもあってよいだろう。
- [ ] ドラッグでのキャンバス移動もブラウザネイティブのセレクションが始まってしまう。
