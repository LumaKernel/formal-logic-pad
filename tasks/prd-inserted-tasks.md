- [x] infinite canvasは拡大縮小、元のサイズ、特定のサイズ指定、などなどをUIでも提供してほしい
- [x] Figmaなどの既存アプリケーションから学べる infinite canvas に利用できるであろう機能があればリストアップしてタスク計画を立てよう。 → `tasks/prd-infinite-canvas-enhancements.md` に計画作成済み
- [x] http://localhost:13006/?path=/story/infinitecanvas-infinitecanvas--default ← またまっしろになっていそうだ。 playwright mcpを活用しよう。 → テーマデコレーターのfullscreenレイアウト対応で修正
- [x] http://localhost:13006/?path=/story/infinitecanvas-fulldemo--interactive この例は相変わらずノードと線が離れている → ノードサイズをDOM実測方式に変更して修正
  - ノードの横幅が足りないのか、線の始まる位置の計算がおかしいのだろう。pw mcp,chrome devtoolsでcomputed value/rect boundariesなどを見てみてほしい。
- [x] http://localhost:13006/?path=/story/formulainput-formulainput--valid-input&globals=theme:side-by-side → CSS変数化で修正
      ダークモードでレンダーされたものがみにくい。コントラストを確認すべきだ。pw mcp,chrome devtools, computed values,スクショを活用せよ。
- [x] http://localhost:13006/?path=/story/proofpad-proofworkspace--invalid-mp-application&globals=theme:side-by-side → ProofWorkspace/AxiomPaletteのCSS変数化で修正
      ダークモードで Logic System: Lukasiewicz と上側に固定されている部分は、コントラストによって見えにくい。 pw mcp,chrome devtools, computed values,スクショを活用せよ。
- [x] http://localhost:13006/?path=/story/notebook-notebooklist--open-action&globals=theme:side-by-side → TestIdStripperデコレータで dark pane の testid 除去
    side by sideで開くと、interactionsが失敗する。抽象化、DI化が足りていなくて干渉してるのではないか?
    check with pw mcp!
- [ ] http://localhost:13006/?path=/story/notebook-notebookcreateform--default&globals=theme:dark
    ダークモードでselectedなやつのタイトル部分がコントラストが悪い。
- [ ] http://localhost:13006/?path=/story/notebook-notebookcreateform--default
    クエストはあくまでもクエストのマップから選ぶときにクエストモードで自動的に開始されるというだけで、ユーザーがこのような画面で自分で選ぶものではない。
