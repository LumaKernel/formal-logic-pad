- [x] infinite canvasは拡大縮小、元のサイズ、特定のサイズ指定、などなどをUIでも提供してほしい
- [ ] Figmaなどの既存アプリケーションから学べる infinite canvas に利用できるであろう機能があればリストアップしてタスク計画を立てよう。
- [ ] http://localhost:13006/?path=/story/infinitecanvas-infinitecanvas--default ← またまっしろになっていそうだ。 playwright mcpを活用しよう。
- [ ] http://localhost:13006/?path=/story/infinitecanvas-fulldemo--interactive この例は相変わらずノードと線が離れている
    - ノードの横幅が足りないのか、線の始まる位置の計算がおかしいのだろう。pw mcp,chrome devtoolsでcomputed value/rect boundariesなどを見てみてほしい。
- [ ] http://localhost:13006/?path=/story/formulainput-formulainput--valid-input&globals=theme:side-by-side
    ダークモードでレンダーされたものがみにくい。コントラストを確認すべきだ。pw mcp,chrome devtools, computed values,スクショを活用せよ。
- [ ] http://localhost:13006/?path=/story/proofpad-proofworkspace--invalid-mp-application&globals=theme:side-by-side
        ダークモードで Logic System: Lukasiewicz と上側に固定されている部分は、コントラストによって見えにくい。 pw mcp,chrome devtools, computed values,スクショを活用せよ。
