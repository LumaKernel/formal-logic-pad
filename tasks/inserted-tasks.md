# 差し込みタスク

- [ ] ドキュメント内の用語でもすぐ飛べるような仕組みを用意
  - [ ] 既存の飛ばすことができる用語は飛ぶように変更していく
- [ ] 既存のドキュメントに現在のアプリの仕様と乖離して古い記述がないか精査

- [ ] 参考文献の書き方はもっとしっかり。下側に文献リストを表示できる機能と、そこへのリンクと戻り。戸次、だけではなく、もっとアカデミックで標準的な方法で

- [ ] 多くのドキュメントで、列挙のようなもの (ul, ol) が、それらのタグを使わずに記述されている。これはとても分かりにくい。
  - 例: https://proof.luma.dev/reference/guide-what-is-formal-proof の 1. 絶対的な確実性 …など
  - ほんとにほとんどすべてのドキュメントで、だ。これらはすべて網羅的に逐次的に再確認すべきだ
  - [ ] まずはすべてのドキュメントの先頭に // TODO: ... で処理をする対象だとマークする
  - [ ] 次にそれらを解消していく形で ul/ol 利用を検討していく。

- [ ] まず論理式入力モーダルはどうなってる？散乱してない？それぞれで特殊化ばかりしてない？ちゃんと整理して、共通化するプランをしっかりたてて進めよ。

- [ ] 公理一覧ウィンドウも畳む、動かすことがそれぞれできるようにしよう。

- [ ] 一度タブ画面に移動していたら、ノートが一個もないときのLP画面は出さないようにしよう。(リロードなどしない限り)

- [ ] ページは基本的に移動した状態のスケルトン的な状態で待機するようにしよう (体験的に)。まずは瞬時に移動がしっかり起こるように。
  - タブ切り替え、ノートを開く、模範解答を開く、など

- [ ] カット除去など一部のクエストは、デフォルトの状態を持てるようにしてもよいだろう。
  - [ ] カットされる前の証明が既になされていて、それに対してカット除去を行う、ということをすればカット除去を重点的に学べるだろう
    - このとき、ゴールは使っていい規則としてカットを持たない、というようにすれば、クリアにならない状態で開始できるだろう
    - [ ] ということは、ゴールの各論理式は使っていい規則を持つという構造にしなければいけないね

- [ ] スクリプトエディタによって実行されるスクリプトの世界にEffect.tsが事前ロードされておくようにする方法を探ろう。

- [ ] スクリプトライブラリの カット除去 段階{n} はすべて eliminateCutsWithSteps のような組込みで実装済みのものを使うべきではなく、露出させるべき。

- [ ] コレクションに保存、をしたら、コレクションウィンドウが開いて、対象の保存したばかりのものが詳細表示されている状態にせよ。

- [ ] キャンバスのスクロール操作 (ドラッグ操作) が重たい。なんらかの余計な再描画を毎回待ってたりしないだろうか。
  - ノードの表示域を計算している、などであれば、ある程度その再計算をthrottleさせて計算するなどしつつ、描画範囲を広くしておく、などが考えられるだろうl

- [ ] 前にもあったタスクだが、UI公理へのsubstで`phi:=phi->phi`としたとき、[τ/x]は消えてはいけない。
  - [ ] 置換が消えていいときの話を以前したはずなので、それをまずは確認すべきだ。
  - [ ] そして、置換は常に消えなくていい。ユーザーが自分で整理操作をすることで消す(消せるときは)というふうにすればよい
  - [ ] Simplify Formula操作も用意してあげよう。 (Simplifyで繋がったノードが作られる)

- [ ] コントラストなどのa11y要因の検査を自動テストに組込もう (Storybook)
  以下参考に。
  ## Storybook × アクセシビリティチェック

  Storybookは**公式アドオンが充実していて、むしろPlaywrightより設定が楽**です。

  ---

  ## ✅ `@storybook/addon-a11y`（まず入れる）

  ```bash
  npm install -D @storybook/addon-a11y
  ```

  ```javascript
  // .storybook/main.ts
  addons: ['@storybook/addon-a11y']
  ```

  これだけでStorybook UI上にA11yパネルが出て、各Storyのコントラスト違反がその場で見えます。ただしこれはGUI確認用なので、**Claude Codeに渡すにはCLI実行が必要**です。

  ---

  ## ✅ `@storybook/test-runner` + axe でCLI化

  ```bash
  npm install -D @storybook/test-runner axe-playwright
  ```

  ```typescript
  // .storybook/test-runner.ts
  import type { TestRunnerConfig } from '@storybook/test-runner';
  import { checkA11y, injectAxe } from 'axe-playwright';

  const config: TestRunnerConfig = {
    async preVisit(page) {
      await injectAxe(page);
    },
    async postVisit(page) {
      await checkA11y(page, '#storybook-root', {
        axeOptions: {
          runOnly: {
            type: 'tag',
            values: ['wcag2aa'],   // WCAG AA指定
          },
        },
        verbose: true,             // コントラスト比など詳細を出力
      });
    },
  };

  export default config;
  ```

  ```json
  // package.json
  "scripts": {
    "test:a11y": "storybook build && test-storybook"
  }
  ```

  ---

  ## 出力例（Claude Codeが読める）

  ```
  FAIL  Button/Primary
    ✕ accessibility

    color-contrast (serious)
      .btn-primary のコントラスト比: 2.8:1 (必要: 4.5:1)
      Fix: 背景色 #4a90e2 に対してテキスト色を #ffffff から #000000 へ変更
  ```

  ---

  ## Playwright版と比べた優位点

  | | @axe-core/playwright | Storybook test-runner |
  |---|---|---|
  | コンポーネント単位でチェック | △ページ単位 | ✅ Story単位 |
  | 設定の手軽さ | 普通 | ◎ |
  | Next.jsとの統合 | ✅ | ✅ |
  | デザイナーも確認できる | ❌ | ✅ GUIで見える |
  | 認証が必要なページ | ✅ | △ |

  ---

  ## どちらを選ぶか

  ```
  コンポーネントをStorybookで管理している
          ↓ YES
    → Storybook test-runner（コンポーネント単位で細かく直せる）

  ページ全体・認証後の画面もチェックしたい
          ↓ YES
    → 両方使う（Storybook + Playwright を併用）
  ```

  Next.jsでStorybookを使っているなら、**まずStorybook test-runnerだけで始めて、ページ単位のチェックが必要になったらPlaywrightを追加**、というのが無理のない進め方です。
  
