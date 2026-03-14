/**
 * リファレンスコンテンツ定義。
 *
 * 公理、推論規則、論理体系、概念などの
 * ユーザー向け多言語解説データを提供する。
 *
 * パラグラフ単位でen/jaを対応させ、翻訳の同期を取りやすくする。
 *
 * 変更時は referenceContent.test.ts, referenceEntry.ts も同期すること。
 */

import type { ReferenceEntry } from "./referenceEntry";

// ============================================================
// ガイド (Guides)
// ============================================================

const guideWhatIsFormalProof: ReferenceEntry = {
  id: "guide-what-is-formal-proof",
  category: "guide",
  title: {
    en: "What is Formal Proof?",
    ja: "形式証明とは何か",
  },
  summary: {
    en: "Understanding the difference between informal mathematical proofs and formal proofs.",
    ja: "自然言語による数学的証明と形式証明の違いを理解する。",
  },
  body: {
    en: [
      'In mathematics, we typically write proofs in a mixture of natural language and mathematical notation. For example, we might say: "Let n be an odd number. Then n = 2k + 1 for some integer k. Therefore n² = (2k + 1)² = 4k² + 4k + 1 = 2(2k² + 2k) + 1 is also odd."',

      'While such proofs can be perfectly rigorous, they rely on the reader\'s mathematical intuition and shared understanding of concepts like "odd number," "integer," and algebraic manipulation rules. Different readers might interpret certain steps differently, and there\'s room for ambiguity or hidden assumptions.',

      "<b>Formal proof</b>, in contrast, is written entirely in a precise logical language with explicit rules. Every step must follow from axioms or previously proven statements using only the allowed inference rules. Nothing is left to interpretation.",

      "In a formal proof system:\n• Every statement is a well-formed formula in the logical language\n• Every inference follows an explicit rule (like Modus Ponens)\n• Every assumption is explicitly stated as an axiom or hypothesis\n• The proof can be mechanically verified by a computer",

      "Why formalize proofs? Several reasons:\n<b>1. Absolute certainty:</b> A formal proof leaves no room for error or misinterpretation.\n<b>2. Computer verification:</b> Formal proofs can be checked automatically.\n<b>3. Foundation of mathematics:</b> Understanding how mathematics can be built from first principles.\n<b>4. Discovering proof patterns:</b> Formal systems reveal common proof structures that might be hidden in informal arguments.",

      "This application lets you construct formal proofs interactively. You'll work with <b>formula schemas</b> (patterns like $\\varphi \\to \\psi$) rather than specific formulas, making your proofs maximally general. Each proof you create here could be instantiated with any specific formulas, demonstrating universal logical principles.",

      "As you work through the quests, you'll develop intuition for how formal reasoning works. What seems mechanical at first will reveal deep patterns in logical thinking. Welcome to the world of formal proof!",
    ],
    ja: [
      "数学では通常、自然言語と数学記号を混ぜて証明を書きます。例えば「nを奇数とする。するとある整数kに対してn = 2k + 1と書ける。したがってn² = (2k + 1)² = 4k² + 4k + 1 = 2(2k² + 2k) + 1となり、これも奇数である」というように。",

      "このような証明は十分に厳密でありえますが、「奇数」「整数」といった概念や代数的操作の規則について、読者の数学的直観と共通理解に依存しています。異なる読者が特定のステップを異なって解釈する可能性があり、曖昧さや暗黙の仮定が入り込む余地があります。",

      "対照的に<b>形式証明</b>は、明示的な規則を持つ厳密な論理言語で完全に記述されます。すべてのステップは、許可された推論規則のみを使用して、公理または以前に証明された文から従わなければなりません。解釈の余地は一切ありません。",

      "形式証明体系では：\n• すべての文は論理言語の整形式である\n• すべての推論は明示的な規則（Modus Ponensなど）に従う\n• すべての仮定は公理または仮説として明示的に述べられる\n• 証明はコンピュータによって機械的に検証できる",

      "なぜ証明を形式化するのでしょうか？いくつかの理由があります：\n<b>1. 絶対的な確実性：</b>形式証明には誤りや誤解の余地がありません。\n<b>2. コンピュータ検証：</b>形式証明は自動的にチェックできます。\n<b>3. 数学の基礎：</b>数学が第一原理からどのように構築できるかを理解する。\n<b>4. 証明パターンの発見：</b>形式体系は、非形式的な議論では隠れている共通の証明構造を明らかにします。",

      "このアプリケーションでは、形式証明をインタラクティブに構築できます。特定の論理式ではなく<b>論理式スキーマ</b>（$\\varphi \\to \\psi$のようなパターン）を扱い、証明を最大限一般的にします。ここで作成する各証明は、任意の具体的な論理式でインスタンス化でき、普遍的な論理原理を示しています。",

      "クエストを進めていくうちに、形式推論の仕組みについて直観が養われるでしょう。最初は機械的に見えるものが、論理的思考の深いパターンを明らかにします。形式証明の世界へようこそ！",
    ],
  },
  relatedEntryIds: ["axiom-a1", "rule-mp", "system-lukasiewicz"],
  externalLinks: [],
  keywords: [
    "formal proof",
    "mathematical proof",
    "natural language",
    "形式証明",
    "数学的証明",
    "自然言語",
  ],
  order: 1,
};

const guideBasicOperations: ReferenceEntry = {
  id: "guide-basic-operations",
  category: "guide",
  title: {
    en: "Basic Operations of This Site",
    ja: "このサイトの基本操作",
  },
  summary: {
    en: "Learn how to use the workspace, add and edit nodes, and connect them to build proofs.",
    ja: "ワークスペースの使い方、ノードの追加・編集・接続方法を学び、証明を構築する。",
  },
  body: {
    en: [
      "Welcome to the interactive proof construction workspace! This guide will walk you through the basic operations you need to know to start building formal proofs.",

      "<b>1. Opening the Workspace</b>\nFrom the home page, click on any quest to open the proof workspace. You can also create a new empty workspace from the 'New Workspace' button. The workspace consists of a canvas where you'll build your proof tree, and panels for goals, axioms, and other tools.",

      "<b>2. Understanding the Interface</b>\nThe workspace has several key components:\n• <b>Canvas:</b> The main area where you build your proof tree\n• <b>Goal Panel:</b> Shows what you need to prove (right side)\n• <b>Axiom Palette:</b> Available axioms and rules you can use (bottom)\n• <b>Context Menu:</b> Right-click on the canvas to add nodes",

      "<b>3. Adding Nodes</b>\nTo add a formula node:\n1. Right-click on the empty canvas\n2. Select 'Add Formula Schema' from the context menu\n3. Type your formula using the formula editor\n4. Press Enter or click outside to confirm\n\nYou can use keyboard shortcuts like <code>phi</code> for $\\varphi$, <code>psi</code> for $\\psi$, and <code>-></code> for $\\to$.",

      "<b>4. Connecting Nodes</b>\nTo apply an inference rule:\n1. Select one or more premise nodes (click to select, Ctrl/Cmd+click for multiple)\n2. Click on an inference rule from the axiom palette, or right-click and choose from the menu\n3. The conclusion will be automatically generated\n4. Connect nodes by dragging from the output port of one node to the input port of another",

      "<b>5. Editing and Deleting</b>\n• <b>Edit a formula:</b> Double-click on a formula node to edit its content\n• <b>Delete nodes:</b> Select a node and press Delete, or right-click and choose 'Delete'\n• <b>Undo/Redo:</b> Use Ctrl/Cmd+Z to undo, Ctrl/Cmd+Shift+Z to redo",

      "<b>6. Checking Your Proof</b>\nThe system automatically validates your proof:\n• <b>Green nodes:</b> Valid and correctly connected\n• <b>Red nodes:</b> Have errors that need fixing\n• <b>Yellow nodes:</b> Warnings or incomplete connections\n\nHover over any node to see detailed validation messages.",

      "<b>7. Saving and Loading</b>\nYour work is automatically saved locally in your browser. You can:\n• Export your proof as JSON or image\n• Import previously saved proofs\n• Share your proof via a generated link",

      "<b>8. Tips for Success</b>\n• Start with simple quests and gradually move to complex ones\n• Use the axiom palette to quickly find relevant rules\n• Organize your proof tree from top (premises) to bottom (conclusion)\n• Reference the documentation (?) for detailed explanations of axioms and rules\n• Try the keyboard shortcuts: press <code>?</code> to see the full list",

      "Now you're ready to start building formal proofs! Begin with the first quest in the Propositional Logic section to practice these operations.",
    ],
    ja: [
      "インタラクティブな証明構築ワークスペースへようこそ！このガイドでは、形式証明の構築を始めるために知っておくべき基本操作を説明します。",

      "<b>1. ワークスペースを開く</b>\nホームページから任意のクエストをクリックして証明ワークスペースを開きます。「新規ワークスペース」ボタンから空のワークスペースを作成することもできます。ワークスペースは、証明ツリーを構築するキャンバスと、ゴール、公理、その他のツールのパネルで構成されています。",

      "<b>2. インターフェースの理解</b>\nワークスペースには以下の主要コンポーネントがあります：\n• <b>キャンバス：</b>証明ツリーを構築するメインエリア\n• <b>ゴールパネル：</b>証明すべき内容を表示（右側）\n• <b>公理パレット：</b>使用できる公理と規則（下部）\n• <b>コンテキストメニュー：</b>キャンバス上で右クリックしてノードを追加",

      "<b>3. ノードの追加</b>\n論理式ノードを追加するには：\n1. 空のキャンバス上で右クリック\n2. コンテキストメニューから「論理式スキーマを追加」を選択\n3. 論理式エディタで論理式を入力\n4. Enterキーを押すか、外側をクリックして確定\n\nキーボードショートカット：<code>phi</code>で$\\varphi$、<code>psi</code>で$\\psi$、<code>-></code>で$\\to$が入力できます。",

      "<b>4. ノードの接続</b>\n推論規則を適用するには：\n1. 前提となるノードを選択（クリックで選択、Ctrl/Cmd+クリックで複数選択）\n2. 公理パレットから推論規則をクリック、または右クリックメニューから選択\n3. 結論が自動的に生成される\n4. ノードの出力ポートから別のノードの入力ポートへドラッグして接続",

      "<b>5. 編集と削除</b>\n• <b>論理式の編集：</b>論理式ノードをダブルクリックして内容を編集\n• <b>ノードの削除：</b>ノードを選択してDeleteキーを押す、または右クリックして「削除」を選択\n• <b>元に戻す/やり直す：</b>Ctrl/Cmd+Zで元に戻す、Ctrl/Cmd+Shift+Zでやり直す",

      "<b>6. 証明のチェック</b>\nシステムは自動的に証明を検証します：\n• <b>緑色のノード：</b>有効で正しく接続されている\n• <b>赤色のノード：</b>修正が必要なエラーがある\n• <b>黄色のノード：</b>警告または不完全な接続\n\nノードにカーソルを合わせると詳細な検証メッセージが表示されます。",

      "<b>7. 保存と読み込み</b>\n作業内容はブラウザにローカルで自動保存されます。以下が可能です：\n• 証明をJSONや画像としてエクスポート\n• 以前に保存した証明をインポート\n• 生成されたリンクで証明を共有",

      "<b>8. 成功のためのヒント</b>\n• 簡単なクエストから始めて、徐々に複雑なものへ進む\n• 公理パレットを使って関連する規則を素早く見つける\n• 証明ツリーを上（前提）から下（結論）へ整理する\n• 公理と規則の詳細な説明はドキュメント（?）を参照\n• キーボードショートカットを試す：<code>?</code>で全リストを表示",

      "これで形式証明の構築を始める準備ができました！命題論理セクションの最初のクエストから始めて、これらの操作を練習しましょう。",
    ],
  },
  relatedEntryIds: ["guide-what-is-formal-proof", "axiom-a1", "rule-mp"],
  relatedQuestIds: ["prop-01", "prop-02"],
  externalLinks: [],
  keywords: [
    "workspace",
    "canvas",
    "node",
    "connection",
    "interface",
    "basic operations",
    "ワークスペース",
    "キャンバス",
    "ノード",
    "接続",
    "インターフェース",
    "基本操作",
  ],
  order: 2,
};

const guideFirstQuestWalkthrough: ReferenceEntry = {
  id: "guide-first-quest-walkthrough",
  category: "guide",
  title: {
    en: "Solving Your First Quest (prop-01)",
    ja: "最初のクエスト（prop-01）を解いてみよう",
  },
  summary: {
    en: "A step-by-step walkthrough of proving $\\varphi \\to \\varphi$ using the Łukasiewicz axiom system.",
    ja: "Łukasiewicz公理体系を使って$\\varphi \\to \\varphi$を証明するステップバイステップのチュートリアル。",
  },
  body: {
    en: [
      'In this guide, we\'ll walk through the very first quest: proving <b>$\\varphi \\to \\varphi$</b> (the identity principle). This might seem obviously true — "$\\varphi$ implies $\\varphi$" — but in a formal proof system, we cannot take anything for granted. We must derive it from axioms using only the allowed inference rules.',

      "<b>The Setup</b>\nOpen quest prop-01 from the quest catalog. You'll see a workspace with a goal: <b>$\\varphi \\to \\varphi$</b>. The Łukasiewicz axiom system gives you three axioms and one inference rule:\n• <b>A1 (K):</b> $\\varphi \\to (\\psi \\to \\varphi)$\n• <b>A2 (S):</b> ($\\varphi \\to (\\psi \\to \\chi)) \\to ((\\varphi \\to \\psi) \\to (\\varphi \\to \\chi)$)\n• <b>A3:</b> ($\\lnot \\varphi \\to \\lnot \\psi) \\to (\\psi \\to \\varphi$)\n• <b>MP (Modus Ponens):</b> From $\\varphi \\to \\psi$ and $\\varphi$, derive $\\psi$",

      "<b>The Strategy</b>\nWe need to somehow get $\\varphi \\to \\varphi$ from these axioms. Notice that we don't have a direct axiom for identity. The key insight is that <b>A2 (the S axiom) distributes implication</b>: if we know $\\varphi \\to (\\psi \\to \\chi)$ and $\\varphi \\to \\psi$, we can derive $\\varphi \\to \\chi$. If we cleverly choose $\\psi$ and $\\chi$, we can make the conclusion be $\\varphi \\to \\varphi$.",

      "<b>Step 1: Place Axiom A2</b>\nClick on <b>A2</b> in the axiom palette. A new node appears with the A2 schema. We need to substitute $\\varphi \\to \\varphi$ for $\\psi$ and $\\varphi$ for $\\chi$:\n($\\varphi \\to ((\\varphi \\to \\varphi) \\to \\varphi)) \\to ((\\varphi \\to (\\varphi \\to \\varphi)) \\to (\\varphi \\to \\varphi)$)\nNotice: the conclusion of this instance ends with <b>($\\varphi \\to \\varphi$)</b> — exactly our goal! But to use it, we need to provide the antecedent.",

      "<b>Step 2: Place Axiom A1 (first instance)</b>\nClick on <b>A1</b> in the axiom palette. Substitute $\\varphi$ for $\\varphi$ and ($\\varphi \\to \\varphi$) for $\\psi$:\n$\\varphi \\to ((\\varphi \\to \\varphi) \\to \\varphi)$\nThis is exactly the antecedent of our A2 instance from Step 1.",

      "<b>Step 3: Apply Modus Ponens</b>\nSelect the A2 node (Step 1) and the A1 node (Step 2), then apply <b>MP</b>. Since A1 gives us the antecedent of A2, MP produces:\n($\\varphi \\to (\\varphi \\to \\varphi)) \\to (\\varphi \\to \\varphi$)\nWe're getting close! Now we need <b>$\\varphi \\to (\\varphi \\to \\varphi)$</b> to apply MP again.",

      "<b>Step 4: Place Axiom A1 (second instance)</b>\nAdd another <b>A1</b> node, this time with $\\varphi$ for $\\varphi$ and $\\varphi$ for $\\psi$:\n$\\varphi \\to (\\varphi \\to \\varphi)$\nThis is exactly what we need as the antecedent for Step 3.",

      "<b>Step 5: Apply Modus Ponens Again</b>\nSelect the result of Step 3 and the A1 node from Step 4, then apply <b>MP</b>. The result:\n$\\varphi \\to \\varphi$\nThe goal is achieved! The system confirms that the proof is complete.",

      "<b>The Complete Proof Tree</b>\n\nA2: ($\\varphi \\to ((\\varphi \\to \\varphi) \\to \\varphi)) \\to ((\\varphi \\to (\\varphi \\to \\varphi)) \\to (\\varphi \\to \\varphi)$)\nA1: $\\varphi \\to ((\\varphi \\to \\varphi) \\to \\varphi)$\nMP: ($\\varphi \\to (\\varphi \\to \\varphi)) \\to (\\varphi \\to \\varphi$)\nA1: $\\varphi \\to (\\varphi \\to \\varphi)$\nMP: $\\varphi \\to \\varphi$  ✓",

      "<b>Why This Matters: SKK = I</b>\nThis proof has a beautiful connection to combinatory logic. The A1 axiom corresponds to the <b>K combinator</b> (K = λx.λy.x, which returns its first argument), and A2 corresponds to the <b>S combinator</b> (S = λf.λg.λx.f(x)(g(x)), which distributes application). Our proof shows that <b>S(K)(K) = I</b>, where I is the identity combinator. This is a famous result: the identity function can be built from just S and K!",
    ],
    ja: [
      "このガイドでは、最初のクエスト「<b>$\\varphi \\to \\varphi$</b>（恒等律）の証明」を一歩ずつ進めていきます。「$\\varphi$ならば$\\varphi$」は当たり前に見えるかもしれませんが、形式証明体系では何も当然とはできません。許された推論規則だけを使って、公理から導出しなければなりません。",

      "<b>準備</b>\nクエストカタログからprop-01を開きます。ワークスペースにゴール「<b>$\\varphi \\to \\varphi$</b>」が表示されます。Łukasiewicz公理体系では3つの公理と1つの推論規則が使えます：\n• <b>A1 (K)：</b> $\\varphi \\to (\\psi \\to \\varphi)$\n• <b>A2 (S)：</b> ($\\varphi \\to (\\psi \\to \\chi)) \\to ((\\varphi \\to \\psi) \\to (\\varphi \\to \\chi)$)\n• <b>A3：</b> ($\\lnot \\varphi \\to \\lnot \\psi) \\to (\\psi \\to \\varphi$)\n• <b>MP (Modus Ponens)：</b> $\\varphi \\to \\psi$ と $\\varphi$ から $\\psi$ を導出",

      "<b>戦略</b>\nこれらの公理から$\\varphi \\to \\varphi$を導く必要があります。恒等律に直接対応する公理はありません。鍵となる洞察は、<b>A2（S公理）が含意を分配する</b>ことです：$\\varphi \\to (\\psi \\to \\chi)$ と $\\varphi \\to \\psi$ がわかっていれば、$\\varphi \\to \\chi$ を導けます。$\\psi$と$\\chi$を巧妙に選べば、結論を$\\varphi \\to \\varphi$にできます。",

      "<b>ステップ1：公理A2を配置</b>\n公理パレットで<b>A2</b>をクリックします。A2スキーマの新しいノードが現れます。$\\psi$を（$\\varphi \\to \\varphi$）に、$\\chi$を$\\varphi$に代入します：\n($\\varphi \\to ((\\varphi \\to \\varphi) \\to \\varphi)) \\to ((\\varphi \\to (\\varphi \\to \\varphi)) \\to (\\varphi \\to \\varphi)$)\n注目：このインスタンスの結論部分は<b>($\\varphi \\to \\varphi$)</b>で終わっています — まさにゴールです！ただし、前件を提供する必要があります。",

      "<b>ステップ2：公理A1を配置（1回目）</b>\n公理パレットで<b>A1</b>をクリックします。$\\varphi$に$\\varphi$を、$\\psi$に（$\\varphi \\to \\varphi$）を代入します：\n$\\varphi \\to ((\\varphi \\to \\varphi) \\to \\varphi)$\nこれはステップ1のA2インスタンスの前件そのものです。",

      "<b>ステップ3：Modus Ponensを適用</b>\nA2ノード（ステップ1）とA1ノード（ステップ2）を選択し、<b>MP</b>を適用します。A1がA2の前件を与えるので、MPにより以下が得られます：\n($\\varphi \\to (\\varphi \\to \\varphi)) \\to (\\varphi \\to \\varphi$)\nあと少しです！MP をもう一度適用するために<b>$\\varphi \\to (\\varphi \\to \\varphi)$</b>が必要です。",

      "<b>ステップ4：公理A1を配置（2回目）</b>\nもう一つ<b>A1</b>ノードを追加します。今度は$\\varphi$に$\\varphi$を、$\\psi$に$\\varphi$を代入します：\n$\\varphi \\to (\\varphi \\to \\varphi)$\nこれはステップ3の結果の前件にちょうど必要なものです。",

      "<b>ステップ5：Modus Ponensをもう一度適用</b>\nステップ3の結果とステップ4のA1ノードを選択し、<b>MP</b>を適用します。結果：\n$\\varphi \\to \\varphi$\nゴール達成です！システムが証明の完了を確認します。",

      "<b>証明ツリーの全体像</b>\n\nA2: ($\\varphi \\to ((\\varphi \\to \\varphi) \\to \\varphi)) \\to ((\\varphi \\to (\\varphi \\to \\varphi)) \\to (\\varphi \\to \\varphi)$)\nA1: $\\varphi \\to ((\\varphi \\to \\varphi) \\to \\varphi)$\nMP: ($\\varphi \\to (\\varphi \\to \\varphi)) \\to (\\varphi \\to \\varphi$)\nA1: $\\varphi \\to (\\varphi \\to \\varphi)$\nMP: $\\varphi \\to \\varphi$  ✓",

      "<b>なぜこれが重要か：SKK = I</b>\nこの証明は組合せ論理との美しい対応を持っています。A1公理は<b>Kコンビネータ</b>（K = λx.λy.x、最初の引数を返す）に対応し、A2は<b>Sコンビネータ</b>（S = λf.λg.λx.f(x)(g(x))、適用を分配する）に対応します。この証明は<b>S(K)(K) = I</b>を示しており、Iは恒等コンビネータです。これは有名な結果で、恒等関数はSとKだけから構成できることを意味します！",
    ],
  },
  relatedEntryIds: [
    "guide-basic-operations",
    "axiom-a1",
    "axiom-a2",
    "rule-mp",
    "system-lukasiewicz",
  ],
  relatedQuestIds: ["prop-01"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/SKI_combinator_calculus",
      label: {
        en: "SKI Combinator Calculus",
        ja: "SKIコンビネータ計算",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "first quest",
    "prop-01",
    "identity",
    "phi implies phi",
    "walkthrough",
    "tutorial",
    "SKK",
    "最初のクエスト",
    "恒等律",
    "チュートリアル",
    "ウォークスルー",
  ],
  order: 3,
};

const guideIntroToPropositionalLogic: ReferenceEntry = {
  id: "guide-intro-propositional-logic",
  category: "guide",
  title: {
    en: "Introduction to Propositional Logic",
    ja: "命題論理入門",
  },
  summary: {
    en: "From truth values and logical connectives to the axiomatic approach of propositional logic.",
    ja: "真理値と論理結合子の直観的理解から、命題論理の公理的アプローチへ。",
  },
  body: {
    en: [
      '<b>What is Propositional Logic?</b>\nPropositional logic is the study of how the truth or falsehood of compound statements depends on the truth or falsehood of their parts. A <b>proposition</b> is a statement that is either true or false — for example, "It is raining" or "2 + 2 = 4." Propositional logic does not analyze the internal structure of these statements; it only considers how they combine using <b>logical connectives</b>.',

      "<b>Truth Values and Logical Connectives</b>\nEvery proposition has a <b>truth value</b>: either <b>true (T)</b> or <b>false (F)</b>. Logical connectives build compound propositions from simpler ones:\n• <b>Negation $\\lnot \\varphi$</b> (not $\\varphi$): true when $\\varphi$ is false, false when $\\varphi$ is true\n• <b>Conjunction $\\varphi \\land \\psi$</b> ($\\varphi$ and $\\psi$): true only when both $\\varphi$ and $\\psi$ are true\n• <b>Disjunction $\\varphi \\lor \\psi$</b> ($\\varphi$ or $\\psi$): true when at least one of $\\varphi , \\psi$ is true\n• <b>Implication $\\varphi \\to \\psi$</b> (if $\\varphi$ then $\\psi$): false only when $\\varphi$ is true and $\\psi$ is false\n• <b>Biconditional $\\varphi \\leftrightarrow \\psi$</b> ($\\varphi$ if and only if $\\psi$): true when both have the same truth value",

      '<b>Truth Tables</b>\nThe meaning of each connective can be fully specified by a <b>truth table</b>, which lists the output for every combination of input truth values. For example, the truth table for implication ($\\to$) is:\n\n$\\varphi$ | $\\psi$ | $\\varphi \\to \\psi$\n<code>T | T |   T</code>\n<code>T | F |   F</code>\n<code>F | T |   T</code>\n<code>F | F |   T</code>\n\nNote: <b>$\\varphi \\to \\psi$ is false only when $\\varphi$ is true and $\\psi$ is false.</b> This is the key property of material implication. In particular, a false hypothesis implies anything ("ex falso quodlibet").',

      "<b>Tautologies</b>\nA formula that is true under <b>every possible assignment</b> of truth values to its propositional variables is called a <b>tautology</b>. For example, $\\varphi \\lor \\lnot \\varphi$ (law of excluded middle) is a tautology: whether $\\varphi$ is true or false, the disjunction is always true. Tautologies represent the universally valid principles of logic.",

      "<b>From Semantics to Syntax: The Axiomatic Approach</b>\nTruth tables give us a <b>semantic</b> (model-theoretic) way to check validity: just enumerate all possibilities. But there is another approach — the <b>syntactic</b> (proof-theoretic) one: we choose a small set of formulas as <b>axioms</b> and a set of <b>inference rules</b>, and we derive new formulas step by step.\n\nThe Łukasiewicz axiom system, used in this application, has three axiom schemas and one rule:\n• <b>A1:</b> $\\varphi \\to (\\psi \\to \\varphi)$\n• <b>A2:</b> ($\\varphi \\to (\\psi \\to \\chi)) \\to ((\\varphi \\to \\psi) \\to (\\varphi \\to \\chi)$)\n• <b>A3:</b> ($\\lnot \\varphi \\to \\lnot \\psi) \\to (\\psi \\to \\varphi$)\n• <b>MP:</b> From $\\varphi \\to \\psi$ and $\\varphi$, derive $\\psi$",

      "<b>Why Only $\\to$ and $\\lnot$?</b>\nAlthough we introduced five connectives above, the Łukasiewicz system uses only <b>implication ($\\to$)</b> and <b>negation ($\\lnot$)</b> as primitives. This is sufficient because the other connectives can be <b>defined</b> in terms of these two:\n• $\\varphi \\lor \\psi \\equiv \\lnot \\varphi \\to \\psi$\n• $\\varphi \\land \\psi \\equiv \\lnot (\\varphi \\to \\lnot \\psi)$\n• $\\varphi \\leftrightarrow \\psi \\equiv (\\varphi \\to \\psi) \\land (\\psi \\to \\varphi)$\n\nUsing fewer primitives simplifies the axiom system and makes proofs about the system (like completeness) easier to carry out.",

      "<b>What is an Axiom Schema?</b>\nThe axioms listed above are not single formulas but <b>schemas</b> — they represent infinitely many formulas. When we write $\\varphi \\to (\\psi \\to \\varphi)$, the Greek letters $\\varphi$ and $\\psi$ are <b>metavariables</b> that can be replaced by any formula. So A1 gives us p $\\to (q \\to$ p), (p $\\to q) \\to (r \\to (p \\to$ q)), and infinitely many other instances. In this application, you work directly with schemas, making your proofs maximally general.",

      "<b>Proofs in the Axiomatic System</b>\nA <b>formal proof</b> (or derivation) is a finite sequence of formulas where each formula is either:\n1. An instance of an axiom schema, or\n2. Derived from two earlier formulas by Modus Ponens.\n\nThe last formula in the sequence is the <b>theorem</b> being proved. For example, the proof of $\\varphi \\to \\varphi$ (identity) uses two instances of A1 and one instance of A2, connected by two applications of MP.",

      "<b>Soundness and Completeness</b>\nThe axiomatic approach is connected to truth tables by two fundamental theorems:\n• <b>Soundness:</b> Every theorem derivable from the axioms is a tautology. (Proofs only produce truths.)\n• <b>Completeness (Gödel, 1930):</b> Every tautology is derivable from the axioms. (Every truth can be proved.)\n\nTogether, these mean that the syntactic (proof-based) and semantic (truth-table-based) notions of validity coincide for propositional logic. This is a remarkable fact — the axioms capture exactly the tautologies, no more and no less.",

      "<b>Practice and Next Steps</b>\nThe best way to build intuition for propositional logic proofs is to work through the quests. Start with the prop-01 through prop-10 quests, which cover fundamental patterns like identity ($\\varphi \\to \\varphi$), weakening, syllogism, and contraposition. As you progress, you'll discover that seemingly different proofs share common structures — the formal system makes these patterns explicit.\n\nFor deeper exploration, see the references on the Deduction Theorem (which simplifies proofs dramatically), the relationship between classical and intuitionistic logic, and the Curry-Howard correspondence (connecting proofs to programs).",
    ],
    ja: [
      "<b>命題論理とは？</b>\n命題論理は、複合的な文の真偽がその構成部分の真偽にどのように依存するかを研究する分野です。<b>命題</b>とは、真か偽のいずれかである文のことです — 例えば「雨が降っている」や「2 + 2 = 4」。命題論理はこれらの文の内部構造を分析しません。<b>論理結合子</b>を使ってそれらがどのように組み合わされるかだけを考えます。",

      "<b>真理値と論理結合子</b>\nすべての命題は<b>真理値</b>を持ちます：<b>真 (T)</b> か <b>偽 (F)</b> のいずれかです。論理結合子は、単純な命題から複合命題を構築します：\n• <b>否定 $\\lnot \\varphi$</b>（$\\varphi$でない）：$\\varphi$が偽のとき真、$\\varphi$が真のとき偽\n• <b>連言 $\\varphi \\land \\psi$</b>（$\\varphi$かつ$\\psi$）：$\\varphi$と$\\psi$の両方が真のときのみ真\n• <b>選言 $\\varphi \\lor \\psi$</b>（$\\varphi$または$\\psi$）：$\\varphi$、$\\psi$の少なくとも一方が真のとき真\n• <b>含意 $\\varphi \\to \\psi$</b>（$\\varphi$ならば$\\psi$）：$\\varphi$が真で$\\psi$が偽のときのみ偽\n• <b>双条件 $\\varphi \\leftrightarrow \\psi$</b>（$\\varphi$であることと$\\psi$であることは同値）：両方が同じ真理値のとき真",

      "<b>真理値表</b>\n各結合子の意味は<b>真理値表</b>で完全に指定できます。真理値表は、入力の真理値のすべての組み合わせに対する出力を列挙します。例えば、含意（$\\to$）の真理値表は：\n\n$\\varphi$ | $\\psi$ | $\\varphi \\to \\psi$\n<code>T | T |   T</code>\n<code>T | F |   F</code>\n<code>F | T |   T</code>\n<code>F | F |   T</code>\n\n注意：<b>$\\varphi \\to \\psi$が偽になるのは、$\\varphi$が真で$\\psi$が偽のときだけ</b>です。これが質料的含意の重要な性質です。特に、偽の仮定からは何でも導けます（「矛盾からは何でも従う」）。",

      "<b>トートロジー</b>\n命題変数への<b>すべての可能な真理値割り当て</b>のもとで真となる論理式を<b>トートロジー</b>（恒真式）と呼びます。例えば、$\\varphi \\lor \\lnot \\varphi$（排中律）はトートロジーです：$\\varphi$が真でも偽でも、選言は常に真になります。トートロジーは、論理の普遍的に妥当な原理を表しています。",

      "<b>意味論から構文論へ：公理的アプローチ</b>\n真理値表は妥当性を確認する<b>意味論的</b>（モデル理論的）な方法を提供します：すべての可能性を列挙するだけです。しかし別のアプローチがあります — <b>構文論的</b>（証明論的）なものです：少数の論理式を<b>公理</b>として選び、<b>推論規則</b>を定めて、段階的に新しい論理式を導出します。\n\nこのアプリケーションで使用するŁukasiewicz公理体系は、3つの公理スキーマと1つの規則を持ちます：\n• <b>A1：</b> $\\varphi \\to (\\psi \\to \\varphi)$\n• <b>A2：</b> ($\\varphi \\to (\\psi \\to \\chi)) \\to ((\\varphi \\to \\psi) \\to (\\varphi \\to \\chi)$)\n• <b>A3：</b> ($\\lnot \\varphi \\to \\lnot \\psi) \\to (\\psi \\to \\varphi$)\n• <b>MP：</b> $\\varphi \\to \\psi$ と $\\varphi$ から $\\psi$ を導出",

      "<b>なぜ $\\to$ と $\\lnot$ だけ？</b>\n上で5つの結合子を紹介しましたが、Łukasiewicz体系では<b>含意（$\\to$）</b>と<b>否定（$\\lnot$）</b>のみを原始結合子として使います。他の結合子はこの2つで<b>定義</b>できるため、これで十分です：\n• $\\varphi \\lor \\psi \\equiv \\lnot \\varphi \\to \\psi$\n• $\\varphi \\land \\psi \\equiv \\lnot (\\varphi \\to \\lnot \\psi)$\n• $\\varphi \\leftrightarrow \\psi \\equiv (\\varphi \\to \\psi) \\land (\\psi \\to \\varphi)$\n\n原始結合子を少なくすることで、公理体系が単純になり、体系についての証明（完全性など）がより容易になります。",

      "<b>公理スキーマとは？</b>\n上に挙げた公理は単一の論理式ではなく<b>スキーマ</b>です — 無限に多くの論理式を表しています。$\\varphi \\to (\\psi \\to \\varphi)$ と書くとき、ギリシャ文字の$\\varphi$と$\\psi$は任意の論理式に置き換えられる<b>メタ変数</b>です。したがってA1からは p $\\to (q \\to$ p)、(p $\\to q) \\to (r \\to (p \\to$ q)) など、無限個のインスタンスが得られます。このアプリケーションではスキーマを直接扱うため、証明は最大限に一般的になります。",

      "<b>公理体系での証明</b>\n<b>形式証明</b>（導出）とは、各論理式が以下のいずれかである有限の論理式列です：\n1. 公理スキーマのインスタンス、または\n2. それ以前の2つの論理式からModus Ponensによって導出されたもの。\n\n列の最後の論理式が証明される<b>定理</b>です。例えば、$\\varphi \\to \\varphi$（恒等律）の証明は、A1の2つのインスタンスとA2の1つのインスタンスを、2回のMP適用で結合しています。",

      "<b>健全性と完全性</b>\n公理的アプローチと真理値表は、2つの基本定理で結びつけられています：\n• <b>健全性：</b> 公理から導出可能なすべての定理はトートロジーである。（証明は真理のみを生み出す。）\n• <b>完全性（ゲーデル、1930年）：</b> すべてのトートロジーは公理から導出可能である。（すべての真理は証明できる。）\n\nこれらを合わせると、命題論理において構文論的（証明に基づく）妥当性と意味論的（真理値表に基づく）妥当性の概念が一致することがわかります。これは注目に値する事実です — 公理はトートロジーを過不足なく正確に捉えています。",

      "<b>実践と次のステップ</b>\n命題論理の証明の直観を養う最善の方法は、クエストを解くことです。prop-01からprop-10のクエストから始めてみましょう。恒等律（$\\varphi \\to \\varphi$）、弱化、三段論法、対偶などの基本的なパターンを扱います。進めていくうちに、一見異なる証明が共通の構造を持つことに気づくでしょう — 形式体系はこれらのパターンを明示的にします。\n\nより深い探求のためには、演繹定理（証明を劇的に簡略化する）、古典論理と直観主義論理の関係、Curry-Howard対応（証明とプログラムの結びつき）のリファレンスも参照してください。",
    ],
  },
  relatedEntryIds: [
    "guide-first-quest-walkthrough",
    "axiom-a1",
    "axiom-a2",
    "axiom-a3",
    "rule-mp",
    "notation-connectives",
    "concept-formula-schema",
    "concept-deduction-theorem",
    "concept-soundness",
    "concept-completeness",
  ],
  relatedQuestIds: [
    "prop-01",
    "prop-02",
    "prop-03",
    "prop-04",
    "prop-05",
    "prop-06",
    "prop-07",
    "prop-08",
    "prop-09",
    "prop-10",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Propositional_calculus",
      label: {
        en: "Propositional Calculus",
        ja: "命題計算",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E5%91%BD%E9%A1%8C%E8%AB%96%E7%90%86",
      label: {
        en: "Propositional Logic",
        ja: "命題論理",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/propositional+logic",
      label: {
        en: "Propositional Logic (nLab)",
        ja: "命題論理（nLab）",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "propositional logic",
    "truth value",
    "truth table",
    "tautology",
    "connective",
    "implication",
    "negation",
    "conjunction",
    "disjunction",
    "axiomatic system",
    "Łukasiewicz",
    "命題論理",
    "真理値",
    "真理値表",
    "トートロジー",
    "恒真式",
    "結合子",
    "含意",
    "否定",
    "連言",
    "選言",
    "公理体系",
  ],
  order: 4,
};

const guideHilbertProofMethod: ReferenceEntry = {
  id: "guide-hilbert-proof-method",
  category: "guide",
  title: {
    en: "How to Construct Proofs in the Hilbert System",
    ja: "Hilbert系における証明の組み立て方",
  },
  summary: {
    en: "A practical guide to building formal proofs using only axioms and Modus Ponens in the Łukasiewicz system.",
    ja: "Łukasiewicz体系において公理とModus Ponensのみで形式証明を組み立てる実践的方法論。",
  },
  body: {
    en: [
      '<b>The Challenge of Hilbert-Style Proofs</b>\nIn the Hilbert system, every proof step must be either an axiom instance or the result of applying Modus Ponens to two earlier steps. Unlike natural deduction, you cannot "assume" a hypothesis and discharge it later — every formula in the proof must be unconditionally derived. This constraint makes proofs rigorous but also makes them harder to discover. This guide presents strategies for overcoming that difficulty.',

      '<b>The Building Blocks: Axioms and Modus Ponens</b>\nRecall the Łukasiewicz axiom schemas:\n• <b>A1 (K):</b> $\\varphi \\to (\\psi \\to \\varphi)$ — any true formula can be "weakened" by adding an antecedent\n• <b>A2 (S):</b> ($\\varphi \\to (\\psi \\to \\chi)) \\to ((\\varphi \\to \\psi) \\to (\\varphi \\to \\chi)$) — distributes implication over implication\n• <b>A3:</b> ($\\lnot \\varphi \\to \\lnot \\psi) \\to (\\psi \\to \\varphi$) — contraposition: reversing a negated implication\n\nModus Ponens (MP) is the sole inference rule: from $\\varphi \\to \\psi$ and $\\varphi$, conclude $\\psi$. The art of Hilbert proofs lies in choosing the right axiom instances and chaining them with MP.',

      '<b>Strategy 1: Work Backward from the Goal</b>\nThe most effective strategy is <b>backward reasoning</b> (goal-directed search). Given a goal formula G, ask: "What MP application could produce G?" This means finding formulas A and A $\\to$ G such that both are provable. Often, A $\\to$ G can be an axiom instance, reducing the problem to proving A.\n\nFor example, to prove ($\\varphi \\to \\varphi) \\to (\\varphi \\to \\varphi$), observe that A1 gives $\\varphi$₁ $\\to (\\psi$₁ $\\to \\varphi$₁). Setting $\\varphi$₁ = ($\\varphi \\to \\varphi$) and $\\psi$₁ to anything yields the goal directly as an axiom instance.',

      '<b>Strategy 2: The Identity Proof as a Template</b>\nThe proof of $\\varphi \\to \\varphi$ (identity) is the most fundamental Hilbert proof and illustrates a core technique:\n1. A2: ($\\varphi \\to ((\\psi \\to \\varphi) \\to \\varphi)) \\to ((\\varphi \\to (\\psi \\to \\varphi)) \\to (\\varphi \\to \\varphi)$)\n2. A1: $\\varphi \\to ((\\psi \\to \\varphi) \\to \\varphi)$\n3. MP(1,2): ($\\varphi \\to (\\psi \\to \\varphi)) \\to (\\varphi \\to \\varphi$)\n4. A1: $\\varphi \\to (\\psi \\to \\varphi)$\n5. MP(3,4): $\\varphi \\to \\varphi$\n\nThe key pattern: A2 "distributes" a nested implication, and A1 provides the premises. Most proofs of the form $\\varphi \\to \\psi$ can be built by combining A2 distributions with A1 weakenings.',

      "<b>Strategy 3: Leveraging the Deduction Theorem</b>\nThe <b>Deduction Theorem</b> states: if you can derive $\\psi$ from the assumption $\\varphi$ (i.e., {$\\varphi$} $\\vdash \\psi$), then $\\vdash \\varphi \\to \\psi$. While the Hilbert system does not allow assumptions directly, you can <b>plan</b> your proof as if it did, then mechanically translate the result.\n\nThe translation works by induction on the proof under the assumption:\n• If $\\psi$ is an axiom or is $\\varphi$ itself, the translation is straightforward (using A1 or the identity proof).\n• If $\\psi$ was obtained by MP from α and α $\\to \\psi$, use A2 to combine ($\\varphi \\to$ α) and ($\\varphi \\to$ (α $\\to \\psi$)) into ($\\varphi \\to \\psi$).\n\nThis is why A2 has its particular form — it is precisely the combinator needed for the Deduction Theorem translation.",

      "<b>Strategy 4: Reusing Known Lemmas</b>\nOnce you have proved a result, you can treat it as a derived rule. Common lemmas that appear in many proofs:\n• <b>Identity:</b> $\\varphi \\to \\varphi$\n• <b>Hypothetical Syllogism (HS):</b> ($\\varphi \\to \\psi) \\to ((\\psi \\to \\chi) \\to (\\varphi \\to \\chi)$) — chaining implications\n• <b>Double Negation Introduction:</b> $\\varphi \\to \\lnot \\lnot \\varphi$\n• <b>Double Negation Elimination:</b> $\\lnot \\lnot \\varphi \\to \\varphi$ (requires A3)\n• <b>Contraposition:</b> ($\\varphi \\to \\psi) \\to (\\lnot \\psi \\to \\lnot \\varphi$)\n\nIn practice, many proofs become much shorter once these lemmas are available. The quests are arranged so that earlier results serve as building blocks for later ones.",

      "<b>Strategy 5: Matching Axiom Schemas</b>\nA crucial skill is recognizing when a formula is an instance of an axiom schema. Given a target formula, try to <b>unify</b> it with each axiom schema by finding a substitution for the metavariables.\n\nFor example, given the target (p $\\to q) \\to ((r \\to s) \\to (p \\to$ q)):\n• Compare with A1: $\\varphi \\to (\\psi \\to \\varphi)$\n• Set $\\varphi$ = (p $\\to q), \\psi$ = (r $\\to$ s)\n• It matches — this is an A1 instance.\n\nThis application supports automatic axiom identification: when you enter a formula, the system checks if it matches any axiom schema and annotates it accordingly.",

      "<b>Common Pitfalls</b>\nBeginners in Hilbert proofs often encounter these issues:\n• <b>Forgetting the direction of MP:</b> MP requires exactly $\\varphi \\to \\psi$ and $\\varphi$ to produce $\\psi$. You cannot apply MP to $\\psi \\to \\varphi$ and $\\varphi$.\n• <b>Parenthesization errors:</b> The arrow $\\to$ is right-associative, so $\\varphi \\to \\psi \\to \\chi$ means $\\varphi \\to (\\psi \\to \\chi)$, not $(\\varphi \\to \\psi) \\to \\chi$. Misreading this leads to incorrect axiom instantiations.\n• <b>Overcomplicating proofs:</b> If a formula is directly an axiom instance, there is no need to derive it. Always check axiom matching first.\n• <b>Ignoring A3:</b> Proofs involving negation almost always require A3 (contraposition). If your goal involves $\\lnot$, consider what contrapositive form might help.",

      "<b>The Proof Search Process in Practice</b>\nHere is a systematic approach to finding a proof:\n1. <b>Check axiom match:</b> Is the goal directly an axiom instance? If yes, done.\n2. <b>Decompose with MP:</b> Write the goal as $\\psi$. Search for a formula $\\varphi$ such that $\\varphi \\to \\psi$ and $\\varphi$ are both easier to prove.\n3. <b>Apply the Deduction Theorem mentally:</b> If the goal is α $\\to$ β, think about how to derive β assuming α, then translate.\n4. <b>Use known lemmas:</b> Can HS, contraposition, or other previously proved results shorten the proof?\n5. <b>Work from both ends:</b> Sometimes it helps to derive consequences of available axioms forward while also reasoning backward from the goal, looking for a meeting point.",

      "<b>Practice and Progression</b>\nThe quests in this application are carefully sequenced to build proof skills progressively:\n• <b>prop-01 to prop-03:</b> Direct axiom usage and simple MP chains — learn to instantiate axiom schemas correctly.\n• <b>prop-04 to prop-07:</b> The identity proof, weakening, and transitivity — master the A1+A2 combination.\n• <b>prop-08 to prop-15:</b> Hypothetical syllogism and more complex chains — develop backward reasoning skills.\n• <b>prop-16 to prop-25:</b> Negation, contraposition, and double negation — learn to work with A3.\n• <b>prop-26 onwards:</b> Advanced theorems combining all techniques — synthesize everything learned.\n\nEach proof you complete adds to your toolkit. The Deduction Theorem and Hypothetical Syllogism, once internalized, make even complex proofs approachable.",
    ],
    ja: [
      "<b>Hilbert系の証明の難しさ</b>\nHilbert系では、証明の各ステップは公理のインスタンスか、2つの先行ステップへのModus Ponensの適用結果でなければなりません。自然演繹とは異なり、仮定を「仮定」してあとで放出することはできません — 証明の各論理式は無条件に導出される必要があります。この制約により証明は厳密になりますが、発見が難しくなります。本ガイドでは、その難しさを克服するための戦略を紹介します。",

      "<b>構成要素：公理とModus Ponens</b>\nŁukasiewicz公理スキーマを確認しましょう：\n• <b>A1（K）：</b> $\\varphi \\to (\\psi \\to \\varphi)$ — 真な論理式に前件を追加して「弱化」できる\n• <b>A2（S）：</b> ($\\varphi \\to (\\psi \\to \\chi)) \\to ((\\varphi \\to \\psi) \\to (\\varphi \\to \\chi)$) — 含意を含意の上に分配する\n• <b>A3：</b> ($\\lnot \\varphi \\to \\lnot \\psi) \\to (\\psi \\to \\varphi$) — 対偶：否定された含意を反転する\n\nModus Ponens（MP）が唯一の推論規則です：$\\varphi \\to \\psi$ と $\\varphi$ から $\\psi$ を導出します。Hilbert系の証明の技は、適切な公理インスタンスを選び、MPで連鎖させることにあります。",

      "<b>戦略1：ゴールから逆向きに考える</b>\n最も効果的な戦略は<b>逆向き推論</b>（ゴール指向探索）です。ゴール論理式 G が与えられたとき、「どのMP適用が G を生み出せるか？」と考えます。つまり、A と A $\\to$ G の両方が証明可能な論理式を見つけます。A $\\to$ G が公理インスタンスであることも多く、その場合、問題は A の証明に帰着されます。\n\n例えば、($\\varphi \\to \\varphi) \\to (\\varphi \\to \\varphi$) を証明するには、A1が $\\varphi$₁ $\\to (\\psi$₁ $\\to \\varphi$₁) を与えることに注目します。$\\varphi$₁ = ($\\varphi \\to \\varphi$)、$\\psi$₁ を任意に設定すれば、ゴールが直接公理インスタンスとして得られます。",

      "<b>戦略2：恒等証明をテンプレートとして使う</b>\n$\\varphi \\to \\varphi$（恒等律）の証明は、最も基本的なHilbert系の証明であり、核心的な技法を示しています：\n1. A2: ($\\varphi \\to ((\\psi \\to \\varphi) \\to \\varphi)) \\to ((\\varphi \\to (\\psi \\to \\varphi)) \\to (\\varphi \\to \\varphi)$)\n2. A1: $\\varphi \\to ((\\psi \\to \\varphi) \\to \\varphi)$\n3. MP(1,2): ($\\varphi \\to (\\psi \\to \\varphi)) \\to (\\varphi \\to \\varphi$)\n4. A1: $\\varphi \\to (\\psi \\to \\varphi)$\n5. MP(3,4): $\\varphi \\to \\varphi$\n\n重要なパターン：A2が入れ子の含意を「分配」し、A1が前提を提供します。$\\varphi \\to \\psi$ の形の定理の多くは、A2の分配とA1の弱化の組み合わせで構築できます。",

      "<b>戦略3：演繹定理を活用する</b>\n<b>演繹定理</b>は次のように述べます：仮定 $\\varphi$ から $\\psi$ を導出できる（すなわち {$\\varphi$} $\\vdash \\psi$）ならば、$\\vdash \\varphi \\to \\psi$ である。Hilbert系は直接的な仮定を許しませんが、仮定があるかのように証明を<b>計画</b>し、その結果を機械的に翻訳できます。\n\n翻訳は仮定のもとでの証明に対する帰納法で行います：\n• $\\psi$ が公理であるか $\\varphi$ 自身である場合、翻訳は直接的です（A1または恒等証明を使用）。\n• $\\psi$ が α と α $\\to \\psi$ からMPで得られた場合、A2を使って ($\\varphi \\to$ α) と ($\\varphi \\to$ (α $\\to \\psi$)) を ($\\varphi \\to \\psi$) に合成します。\n\nA2がまさにこの特定の形を持つのは、演繹定理の翻訳に必要な結合子だからです。",

      "<b>戦略4：既知の補題を再利用する</b>\n一度証明した結果は、導出規則として扱えます。多くの証明に登場する共通の補題：\n• <b>恒等律：</b> $\\varphi \\to \\varphi$\n• <b>仮言三段論法（HS）：</b> ($\\varphi \\to \\psi) \\to ((\\psi \\to \\chi) \\to (\\varphi \\to \\chi)$) — 含意の連鎖\n• <b>二重否定導入：</b> $\\varphi \\to \\lnot \\lnot \\varphi$\n• <b>二重否定除去：</b> $\\lnot \\lnot \\varphi \\to \\varphi$（A3が必要）\n• <b>対偶：</b> ($\\varphi \\to \\psi) \\to (\\lnot \\psi \\to \\lnot \\varphi$)\n\n実際には、これらの補題が使えるようになると、多くの証明がはるかに短くなります。クエストは、先の結果が後の構成要素となるように配列されています。",

      "<b>戦略5：公理スキーマのマッチング</b>\n重要なスキルは、論理式が公理スキーマのインスタンスであることを認識することです。対象の論理式に対して、メタ変数への代入を見つけて各公理スキーマとの<b>単一化</b>を試みます。\n\n例えば、対象が (p $\\to q) \\to ((r \\to s) \\to (p \\to$ q)) の場合：\n• A1と比較：$\\varphi \\to (\\psi \\to \\varphi)$\n• $\\varphi$ = (p $\\to$ q)、$\\psi$ = (r $\\to$ s) と設定\n• 一致 — これはA1のインスタンスです。\n\nこのアプリケーションは自動的な公理識別をサポートしています：論理式を入力すると、システムが公理スキーマと一致するかを確認し、それに応じて注釈を付けます。",

      "<b>よくある落とし穴</b>\nHilbert系の証明の初心者は、以下の問題に遭遇しがちです：\n• <b>MPの方向を忘れる：</b> MPは正確に $\\varphi \\to \\psi$ と $\\varphi$ から $\\psi$ を導出します。$\\psi \\to \\varphi$ と $\\varphi$ にMPを適用することはできません。\n• <b>括弧の誤り：</b> 矢印 $\\to$ は右結合なので、$\\varphi \\to \\psi \\to \\chi$ は $\\varphi \\to (\\psi \\to \\chi)$ であって $(\\varphi \\to \\psi) \\to \\chi$ ではありません。この読み違いは誤った公理インスタンス化につながります。\n• <b>証明の過度な複雑化：</b> 論理式が直接公理インスタンスであれば、導出する必要はありません。常に公理マッチングを最初に確認しましょう。\n• <b>A3の無視：</b> 否定を含む証明はほぼ常にA3（対偶）を必要とします。ゴールに $\\lnot$ が含まれる場合、どのような対偶形が役立つか考えましょう。",

      "<b>実践における証明探索プロセス</b>\n証明を見つけるための体系的なアプローチ：\n1. <b>公理マッチの確認：</b> ゴールは直接公理インスタンスか？もしそうなら完了。\n2. <b>MPで分解：</b> ゴールを $\\psi$ と書く。$\\varphi \\to \\psi$ と $\\varphi$ の両方がより証明しやすい論理式 $\\varphi$ を探す。\n3. <b>演繹定理を頭の中で適用：</b> ゴールが α $\\to$ β ならば、α を仮定して β を導出する方法を考え、翻訳する。\n4. <b>既知の補題を使う：</b> HS、対偶、その他の既証明結果で証明を短縮できないか？\n5. <b>両端から攻める：</b> 利用可能な公理から順方向に帰結を導きつつ、ゴールから逆方向にも推論し、合流点を探すと有効なことがあります。",

      "<b>実践と段階的進歩</b>\nこのアプリケーションのクエストは、証明スキルを段階的に構築するよう注意深く配列されています：\n• <b>prop-01〜prop-03：</b> 直接的な公理使用と単純なMP連鎖 — 公理スキーマの正しいインスタンス化を学ぶ。\n• <b>prop-04〜prop-07：</b> 恒等証明、弱化、推移律 — A1+A2の組み合わせを習得する。\n• <b>prop-08〜prop-15：</b> 仮言三段論法とより複雑な連鎖 — 逆向き推論のスキルを磨く。\n• <b>prop-16〜prop-25：</b> 否定、対偶、二重否定 — A3の扱いを学ぶ。\n• <b>prop-26以降：</b> すべてのテクニックを組み合わせた上級定理 — 学んだことを統合する。\n\n完了した各証明がツールキットに加わります。演繹定理と仮言三段論法を内面化すれば、複雑な証明にも取り組めるようになります。",
    ],
  },
  relatedEntryIds: [
    "guide-intro-propositional-logic",
    "axiom-a1",
    "axiom-a2",
    "axiom-a3",
    "rule-mp",
    "concept-deduction-theorem",
    "concept-formula-schema",
  ],
  relatedQuestIds: [
    "prop-01",
    "prop-02",
    "prop-03",
    "prop-04",
    "prop-05",
    "prop-06",
    "prop-07",
    "prop-08",
    "prop-09",
    "prop-10",
    "prop-11",
    "prop-12",
    "prop-13",
    "prop-14",
    "prop-15",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Hilbert_system",
      label: {
        en: "Hilbert System",
        ja: "Hilbert系",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%83%92%E3%83%AB%E3%83%99%E3%83%AB%E3%83%88%E6%B5%81%E3%81%AE%E8%A8%BC%E6%98%8E%E8%AB%96",
      label: {
        en: "Hilbert-Style Proof Theory",
        ja: "ヒルベルト流の証明論",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/Hilbert+system",
      label: {
        en: "Hilbert System (nLab)",
        ja: "Hilbert系（nLab）",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "Hilbert system",
    "proof method",
    "proof strategy",
    "backward reasoning",
    "Modus Ponens",
    "deduction theorem",
    "hypothetical syllogism",
    "axiom instantiation",
    "identity proof",
    "contraposition",
    "Hilbert系",
    "証明方法",
    "証明戦略",
    "逆向き推論",
    "演繹定理",
    "仮言三段論法",
    "公理インスタンス化",
    "恒等証明",
    "対偶",
  ],
  order: 5,
};

// ============================================================
// 公理 (Axioms)
// ============================================================

const axiomA1: ReferenceEntry = {
  id: "axiom-a1",
  category: "axiom",
  title: { en: "Axiom A1 (K)", ja: "公理 A1 (K)" },
  summary: {
    en: "$\\varphi \\to (\\psi \\to \\varphi)$ — What is already known remains true under additional assumptions.",
    ja: "$\\varphi \\to (\\psi \\to \\varphi)$ — 既知の事実は、追加の仮定のもとでも成り立つ。",
  },
  body: {
    en: [
      "Axiom A1, also called the <b>K axiom</b> or <b>weakening axiom</b>, states that if $\\varphi$ is true, then $\\psi \\to \\varphi$ holds for any $\\psi$. Intuitively, already known things remain true even with extra assumptions.",
      "In combinatory logic, this corresponds to the K combinator: K = λx.λy.x, which takes two arguments and returns the first.",
      "A1 is common to all Hilbert-style axiom systems implemented in this application (Łukasiewicz, Mendelson, etc.). It appears frequently in proofs when a previously established result needs to be preserved under additional hypotheses.",
    ],
    ja: [
      "公理A1は<b>K公理</b>（弱化公理）とも呼ばれ、$\\varphi$が真ならば、任意の$\\psi$に対して$\\psi \\to \\varphi$が成り立つことを述べます。直観的には、既知の事実は追加の仮定があっても真のままです。",
      "コンビネータ論理では、Kコンビネータ K = λx.λy.x に対応します。2つの引数を取り、最初の引数を返します。",
      "A1は、本アプリケーションで実装されているすべてのHilbert系公理体系（Łukasiewicz、Mendelsonなど）に共通です。以前に確立された結果を追加の仮定のもとで保持する必要がある場合に、証明の中で頻繁に出現します。",
    ],
  },
  formalNotation: "\\varphi \\to (\\psi \\to \\varphi)",
  relatedEntryIds: ["axiom-a2", "axiom-a3", "rule-mp", "system-lukasiewicz"],
  relatedQuestIds: ["prop-02", "prop-03", "prop-05"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Hilbert_system",
      label: {
        en: "Hilbert system (Wikipedia)",
        ja: "ヒルベルト体系 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%83%92%E3%83%AB%E3%83%99%E3%83%AB%E3%83%88%E6%B5%81%E6%BC%94%E7%B9%B9%E4%BD%93%E7%B3%BB",
      label: {
        en: "Hilbert-style system (Wikipedia JA)",
        ja: "ヒルベルト流演繹体系 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/Hilbert+system",
      label: {
        en: "Hilbert system (nLab)",
        ja: "ヒルベルト体系 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: ["K", "K axiom", "weakening", "A1", "弱化"],
  order: 1,
};

const axiomA2: ReferenceEntry = {
  id: "axiom-a2",
  category: "axiom",
  title: { en: "Axiom A2 (S)", ja: "公理 A2 (S)" },
  summary: {
    en: "($\\varphi \\to (\\psi \\to \\chi)) \\to ((\\varphi \\to \\psi) \\to (\\varphi \\to \\chi)$) — Distribution of implication.",
    ja: "($\\varphi \\to (\\psi \\to \\chi)) \\to ((\\varphi \\to \\psi) \\to (\\varphi \\to \\chi)$) — 含意の分配。",
  },
  body: {
    en: [
      "Axiom A2, also called the <b>S axiom</b>, states that implication distributes over itself. If $\\varphi$ implies ($\\psi$ implies $\\chi$), and $\\varphi$ implies $\\psi$, then $\\varphi$ implies $\\chi$.",
      "In combinatory logic, this corresponds to the S combinator: S = λx.λy.λz.(xz)(yz). Together with K (A1), S and K form a complete basis for combinatory logic.",
      "The proof of $\\varphi \\to \\varphi$ (identity) uses both A1 and A2: this is the combinatory identity SKK = I. Much of proof construction in Hilbert systems reduces to finding appropriate A1 and A2 instantiations.",
    ],
    ja: [
      "公理A2は<b>S公理</b>とも呼ばれ、含意が自身に分配することを述べます。$\\varphi$が($\\psi$が$\\chi$を含意すること)を含意し、$\\varphi$が$\\psi$を含意するなら、$\\varphi$は$\\chi$を含意します。",
      "コンビネータ論理では、Sコンビネータ S = λx.λy.λz.(xz)(yz) に対応します。K (A1)とともに、SとKはコンビネータ論理の完全な基盤を形成します。",
      "$\\varphi \\to \\varphi$（恒等律）の証明にはA1とA2の両方が使われます。これはコンビネータの等式 SKK = I に対応します。Hilbert系での証明構成の多くは、適切なA1とA2のインスタンス化を見つけることに帰着します。",
    ],
  },
  formalNotation:
    "(\\varphi \\to (\\psi \\to \\chi)) \\to ((\\varphi \\to \\psi) \\to (\\varphi \\to \\chi))",
  relatedEntryIds: ["axiom-a1", "axiom-a3", "rule-mp", "system-lukasiewicz"],
  relatedQuestIds: ["prop-01", "prop-04", "prop-06"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/S,_K,_I_combinator_calculus",
      label: { en: "SKI combinator calculus", ja: "SKIコンビネータ計算" },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/SKI%E3%82%B3%E3%83%B3%E3%83%93%E3%83%8D%E3%83%BC%E3%82%BF%E8%A8%88%E7%AE%97",
      label: {
        en: "SKI combinator calculus (Wikipedia JA)",
        ja: "SKIコンビネータ計算 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/combinatory+logic",
      label: {
        en: "Combinatory logic (nLab)",
        ja: "コンビネータ論理 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: ["S", "S axiom", "distribution", "A2", "分配"],
  order: 2,
};

const axiomA3: ReferenceEntry = {
  id: "axiom-a3",
  category: "axiom",
  title: { en: "Axiom A3 (Contraposition)", ja: "公理 A3 (対偶)" },
  summary: {
    en: "($\\lnot \\varphi \\to \\lnot \\psi) \\to (\\psi \\to \\varphi$) — Contraposition: reversing the direction of implication via negation.",
    ja: "($\\lnot \\varphi \\to \\lnot \\psi) \\to (\\psi \\to \\varphi$) — 対偶: 否定を通じて含意の方向を逆転する。",
  },
  body: {
    en: [
      "Axiom A3 is the <b>contraposition axiom</b> used in the Łukasiewicz system. It states that if $\\lnot \\varphi$ implies $\\lnot \\psi$, then $\\psi$ implies $\\varphi$.",
      "This axiom captures the essence of classical logic. In the presence of A1 and A2, A3 is equivalent to: the law of excluded middle ($\\varphi \\lor \\lnot \\varphi$), double negation elimination ($\\lnot \\lnot \\varphi \\to \\varphi$), Peirce's law ($((\\varphi \\to \\psi) \\to \\varphi) \\to \\varphi$), and Mendelson's M3.",
      "In systems without A3 (using only A1, A2, and MP), you get the <b>positive implicational calculus</b>, which is weaker than classical logic.",
    ],
    ja: [
      "公理A3はŁukasiewicz体系で使用される<b>対偶公理</b>です。$\\lnot \\varphi$が$\\lnot \\psi$を含意するなら、$\\psi$は$\\varphi$を含意することを述べます。",
      "この公理は古典論理の本質を捉えます。A1とA2の存在下で、A3は以下と同値です: 排中律（$\\varphi \\lor \\lnot \\varphi$）、二重否定除去（$\\lnot \\lnot \\varphi \\to \\varphi$）、Peirceの法則（$((\\varphi \\to \\psi) \\to \\varphi) \\to \\varphi$）、MendelsonのM3。",
      "A3がない体系（A1, A2, MPのみ）は<b>正含意計算</b>となり、古典論理より弱い体系になります。",
    ],
  },
  formalNotation:
    "(\\lnot\\varphi \\to \\lnot\\psi) \\to (\\psi \\to \\varphi)",
  relatedEntryIds: [
    "axiom-a1",
    "axiom-a2",
    "axiom-m3",
    "axiom-dne",
    "system-lukasiewicz",
  ],
  relatedQuestIds: ["prop-10", "prop-11", "prop-17"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Contraposition",
      label: { en: "Contraposition (Wikipedia)", ja: "対偶 (Wikipedia)" },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E5%AF%BE%E5%81%B6_(%E8%AB%96%E7%90%86%E5%AD%A6)",
      label: { en: "Contraposition (Wikipedia JA)", ja: "対偶 (Wikipedia)" },
      documentLanguage: "ja",
    },
  ],
  keywords: ["A3", "contraposition", "Łukasiewicz", "対偶", "classical"],
  order: 3,
};

const axiomM3: ReferenceEntry = {
  id: "axiom-m3",
  category: "axiom",
  title: { en: "Axiom M3 (Reductio)", ja: "公理 M3 (背理法)" },
  summary: {
    en: "($\\lnot \\varphi \\to \\lnot \\psi) \\to ((\\lnot \\varphi \\to \\psi) \\to \\varphi$) — Proof by contradiction.",
    ja: "($\\lnot \\varphi \\to \\lnot \\psi) \\to ((\\lnot \\varphi \\to \\psi) \\to \\varphi$) — 背理法。",
  },
  body: {
    en: [
      "Axiom M3 is the <b>reductio ad absurdum</b> axiom used in the Mendelson system. If assuming $\\lnot \\varphi$ leads to both $\\lnot \\psi$ and $\\psi$ (a contradiction), then $\\varphi$ must be true.",
      "M3 and A3 are interchangeable in the presence of A1 and A2: each can derive the other. They represent different formulations of classical reasoning about negation.",
    ],
    ja: [
      "公理M3はMendelson体系で使用される<b>背理法</b>の公理です。$\\lnot \\varphi$を仮定すると$\\lnot \\psi$と$\\psi$の両方が導かれる（矛盾する）なら、$\\varphi$は真でなければなりません。",
      "M3とA3はA1・A2の存在下で互換です: 互いに導出可能です。否定に関する古典的推論の異なる定式化を表しています。",
    ],
  },
  formalNotation:
    "(\\lnot\\varphi \\to \\lnot\\psi) \\to ((\\lnot\\varphi \\to \\psi) \\to \\varphi)",
  relatedEntryIds: ["axiom-a3", "axiom-dne", "system-mendelson"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Reductio_ad_absurdum",
      label: {
        en: "Reductio ad absurdum (Wikipedia)",
        ja: "背理法 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E8%83%8C%E7%90%86%E6%B3%95",
      label: {
        en: "Reductio ad absurdum (Wikipedia JA)",
        ja: "背理法 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
  ],
  keywords: ["M3", "reductio", "Mendelson", "背理法", "contradiction"],
  order: 4,
};

const axiomEfq: ReferenceEntry = {
  id: "axiom-efq",
  category: "axiom",
  title: {
    en: "Axiom EFQ (Ex Falso Quodlibet)",
    ja: "公理 EFQ (爆発律)",
  },
  summary: {
    en: "$\\varphi \\to (\\lnot \\varphi \\to \\psi)$ — From a contradiction, anything follows.",
    ja: "$\\varphi \\to (\\lnot \\varphi \\to \\psi)$ — 矛盾からは何でも導ける。",
  },
  body: {
    en: [
      "<b>Ex falso quodlibet</b> (from falsehood, anything follows) states that if both $\\varphi$ and $\\lnot \\varphi$ are true, then any proposition $\\psi$ is true. Equivalently, it can be written as $\\bot \\to \\varphi$ when a falsum constant $\\bot$ is available.",
      "This axiom is what distinguishes intuitionistic logic from minimal logic (Johansson's system). Minimal logic has no explosion principle, making it strictly weaker.",
      "In classical logic, EFQ is derivable from A3 (or M3) via A1 and A2, so it does not need to be added as a separate axiom.",
    ],
    ja: [
      "<b>爆発律</b> (Ex falso quodlibet、偽からは何でも導ける) は、$\\varphi$と$\\lnot \\varphi$の両方が真ならば、任意の命題$\\psi$が真であることを述べます。矛盾定数$\\bot$が利用可能な場合、$\\bot \\to \\varphi$ とも書けます。",
      "この公理は直観主義論理と最小論理（Johanssonの体系）を区別するものです。最小論理は爆発律を持たないため、厳密に弱い体系です。",
      "古典論理ではEFQはA3（またはM3）からA1, A2を使って導出可能なので、別の公理として追加する必要はありません。",
    ],
  },
  formalNotation: "\\varphi \\to (\\lnot\\varphi \\to \\psi)",
  relatedEntryIds: ["axiom-dne", "system-intuitionistic", "system-minimal"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Principle_of_explosion",
      label: {
        en: "Principle of explosion (Wikipedia)",
        ja: "爆発律 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E7%88%86%E7%99%BA%E5%BE%8B",
      label: {
        en: "Principle of explosion (Wikipedia JA)",
        ja: "爆発律 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/ex+falso+quodlibet",
      label: {
        en: "Ex falso quodlibet (nLab)",
        ja: "爆発律 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: ["EFQ", "ex falso", "explosion", "爆発律", "intuitionistic"],
  order: 5,
};

const axiomDne: ReferenceEntry = {
  id: "axiom-dne",
  category: "axiom",
  title: {
    en: "Axiom DNE (Double Negation Elimination)",
    ja: "公理 DNE (二重否定除去)",
  },
  summary: {
    en: "$\\lnot \\lnot \\varphi \\to \\varphi$ — Removing double negation.",
    ja: "$\\lnot \\lnot \\varphi \\to \\varphi$ — 二重否定の除去。",
  },
  body: {
    en: [
      "<b>Double negation elimination</b> (DNE) states that if it is not the case that $\\varphi$ is not true, then $\\varphi$ is true.",
      "DNE is the key axiom that distinguishes classical logic from intuitionistic logic. Adding DNE to intuitionistic logic yields classical logic.",
      "DNE is equivalent to the law of excluded middle ($\\varphi \\lor \\lnot \\varphi$) and Peirce's law ($((\\varphi \\to \\psi) \\to \\varphi) \\to \\varphi$) in the presence of the other axioms.",
      "In the Łukasiewicz system, $\\lnot \\lnot \\varphi \\to \\varphi$ can be derived from A1, A2, A3, and MP, but the proof takes over a dozen steps — illustrating why Hilbert systems are verbose in practice.",
    ],
    ja: [
      "<b>二重否定除去</b> (DNE) は、$\\varphi$が真でないということがない（$\\lnot \\lnot \\varphi$）なら、$\\varphi$は真であることを述べます。",
      "DNEは古典論理と直観主義論理を区別する核心的な公理です。直観主義論理にDNEを加えると古典論理になります。",
      "DNEは他の公理の存在下で、排中律（$\\varphi \\lor \\lnot \\varphi$）やPeirceの法則（$((\\varphi \\to \\psi) \\to \\varphi) \\to \\varphi$）と同値です。",
      "Łukasiewicz体系では、$\\lnot \\lnot \\varphi \\to \\varphi$ はA1, A2, A3, MPから導出可能ですが、十数ステップを要します。Hilbert系が実践的に冗長である理由を示しています。",
    ],
  },
  formalNotation: "\\lnot\\lnot\\varphi \\to \\varphi",
  relatedEntryIds: [
    "axiom-a3",
    "axiom-m3",
    "axiom-efq",
    "system-classical",
    "system-intuitionistic",
    "concept-axiom-independence",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Double_negation",
      label: {
        en: "Double negation (Wikipedia)",
        ja: "二重否定 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E4%BA%8C%E9%87%8D%E5%90%A6%E5%AE%9A%E3%81%AE%E9%99%A4%E5%8E%BB",
      label: {
        en: "Double negation elimination (Wikipedia JA)",
        ja: "二重否定の除去 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/double+negation",
      label: {
        en: "Double negation (nLab)",
        ja: "二重否定 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "DNE",
    "double negation",
    "classical",
    "二重否定",
    "excluded middle",
  ],
  order: 6,
};

const axiomA4: ReferenceEntry = {
  id: "axiom-a4",
  category: "axiom",
  title: {
    en: "Axiom A4 (Universal Instantiation)",
    ja: "公理 A4 (全称例化)",
  },
  summary: {
    en: "$\\forall x. \\varphi \\to \\varphi$[t/x] — From a universal statement, derive a specific instance.",
    ja: "$\\forall x. \\varphi \\to \\varphi$[t/x] — 全称命題から特定のインスタンスを導出する。",
  },
  body: {
    en: [
      "Axiom A4 allows <b>universal instantiation</b>: if $\\forall x. \\varphi$ holds for all x, then $\\varphi$[t/x] holds for any specific term t (provided t is free for x in $\\varphi$).",
      'The side condition "t is free for x in $\\varphi$" means that substituting t for x does not accidentally capture any free variables of t under a quantifier in $\\varphi$. For example, substituting y into $\\forall$y.Q(x,y) would capture y, so it is not allowed.',
      "Examples: From $\\forall$x.P(x), instantiate with t = a to get P(a). From $\\forall$x.Q(x,y), instantiate with t = f(z) to get Q(f(z),y) (valid since z is free for x).",
    ],
    ja: [
      "公理A4は<b>全称例化</b>を可能にします: $\\forall x. \\varphi$がすべてのxについて成り立つなら、任意の項tに対して$\\varphi$[t/x]が成り立ちます（tが$\\varphi$においてxについて自由であるという条件付き）。",
      "「tが$\\varphi$においてxについて自由である」という条件は、xをtに置換してもtの自由変数が$\\varphi$の量化子に捕獲されないことを意味します。例えば、$\\forall$y.Q(x,y)にyを代入するとyが捕獲されるため、許可されません。",
      "例: $\\forall$x.P(x)からt = aで例化してP(a)を得る。$\\forall$x.Q(x,y)からt = f(z)で例化してQ(f(z),y)を得る（zはxについて自由なので有効）。",
    ],
  },
  formalNotation: "\\forall x. \\varphi \\to \\varphi[t/x]",
  relatedEntryIds: ["axiom-a5", "rule-gen", "concept-substitution"],
  relatedQuestIds: ["pred-01", "pred-02", "pred-03"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Universal_instantiation",
      label: {
        en: "Universal instantiation (Wikipedia)",
        ja: "全称例化 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/First-order_logic",
      label: {
        en: "First-order logic (Wikipedia)",
        ja: "一階論理 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E4%B8%80%E9%9A%8E%E8%BF%B0%E8%AA%9E%E8%AB%96%E7%90%86",
      label: {
        en: "First-order logic (Wikipedia JA)",
        ja: "一階述語論理 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
  ],
  keywords: ["A4", "universal instantiation", "UI", "全称例化", "predicate"],
  order: 7,
};

const axiomA5: ReferenceEntry = {
  id: "axiom-a5",
  category: "axiom",
  title: {
    en: "Axiom A5 (Universal Distribution)",
    ja: "公理 A5 (全称分配)",
  },
  summary: {
    en: "$\\forall x.(\\varphi \\to \\psi) \\to (\\varphi \\to \\forall x. \\psi)$ — Distributing universal quantifier over implication (when x is not free in $\\varphi$).",
    ja: "$\\forall x.(\\varphi \\to \\psi) \\to (\\varphi \\to \\forall x. \\psi)$ — 全称量化子の含意への分配（xが$\\varphi$に自由出現しない場合）。",
  },
  body: {
    en: [
      "Axiom A5 states that if $\\forall x.(\\varphi \\to \\psi)$ holds, and x is not free in $\\varphi$, then $\\varphi \\to \\forall x. \\psi$ also holds. Intuitively, if $\\varphi$'s truth is independent of x, then $\\varphi$ can be moved outside the scope of $\\forall$x.",
      "The side condition that x must not be free in $\\varphi$ is essential. Without it, the axiom would be unsound. For example, $\\forall$x.(P(x) $\\to$ Q(x)) $\\to$ (P(x) $\\to \\forall$x.Q(x)) would be invalid because x appears free in P(x).",
      "Together with A4 and the Gen rule, A5 completes the axiomatization of first-order predicate logic.",
    ],
    ja: [
      "公理A5は、$\\forall x.(\\varphi \\to \\psi)$が成り立ち、xが$\\varphi$に自由出現しないならば、$\\varphi \\to \\forall x. \\psi$も成り立つことを述べます。直観的には、$\\varphi$の真偽がxに依存しないなら、$\\varphi$を$\\forall$xのスコープの外に出せるということです。",
      "xが$\\varphi$に自由出現しないという条件は本質的です。この条件がなければ、公理は健全ではなくなります。例えば、$\\forall$x.(P(x) $\\to$ Q(x)) $\\to$ (P(x) $\\to \\forall$x.Q(x))はP(x)にxが自由出現するため不正です。",
      "A4およびGen規則とともに、A5は一階述語論理の公理化を完成させます。",
    ],
  },
  formalNotation:
    "\\forall x.(\\varphi \\to \\psi) \\to (\\varphi \\to \\forall x.\\psi)",
  relatedEntryIds: ["axiom-a4", "rule-gen", "concept-free-variable"],
  relatedQuestIds: ["pred-04", "pred-05", "pred-06"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/First-order_logic#Axioms_for_quantifiers",
      label: {
        en: "First-order logic: quantifier axioms (Wikipedia)",
        ja: "一階論理: 量化子の公理 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E4%B8%80%E9%9A%8E%E8%BF%B0%E8%AA%9E%E8%AB%96%E7%90%86",
      label: {
        en: "First-order logic (Wikipedia JA)",
        ja: "一階述語論理 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/first-order+logic",
      label: {
        en: "First-order logic (nLab)",
        ja: "一階論理 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "A5",
    "universal distribution",
    "全称分配",
    "predicate",
    "side condition",
  ],
  order: 8,
};

const axiomExDef: ReferenceEntry = {
  id: "axiom-ex-def",
  category: "axiom",
  title: {
    en: "Axiom EX-DEF (Existential Definition)",
    ja: "公理 EX-DEF (存在量化子定義)",
  },
  summary: {
    en: "$\\exists x. \\varphi \\leftrightarrow \\lnot \\forall x. \\lnot \\varphi$ — Existential quantifier defined as negated universal negation (bidirectional).",
    ja: "$\\exists x. \\varphi \\leftrightarrow \\lnot \\forall x. \\lnot \\varphi$ — 存在量化子を全称量化子の否定で定義（双方向）。",
  },
  body: {
    en: [
      "The existential quantifier $\\exists x. \\varphi$ is a shorthand for $\\lnot \\forall x. \\lnot \\varphi$. This axiom provides bidirectional conversion between the two forms.",
      "Forward direction: ($\\exists x. \\varphi) \\to \\lnot (\\forall x. \\lnot \\varphi$). If there exists an x satisfying $\\varphi$, then it is not the case that all x fail to satisfy $\\varphi$.",
      "Backward direction: $\\lnot (\\forall x. \\lnot \\varphi) \\to (\\exists x. \\varphi)$. If not all x fail to satisfy $\\varphi$, then there exists an x satisfying $\\varphi$.",
      "This definition axiom is analogous to CONJ-DEF and DISJ-DEF, which define conjunction and disjunction in terms of implication and negation.",
    ],
    ja: [
      "存在量化子 $\\exists x. \\varphi$ は $\\lnot \\forall x. \\lnot \\varphi$ の略記です。この公理は2つの形式の間の双方向変換を提供します。",
      "正方向: ($\\exists x. \\varphi) \\to \\lnot (\\forall x. \\lnot \\varphi$)。$\\varphi$を満たすxが存在するなら、すべてのxが$\\varphi$を満たさないということはありません。",
      "逆方向: $\\lnot (\\forall x. \\lnot \\varphi) \\to (\\exists x. \\varphi)$。すべてのxが$\\varphi$を満たさないのではないなら、$\\varphi$を満たすxが存在します。",
      "この定義公理はCONJ-DEFやDISJ-DEFと類似しており、それらが連言と選言を含意と否定で定義するのと同様です。",
    ],
  },
  formalNotation:
    "\\exists x.\\varphi \\leftrightarrow \\lnot\\forall x.\\lnot\\varphi",
  relatedEntryIds: ["axiom-a4", "axiom-a5", "notation-quantifiers"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Existential_quantification",
      label: {
        en: "Existential quantification (Wikipedia)",
        ja: "存在量化 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E5%AD%98%E5%9C%A8%E9%87%8F%E5%8C%96",
      label: {
        en: "Existential quantification (Wikipedia JA)",
        ja: "存在量化 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
  ],
  keywords: [
    "EX-DEF",
    "existential definition",
    "存在量化子定義",
    "∃-Def",
    "existential",
  ],
  order: 9,
};

const axiomE1: ReferenceEntry = {
  id: "axiom-e1",
  category: "axiom",
  title: { en: "Axiom E1 (Reflexivity)", ja: "公理 E1 (反射律)" },
  summary: {
    en: "$\\forall$x. x = x — Every term is equal to itself.",
    ja: "$\\forall$x. x = x — すべての項は自分自身と等しい。",
  },
  body: {
    en: [
      "<b>Reflexivity</b> is the most fundamental property of equality: every object is equal to itself.",
      "This axiom provides the base case for equality reasoning. Via universal instantiation (A4), it gives concrete instances like 0 = 0, f(x) = f(x), and x + y = x + y for any term.",
    ],
    ja: [
      "<b>反射律</b>は等号の最も基本的な性質です: すべての対象は自分自身と等しいです。",
      "この公理は等号に関する推論の基本ケースを提供します。全称例化(A4)により、任意の項に対して 0 = 0, f(x) = f(x), x + y = x + y などの具体的なインスタンスが得られます。",
    ],
  },
  formalNotation: "\\forall x.\\ x = x",
  relatedEntryIds: ["axiom-e2", "axiom-e3", "axiom-e4", "axiom-e5"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Equality_(mathematics)",
      label: { en: "Equality (Wikipedia)", ja: "等号 (Wikipedia)" },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E7%AD%89%E5%8F%B7",
      label: { en: "Equality (Wikipedia JA)", ja: "等号 (Wikipedia)" },
      documentLanguage: "ja",
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/Reflexive.html",
      label: { en: "Reflexive (MathWorld)", ja: "反射的 (MathWorld)" },
      documentLanguage: "en",
    },
  ],
  keywords: ["E1", "reflexivity", "equality", "反射律", "等号"],
  order: 9,
};

const axiomE2: ReferenceEntry = {
  id: "axiom-e2",
  category: "axiom",
  title: { en: "Axiom E2 (Symmetry)", ja: "公理 E2 (対称律)" },
  summary: {
    en: "$\\forall x. \\forall y. x = y \\to$ y = x — Equality is symmetric.",
    ja: "$\\forall x. \\forall y. x = y \\to$ y = x — 等号は対称的である。",
  },
  body: {
    en: [
      "<b>Symmetry</b> states that if x equals y, then y equals x. The direction of equality does not matter.",
    ],
    ja: [
      "<b>対称律</b>は、xがyと等しいならば、yもxと等しいことを述べます。等号の向きは関係ありません。",
    ],
  },
  formalNotation: "\\forall x. \\forall y.\\ x = y \\to y = x",
  relatedEntryIds: ["axiom-e1", "axiom-e3", "axiom-e4", "axiom-e5"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Symmetric_relation",
      label: {
        en: "Symmetric relation (Wikipedia)",
        ja: "対称関係 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/EquivalenceRelation.html",
      label: {
        en: "Equivalence relation (MathWorld)",
        ja: "同値関係 (MathWorld)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: ["E2", "symmetry", "equality", "対称律"],
  order: 10,
};

const axiomE3: ReferenceEntry = {
  id: "axiom-e3",
  category: "axiom",
  title: { en: "Axiom E3 (Transitivity)", ja: "公理 E3 (推移律)" },
  summary: {
    en: "$\\forall x. \\forall y. \\forall z. x = y \\to (y = z \\to$ x = z) — Equality is transitive.",
    ja: "$\\forall x. \\forall y. \\forall z. x = y \\to (y = z \\to$ x = z) — 等号は推移的である。",
  },
  body: {
    en: [
      "<b>Transitivity</b> states that if x = y and y = z, then x = z. This allows chaining equalities.",
      "Together with reflexivity (E1) and symmetry (E2), transitivity makes equality an equivalence relation.",
      "For multi-step equality chains (e.g., a = b, b = c, c = d $\\to$ a = d), transitivity must be applied repeatedly.",
    ],
    ja: [
      "<b>推移律</b>は、x = y かつ y = z ならば x = z であることを述べます。等式を連鎖させることができます。",
      "反射律(E1)と対称律(E2)とともに、推移律は等号を同値関係にします。",
      "多段の等式連鎖（例: a = b, b = c, c = d $\\to$ a = d）では、推移律を繰り返し適用する必要があります。",
    ],
  },
  formalNotation:
    "\\forall x. \\forall y. \\forall z.\\ x = y \\to (y = z \\to x = z)",
  relatedEntryIds: ["axiom-e1", "axiom-e2", "axiom-e4", "axiom-e5"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Transitive_relation",
      label: {
        en: "Transitive relation (Wikipedia)",
        ja: "推移関係 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/Transitive.html",
      label: { en: "Transitive (MathWorld)", ja: "推移的 (MathWorld)" },
      documentLanguage: "en",
    },
  ],
  keywords: ["E3", "transitivity", "equality", "推移律"],
  order: 11,
};

const axiomE4: ReferenceEntry = {
  id: "axiom-e4",
  category: "axiom",
  title: {
    en: "Axiom E4 (Function Congruence)",
    ja: "公理 E4 (関数の合同律)",
  },
  summary: {
    en: "x₁ = y₁ $\\land$ ··· $\\land$ xₙ = yₙ $\\to$ f(x₁,...,xₙ) = f(y₁,...,yₙ) — Equal arguments yield equal function values.",
    ja: "x₁ = y₁ $\\land$ ··· $\\land$ xₙ = yₙ $\\to$ f(x₁,...,xₙ) = f(y₁,...,yₙ) — 等しい引数は等しい関数値を与える。",
  },
  body: {
    en: [
      "<b>Function congruence</b> (E4) states that if corresponding arguments are equal, then the function values are also equal. For each n-ary function symbol f in the signature, there is an instance of E4.",
      "For a unary function f: $\\forall x. \\forall y. x = y \\to$ f(x) = f(y). For a binary operation ∘: $\\forall$x₁.$\\forall$y₁.$\\forall$x₂.$\\forall$y₂. x₁ = y₁ $\\land$ x₂ = y₂ $\\to$ x₁ ∘ x₂ = y₁ ∘ y₂.",
      "E4 is a <i>schema family</i>: it generates a separate axiom instance for each function symbol in the theory's signature (including binary operators like +, −, ×).",
    ],
    ja: [
      "<b>関数の合同律</b> (E4) は、対応する引数が等しければ関数値も等しいことを述べます。シグネチャ中の各n項関数記号fに対してE4のインスタンスがあります。",
      "単項関数fの場合: $\\forall x. \\forall y. x = y \\to$ f(x) = f(y)。二項演算∘の場合: $\\forall$x₁.$\\forall$y₁.$\\forall$x₂.$\\forall$y₂. x₁ = y₁ $\\land$ x₂ = y₂ $\\to$ x₁ ∘ x₂ = y₁ ∘ y₂。",
      "E4は<i>スキーマ族</i>です: 理論のシグネチャ中の各関数記号（+, −, ×などの二項演算子を含む）に対して、別個の公理インスタンスが生成されます。",
    ],
  },
  formalNotation:
    "\\forall \\vec{x}. \\forall \\vec{y}.\\ \\bigwedge_i x_i = y_i \\to f(\\vec{x}) = f(\\vec{y})",
  relatedEntryIds: ["axiom-e1", "axiom-e3", "axiom-e5"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Congruence_relation",
      label: {
        en: "Congruence relation (Wikipedia)",
        ja: "合同関係 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E5%90%88%E5%90%8C%E9%96%A2%E4%BF%82",
      label: {
        en: "Congruence relation (Wikipedia JA)",
        ja: "合同関係 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/congruence",
      label: {
        en: "Congruence (nLab)",
        ja: "合同 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "E4",
    "function congruence",
    "congruence",
    "equality",
    "合同律",
    "関数",
  ],
  order: 12,
};

const axiomE5: ReferenceEntry = {
  id: "axiom-e5",
  category: "axiom",
  title: {
    en: "Axiom E5 (Predicate Congruence)",
    ja: "公理 E5 (述語の合同律)",
  },
  summary: {
    en: "x₁ = y₁ $\\land$ ··· $\\land$ xₙ = yₙ $\\to$ (P(x₁,...,xₙ) $\\to$ P(y₁,...,yₙ)) — Equal arguments preserve predicate truth.",
    ja: "x₁ = y₁ $\\land$ ··· $\\land$ xₙ = yₙ $\\to$ (P(x₁,...,xₙ) $\\to$ P(y₁,...,yₙ)) — 等しい引数は述語の真偽を保存する。",
  },
  body: {
    en: [
      "<b>Predicate congruence</b> (E5) states that if corresponding arguments are equal, and the predicate holds for one set of arguments, it also holds for the other. For each n-ary predicate symbol P, there is an instance of E5.",
      "For a unary predicate P: $\\forall x. \\forall y. x = y \\to$ (P(x) $\\to$ P(y)). The reverse direction (P(y) $\\to$ P(x)) is derivable by combining E2 (symmetry) with E5.",
      "Like E4, E5 is a <i>schema family</i>: it generates a separate axiom instance for each predicate symbol in the theory's signature.",
      "E5 is equivalent to the <b>Leibniz substitution principle</b>: t₁ = t₂ $\\to \\varphi$[t₁/x] $\\to \\varphi$[t₂/x], which encompasses both E4 and E5 in a more abstract form.",
    ],
    ja: [
      "<b>述語の合同律</b> (E5) は、対応する引数が等しく、一方の引数の組に対して述語が成り立つなら、もう一方でも成り立つことを述べます。シグネチャ中の各n項述語記号Pに対してE5のインスタンスがあります。",
      "単項述語Pの場合: $\\forall x. \\forall y. x = y \\to$ (P(x) $\\to$ P(y))。逆方向（P(y) $\\to$ P(x)）はE2（対称律）とE5を組み合わせて導出できます。",
      "E4と同様に、E5は<i>スキーマ族</i>です: 理論のシグネチャ中の各述語記号に対して、別個の公理インスタンスが生成されます。",
      "E5は<b>ライプニッツの代入原理</b> t₁ = t₂ $\\to \\varphi$[t₁/x] $\\to \\varphi$[t₂/x] と同値であり、より抽象的な形でE4とE5の両方を包含します。",
    ],
  },
  formalNotation:
    "\\forall \\vec{x}. \\forall \\vec{y}.\\ \\bigwedge_i x_i = y_i \\to (P(\\vec{x}) \\to P(\\vec{y}))",
  relatedEntryIds: ["axiom-e1", "axiom-e2", "axiom-e4", "concept-substitution"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Leibniz%27s_law",
      label: {
        en: "Identity of indiscernibles (Wikipedia)",
        ja: "不可識別者同一の原理 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E4%B8%8D%E5%8F%AF%E8%AD%98%E5%88%A5%E8%80%85%E5%90%8C%E4%B8%80%E3%81%AE%E5%8E%9F%E7%90%86",
      label: {
        en: "Identity of indiscernibles (Wikipedia JA)",
        ja: "不可識別者同一の原理 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/identity+of+indiscernibles",
      label: {
        en: "Identity of indiscernibles (nLab)",
        ja: "不可識別者同一の原理 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "E5",
    "predicate congruence",
    "Leibniz",
    "congruence",
    "equality",
    "合同律",
    "述語",
    "ライプニッツ",
  ],
  order: 13,
};

// ============================================================
// 推論規則 (Inference Rules)
// ============================================================

const ruleMP: ReferenceEntry = {
  id: "rule-mp",
  category: "inference-rule",
  title: { en: "Modus Ponens (MP)", ja: "モーダスポネンス (MP)" },
  summary: {
    en: "From $\\varphi$ and $\\varphi \\to \\psi$, derive $\\psi$.",
    ja: "$\\varphi$ と $\\varphi \\to \\psi$ から $\\psi$ を導出する。",
  },
  body: {
    en: [
      "<b>Modus ponens</b> (MP, also called <i>detachment</i>) is the sole inference rule in Hilbert-style proof systems.",
      "Given two premises — $\\varphi$ (the minor premise) and $\\varphi \\to \\psi$ (the major premise) — MP allows us to conclude $\\psi$.",
      "All logical reasoning in Hilbert systems reduces to combinations of axiom instances and MP applications.",
    ],
    ja: [
      "<b>モーダスポネンス</b> (MP、<i>分離規則</i>とも呼ばれる) はHilbert系証明体系における唯一の推論規則です。",
      "2つの前提 — $\\varphi$（小前提）と $\\varphi \\to \\psi$（大前提）— から、MPは$\\psi$を結論として導きます。",
      "Hilbert系におけるすべての論理的推論は、公理インスタンスとMP適用の組み合わせに帰着します。",
    ],
  },
  formalNotation: "\\dfrac{\\varphi \\qquad \\varphi \\to \\psi}{\\psi}",
  relatedEntryIds: ["axiom-a1", "axiom-a2", "rule-gen"],
  relatedQuestIds: ["prop-01", "prop-02", "prop-03"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Modus_ponens",
      label: {
        en: "Modus ponens (Wikipedia)",
        ja: "モーダスポネンス (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%83%A2%E3%83%BC%E3%83%80%E3%82%B9%E3%83%9D%E3%83%8D%E3%83%B3%E3%82%B9",
      label: {
        en: "Modus ponens (Wikipedia JA)",
        ja: "モーダスポネンス (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/ModusPonens.html",
      label: {
        en: "Modus Ponens (MathWorld)",
        ja: "モーダスポネンス (MathWorld)",
      },
      documentLanguage: "en",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/modus+ponens",
      label: {
        en: "Modus ponens (nLab)",
        ja: "モーダスポネンス (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "MP",
    "modus ponens",
    "detachment",
    "モーダスポネンス",
    "分離規則",
  ],
  order: 1,
};

const ruleGen: ReferenceEntry = {
  id: "rule-gen",
  category: "inference-rule",
  title: { en: "Generalization (Gen)", ja: "汎化 (Gen)" },
  summary: {
    en: "From $\\varphi$, derive $\\forall x. \\varphi$ — If $\\varphi$ is provable, then $\\forall x. \\varphi$ is provable.",
    ja: "$\\varphi$ から $\\forall x. \\varphi$ を導出する — $\\varphi$が証明可能なら、$\\forall x. \\varphi$も証明可能。",
  },
  body: {
    en: [
      "The <b>generalization rule</b> (Gen) allows us to universally quantify over a provable formula.",
      "If $\\varphi$ has been derived (without any undischarged assumptions involving x), then $\\forall x. \\varphi$ can be concluded.",
      "Gen is the second inference rule (alongside MP) used in first-order predicate logic.",
    ],
    ja: [
      "<b>汎化規則</b> (Gen) は、証明可能な論理式に全称量化子を付けることを許します。",
      "$\\varphi$が（xを含む解除されていない仮定なしに）導出されているなら、$\\forall x. \\varphi$を結論できます。",
      "Genは一階述語論理で（MPに加えて）使用される第二の推論規則です。",
    ],
  },
  formalNotation: "\\dfrac{\\varphi}{\\forall x. \\varphi}",
  relatedEntryIds: ["rule-mp", "axiom-a4", "axiom-a5"],
  relatedQuestIds: ["pred-01", "pred-04", "pred-05"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Universal_generalization",
      label: {
        en: "Universal generalization (Wikipedia)",
        ja: "全称汎化 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E5%85%A8%E7%A7%B0%E6%B1%8E%E5%8C%96",
      label: {
        en: "Universal generalization (Wikipedia JA)",
        ja: "全称汎化 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/universal+quantifier",
      label: {
        en: "Universal quantifier (nLab)",
        ja: "全称量化子 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: ["Gen", "generalization", "universal", "汎化", "全称"],
  order: 2,
};

const ruleNdOverview: ReferenceEntry = {
  id: "rule-nd-overview",
  category: "inference-rule",
  title: {
    en: "Natural Deduction (Overview)",
    ja: "自然演繹 (概要)",
  },
  summary: {
    en: "A proof system using introduction and elimination rules for each connective.",
    ja: "各結合子に対する導入規則と除去規則を用いる証明体系。",
  },
  body: {
    en: [
      "<b>Natural deduction</b> (ND) is a proof system introduced by Gentzen (1935) where each logical connective has <i>introduction</i> rules (how to prove it) and <i>elimination</i> rules (how to use it).",
      "Three variants are supported: <b>NM</b> (minimal logic, no explosion or DNE), <b>NJ</b> (intuitionistic logic, adds EFQ), and <b>NK</b> (classical logic, adds DNE). NM ⊂ NJ ⊂ NK in terms of provable theorems.",
      "Unlike Hilbert systems (which use only MP), natural deduction allows <i>assuming</i> a hypothesis and later <i>discharging</i> it — e.g., to prove $\\varphi \\to \\psi$, assume $\\varphi$ and derive $\\psi$.",
      "This application's implementation follows Bekki (戸次大介)『数理論理学』Chapter 8.",
    ],
    ja: [
      "<b>自然演繹</b> (ND) はGentzen (1935) が導入した証明体系で、各論理結合子に<i>導入規則</i>（どう証明するか）と<i>除去規則</i>（どう使うか）があります。",
      "3つの変種をサポートします: <b>NM</b>（最小論理、爆発律もDNEもなし）、<b>NJ</b>（直観主義論理、EFQを追加）、<b>NK</b>（古典論理、DNEを追加）。証明可能な定理の範囲は NM ⊂ NJ ⊂ NK です。",
      "Hilbert系（MPのみ使用）と異なり、自然演繹では仮定を<i>仮定</i>して後で<i>解除</i>することができます — 例えば、$\\varphi \\to \\psi$ を証明するには、$\\varphi$を仮定して$\\psi$を導出します。",
      "本アプリケーションの実装は戸次大介『数理論理学』第8章に基づいています。",
    ],
  },
  relatedEntryIds: [
    "rule-mp",
    "rule-nd-implication",
    "rule-nd-conjunction",
    "rule-nd-disjunction",
    "rule-sc-overview",
  ],
  relatedQuestIds: ["nd-01", "nd-02", "nd-03"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Natural_deduction",
      label: {
        en: "Natural deduction (Wikipedia)",
        ja: "自然演繹 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E8%87%AA%E7%84%B6%E6%BC%94%E7%B9%B9",
      label: {
        en: "Natural deduction (Wikipedia JA)",
        ja: "自然演繹 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/natural+deduction",
      label: {
        en: "Natural deduction (nLab)",
        ja: "自然演繹 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "natural deduction",
    "ND",
    "NM",
    "NJ",
    "NK",
    "Gentzen",
    "自然演繹",
    "導入規則",
    "除去規則",
  ],
  order: 3,
};

const ruleNdImplication: ReferenceEntry = {
  id: "rule-nd-implication",
  category: "inference-rule",
  title: {
    en: "ND: Implication Rules (→I / →E)",
    ja: "ND: 含意規則 (→I / →E)",
  },
  summary: {
    en: "$\\to$I discharges an assumption to form $\\varphi \\to \\psi$; $\\to$E is Modus Ponens.",
    ja: "$\\to$Iは仮定を解除して$\\varphi \\to \\psi$を形成し、$\\to$Eはモーダスポネンス。",
  },
  body: {
    en: [
      "<b>Implication Introduction ($\\to$I)</b>: Assume $\\varphi$, derive $\\psi$, then discharge the assumption to conclude $\\varphi \\to \\psi$. This is the core mechanism of natural deduction — hypothetical reasoning.",
      "<b>Implication Elimination ($\\to$E)</b>: From $\\varphi$ and $\\varphi \\to \\psi$, derive $\\psi$. This is exactly Modus Ponens (MP).",
      "$\\to$I is the rule that most distinguishes natural deduction from Hilbert systems: instead of needing the deduction theorem as a metatheorem, it is built directly into the proof system.",
    ],
    ja: [
      "<b>含意導入 ($\\to$I)</b>: $\\varphi$を仮定し、$\\psi$を導出し、その仮定を解除して$\\varphi \\to \\psi$を結論します。これは自然演繹の核心的メカニズム — 仮説的推論です。",
      "<b>含意除去 ($\\to$E)</b>: $\\varphi$と$\\varphi \\to \\psi$から$\\psi$を導出します。これはモーダスポネンス(MP)そのものです。",
      "$\\to$Iは自然演繹をHilbert系から最も区別する規則です: 演繹定理をメタ定理として必要とする代わりに、証明体系に直接組み込まれています。",
    ],
  },
  formalNotation:
    "\\to\\text{I}: \\dfrac{[\\varphi] \\quad \\vdots \\quad \\psi}{\\varphi \\to \\psi} \\qquad \\to\\text{E}: \\dfrac{\\varphi \\quad \\varphi \\to \\psi}{\\psi}",
  relatedEntryIds: [
    "rule-mp",
    "rule-nd-overview",
    "rule-nd-conjunction",
    "rule-nd-disjunction",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Natural_deduction#Implication_introduction_and_elimination",
      label: {
        en: "ND implication rules (Wikipedia)",
        ja: "自然演繹の含意規則 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Deduction_theorem",
      label: {
        en: "Deduction theorem (Wikipedia)",
        ja: "演繹定理 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E6%BC%94%E7%B9%B9%E5%AE%9A%E7%90%86",
      label: {
        en: "Deduction theorem (Wikipedia JA)",
        ja: "演繹定理 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
  ],
  keywords: [
    "implication introduction",
    "implication elimination",
    "→I",
    "→E",
    "含意導入",
    "含意除去",
    "deduction theorem",
    "演繹定理",
  ],
  order: 4,
};

const ruleNdConjunction: ReferenceEntry = {
  id: "rule-nd-conjunction",
  category: "inference-rule",
  title: {
    en: "ND: Conjunction Rules (∧I / ∧E)",
    ja: "ND: 連言規則 (∧I / ∧E)",
  },
  summary: {
    en: "$\\land$I combines two formulas into a conjunction; $\\land$E extracts a component.",
    ja: "$\\land$Iは2つの論理式を連言に結合し、$\\land$Eは成分を取り出す。",
  },
  body: {
    en: [
      "<b>Conjunction Introduction ($\\land$I)</b>: From $\\varphi$ and $\\psi$, derive $\\varphi \\land \\psi$. Both components must be proven independently.",
      "<b>Conjunction Elimination ($\\land$E)</b>: From $\\varphi \\land \\psi$, derive $\\varphi$ (left projection) or $\\psi$ (right projection). There are two variants: $\\land$E-left and $\\land$E-right.",
      "In Hilbert systems, conjunction is typically defined as $\\varphi \\land \\psi \\equiv \\lnot (\\varphi \\to \\lnot \\psi)$, making these rules derivable rather than primitive.",
    ],
    ja: [
      "<b>連言導入 ($\\land$I)</b>: $\\varphi$と$\\psi$から$\\varphi \\land \\psi$を導出します。両方の成分を独立に証明する必要があります。",
      "<b>連言除去 ($\\land$E)</b>: $\\varphi \\land \\psi$から$\\varphi$（左射影）または$\\psi$（右射影）を導出します。$\\land$E-左と$\\land$E-右の2つの変種があります。",
      "Hilbert系では連言は通常 $\\varphi \\land \\psi \\equiv \\lnot (\\varphi \\to \\lnot \\psi)$ と定義されるため、これらの規則は原始的ではなく導出可能です。",
    ],
  },
  formalNotation:
    "\\land\\text{I}: \\dfrac{\\varphi \\quad \\psi}{\\varphi \\land \\psi} \\qquad \\land\\text{E}: \\dfrac{\\varphi \\land \\psi}{\\varphi} \\quad \\dfrac{\\varphi \\land \\psi}{\\psi}",
  relatedEntryIds: [
    "rule-nd-overview",
    "rule-nd-implication",
    "rule-nd-disjunction",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Conjunction_introduction",
      label: {
        en: "Conjunction introduction (Wikipedia)",
        ja: "連言導入 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Conjunction_elimination",
      label: {
        en: "Conjunction elimination (Wikipedia)",
        ja: "連言除去 (Wikipedia)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "conjunction introduction",
    "conjunction elimination",
    "∧I",
    "∧E",
    "連言導入",
    "連言除去",
    "and",
  ],
  order: 5,
};

const ruleNdDisjunction: ReferenceEntry = {
  id: "rule-nd-disjunction",
  category: "inference-rule",
  title: {
    en: "ND: Disjunction Rules (∨I / ∨E)",
    ja: "ND: 選言規則 (∨I / ∨E)",
  },
  summary: {
    en: "$\\lor$I introduces a disjunction from one component; $\\lor$E performs case analysis.",
    ja: "$\\lor$Iは一方の成分から選言を導入し、$\\lor$Eは場合分けを行う。",
  },
  body: {
    en: [
      "<b>Disjunction Introduction ($\\lor$I)</b>: From $\\varphi$, derive $\\varphi \\lor \\psi$ (left injection) or $\\psi \\lor \\varphi$ (right injection). Only one disjunct needs to be proven.",
      "<b>Disjunction Elimination ($\\lor$E)</b>: From $\\varphi \\lor \\psi$, assuming $\\varphi$ yields $\\chi$, and assuming $\\psi$ also yields $\\chi$, then conclude $\\chi$. This is proof by cases — the most complex natural deduction rule, requiring two subproofs.",
      "In Hilbert systems, disjunction is defined as $\\varphi \\lor \\psi \\equiv \\lnot \\varphi \\to \\psi$, and case analysis must be reconstructed from this definition.",
    ],
    ja: [
      "<b>選言導入 ($\\lor$I)</b>: $\\varphi$から$\\varphi \\lor \\psi$（左注入）または$\\psi \\lor \\varphi$（右注入）を導出します。選言肢の一方だけを証明すれば十分です。",
      "<b>選言除去 ($\\lor$E)</b>: $\\varphi \\lor \\psi$から、$\\varphi$を仮定して$\\chi$を導出し、$\\psi$を仮定しても$\\chi$を導出できるなら、$\\chi$を結論します。これは場合分けによる証明 — 自然演繹で最も複雑な規則であり、2つの部分証明を必要とします。",
      "Hilbert系では選言は $\\varphi \\lor \\psi \\equiv \\lnot \\varphi \\to \\psi$ と定義され、場合分けはこの定義から再構成する必要があります。",
    ],
  },
  formalNotation:
    "\\lor\\text{I}: \\dfrac{\\varphi}{\\varphi \\lor \\psi} \\qquad \\lor\\text{E}: \\dfrac{\\varphi \\lor \\psi \\quad [\\varphi] \\vdots \\chi \\quad [\\psi] \\vdots \\chi}{\\chi}",
  relatedEntryIds: [
    "rule-nd-overview",
    "rule-nd-implication",
    "rule-nd-conjunction",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Disjunction_introduction",
      label: {
        en: "Disjunction introduction (Wikipedia)",
        ja: "選言導入 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Disjunction_elimination",
      label: {
        en: "Disjunction elimination (Wikipedia)",
        ja: "選言除去 (Wikipedia)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "disjunction introduction",
    "disjunction elimination",
    "∨I",
    "∨E",
    "選言導入",
    "選言除去",
    "case analysis",
    "場合分け",
    "or",
  ],
  order: 6,
};

const ruleScOverview: ReferenceEntry = {
  id: "rule-sc-overview",
  category: "inference-rule",
  title: {
    en: "Sequent Calculus (Overview)",
    ja: "シーケント計算 (概要)",
  },
  summary: {
    en: "A proof system using sequents Γ ⇒ Δ with left/right rules for each connective.",
    ja: "シーケント Γ ⇒ Δ を用い、各結合子に左右規則を持つ証明体系。",
  },
  body: {
    en: [
      "<b>Sequent calculus</b> (SC) is a proof system introduced by Gentzen (1935) alongside natural deduction. Proofs manipulate <i>sequents</i> of the form Γ ⇒ Δ, meaning 'from the multiset of assumptions Γ, at least one formula in Δ holds.'",
      "Each logical connective has a <b>left rule</b> (how it behaves as an assumption) and a <b>right rule</b> (how it behaves as a conclusion). Structural rules (weakening, contraction, exchange) control the shape of sequents.",
      "Three variants are supported: <b>LM</b> (minimal logic, right side exactly 1 formula), <b>LJ</b> (intuitionistic logic, right side at most 1 formula), and <b>LK</b> (classical logic, unrestricted right side).",
      "The <b>cut elimination theorem</b> (Gentzen's Hauptsatz) proves that the cut rule can always be eliminated, yielding proofs in a canonical form — a fundamental result in proof theory.",
    ],
    ja: [
      "<b>シーケント計算</b> (SC) はGentzen (1935) が自然演繹とともに導入した証明体系です。<i>シーケント</i> Γ ⇒ Δ を操作します。意味は「仮定の多重集合Γから、Δの論理式の少なくとも1つが成り立つ」です。",
      "各論理結合子に<b>左規則</b>（仮定としてどう振る舞うか）と<b>右規則</b>（結論としてどう振る舞うか）があります。構造規則（弱化、縮約、交換）がシーケントの形を制御します。",
      "3つの変種をサポートします: <b>LM</b>（最小論理、右辺はちょうど1つの論理式）、<b>LJ</b>（直観主義論理、右辺は高々1つ）、<b>LK</b>（古典論理、右辺の制約なし）。",
      "<b>カット除去定理</b> (Gentzenの基本定理, Hauptsatz) は、カット規則が常に除去可能であることを証明し、正規形の証明が得られます — 証明論における基本的な結果です。",
    ],
  },
  relatedEntryIds: [
    "rule-nd-overview",
    "rule-sc-structural",
    "rule-sc-logical",
    "rule-mp",
  ],
  relatedQuestIds: ["sc-01", "sc-02", "sc-03"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Sequent_calculus",
      label: {
        en: "Sequent calculus (Wikipedia)",
        ja: "シーケント計算 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%B7%E3%83%BC%E3%82%B1%E3%83%B3%E3%83%88%E8%A8%88%E7%AE%97",
      label: {
        en: "Sequent calculus (Wikipedia JA)",
        ja: "シーケント計算 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/sequent+calculus",
      label: {
        en: "Sequent calculus (nLab)",
        ja: "シーケント計算 (nLab)",
      },
      documentLanguage: "en",
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/Sequent.html",
      label: {
        en: "Sequent (MathWorld)",
        ja: "シーケント (MathWorld)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "sequent calculus",
    "SC",
    "LM",
    "LJ",
    "LK",
    "Gentzen",
    "Hauptsatz",
    "シーケント計算",
    "カット除去",
    "sequent",
  ],
  order: 7,
};

const ruleScStructural: ReferenceEntry = {
  id: "rule-sc-structural",
  category: "inference-rule",
  title: {
    en: "SC: Structural Rules",
    ja: "SC: 構造規則",
  },
  summary: {
    en: "Cut, weakening, contraction, and exchange rules that manipulate sequent structure without introducing logical connectives.",
    ja: "カット、弱化、縮約、交換 — 論理結合子を導入せずにシーケントの構造を操作する規則群。",
  },
  body: {
    en: [
      "Structural rules manipulate the shape of sequents without referring to any logical connective. In Gentzen-style sequent calculus, each structural rule has a left variant (operating on the antecedent) and a right variant (operating on the succedent). The availability of right-side variants is the key distinction between LK (classical), LJ (intuitionistic), and LM (minimal) (Bekki, Definitions 10.3, 10.23, 10.36).",
      "<b>Identity (ID)</b>: $\\varphi$ ⇒ $\\varphi$ — the axiom of sequent calculus. Every formula implies itself. Present in all three systems (LK, LJ, LM).",
      "<b>Cut</b>: From Γ ⇒ Π,$\\varphi$ and $\\varphi$,Σ ⇒ Δ, derive Γ,Σ ⇒ Π,Δ. Corresponds to lemma usage — proving an intermediate result and then using it. The cut elimination theorem (Theorem 11.2) shows that cut is <i>admissible</i>: any sequent provable with cut can also be proved without it, though the proof may be much larger.",
      "<b>Weakening (w)</b>: Left weakening (w⇒) adds an unused formula to the antecedent: from Γ ⇒ Δ derive $\\varphi$,Γ ⇒ Δ. Right weakening (⇒w) adds to the succedent: from Γ ⇒ Δ derive Γ ⇒ Δ,$\\varphi$. In <b>LK</b>, both variants are primitive rules. In <b>LJ</b>, only left weakening (w⇒) and a restricted right weakening (⇒w, only when succedent is empty) are available, because the succedent has at most one formula. In <b>LM</b>, right weakening is effectively unavailable (Remark 10.35): the succedent is never empty in a subproof, so ⇒w cannot be applied. In tableau-style sequent calculus (TAB), weakening is not a primitive rule but is <i>admissible</i> (Theorem 12.9).",
      "<b>Contraction (c)</b>: Left contraction (c⇒) merges duplicates in the antecedent: from $\\varphi , \\varphi$,Γ ⇒ Δ derive $\\varphi$,Γ ⇒ Δ. Right contraction (⇒c) merges duplicates in the succedent: from Γ ⇒ Δ,$\\varphi , \\varphi$ derive Γ ⇒ Δ,$\\varphi$. In <b>LK</b>, both variants are available. In <b>LJ</b> and <b>LM</b>, only left contraction (c⇒) is available, since the succedent length is already at most 1. In TAB, contraction is also <i>admissible</i> (Theorem 12.11): one can always absorb duplicate formulas without an explicit contraction step.",
      "<b>Exchange (e)</b>: Left exchange (e⇒) reorders formulas in the antecedent: from Γ,$\\varphi , \\psi$,Σ ⇒ Δ derive Γ,$\\psi , \\varphi$,Σ ⇒ Δ. Right exchange (⇒e) does the same in the succedent. In <b>LK</b>, both variants are available. In <b>LJ</b> and <b>LM</b>, only left exchange (e⇒) is primitive, since the succedent has at most one formula. In practice, many formulations use multisets instead of sequences, making exchange implicit.",
      "<b>Differences across systems</b>: LK has full left/right symmetry in structural rules. LJ restricts the succedent to at most one formula (Definition 10.20), removing ⇒w, ⇒c, and ⇒e as independent rules. LM further removes the $\\bot$⇒ axiom from LJ (Definition 10.36), and effectively cannot use ⇒w (Remark 10.35). The inclusion relations are LM ⊂ LJ ⊂ LK (Theorems 10.26, 10.34).",
      "<b>Admissibility and cut elimination</b>: The cut elimination theorem (Theorem 11.2) holds for all three systems: LK, LJ, and LM. After cut elimination, the resulting proof uses only the identity axiom, structural rules other than cut, and logical rules. In TAB (tableau-style sequent calculus), weakening and contraction are <i>admissible</i> rather than primitive (Theorems 12.9, 12.11), meaning they can always be eliminated from proofs without loss of provability.",
    ],
    ja: [
      "構造規則は、論理結合子に言及することなくシーケントの形を操作する規則です。ゲンツェン流シーケント計算では、各構造規則に前件（左辺）に作用する左規則と後件（右辺）に作用する右規則があります。右側の規則の利用可否が、LK（古典）、LJ（直観主義）、LM（最小）の体系間の核心的な違いです（戸次, 定義10.3, 10.23, 10.36）。",
      "<b>同一律 (ID)</b>: $\\varphi$ ⇒ $\\varphi$ — シーケント計算の公理。すべての論理式は自分自身を含意します。LK, LJ, LM のすべてで利用できます。",
      "<b>カット (Cut)</b>: Γ ⇒ Π,$\\varphi$ と $\\varphi$,Σ ⇒ Δ から Γ,Σ ⇒ Π,Δ を導出します。中間結果を証明してそれを使うという補題の使用に対応します。カット除去定理（定理11.2）により、カットは<i>許容的</i>です：カットを使って証明可能なシーケントは、カットなしでも証明できます（ただし証明はずっと大きくなりうります）。",
      "<b>弱化 (w)</b>: 左弱化(w⇒)は前件に未使用の論理式を追加します：Γ ⇒ Δ から $\\varphi$,Γ ⇒ Δ。右弱化(⇒w)は後件に追加します：Γ ⇒ Δ から Γ ⇒ Δ,$\\varphi$。<b>LK</b>では両方が基本規則です。<b>LJ</b>では左弱化(w⇒)と制限付き右弱化（後件が空のときのみ⇒w）のみ利用可能です（後件は高々1個の論理式のため）。<b>LM</b>では右弱化は実質的に利用不可能です（解説10.35）：部分証明中に後件が空になることがないため、⇒wを適用できません。タブロー式シーケント計算(TAB)では、弱化は基本規則ではなく<i>許容規則</i>です（定理12.9）。",
      "<b>縮約 (c)</b>: 左縮約(c⇒)は前件の重複を統合します：$\\varphi , \\varphi$,Γ ⇒ Δ から $\\varphi$,Γ ⇒ Δ。右縮約(⇒c)は後件の重複を統合します：Γ ⇒ Δ,$\\varphi , \\varphi$ から Γ ⇒ Δ,$\\varphi$。<b>LK</b>では両方利用可能です。<b>LJ</b>と<b>LM</b>では後件の長さが高々1なので、左縮約(c⇒)のみ利用可能です。TABでも、縮約は<i>許容規則</i>です（定理12.11）：明示的な縮約ステップなしに重複する論理式を吸収できます。",
      "<b>交換 (e)</b>: 左交換(e⇒)は前件の論理式を並び替えます：Γ,$\\varphi , \\psi$,Σ ⇒ Δ から Γ,$\\psi , \\varphi$,Σ ⇒ Δ。右交換(⇒e)は後件で同様の操作を行います。<b>LK</b>では両方利用可能です。<b>LJ</b>と<b>LM</b>では後件が高々1個のため、左交換(e⇒)のみが基本規則です。実用的には多重集合ベースの定式化で交換を暗黙化することが一般的です。",
      "<b>体系間の違い</b>: LKは構造規則について完全な左右対称性を持ちます。LJは後件を高々1個の論理式に制限し（定義10.20）、⇒w, ⇒c, ⇒e を独立した規則として持ちません。LMはさらにLJから $\\bot$⇒ 公理を除いた体系で（定義10.36）、実質的に ⇒w も使用できません（解説10.35）。包含関係は LM ⊂ LJ ⊂ LK です（定理10.26, 10.34）。",
      "<b>許容性とカット除去</b>: カット除去定理（定理11.2）はLK, LJ, LMすべてで成り立ちます。カット除去後の証明は、同一律公理、カット以外の構造規則、論理規則のみを使用します。TAB（タブロー式シーケント計算）では、弱化と縮約は基本規則ではなく<i>許容規則</i>です（定理12.9, 12.11）。つまり、証明可能性を失うことなく証明から常に除去できます。",
    ],
  },
  formalNotation: [
    "\\text{ID}: \\quad \\varphi \\Rightarrow \\varphi",
    "\\text{Cut}: \\quad \\dfrac{\\Gamma \\Rightarrow \\Pi, \\varphi \\qquad \\varphi, \\Sigma \\Rightarrow \\Delta}{\\Gamma, \\Sigma \\Rightarrow \\Pi, \\Delta}",
    "\\text{w}\\Rightarrow: \\dfrac{\\Gamma \\Rightarrow \\Delta}{\\varphi, \\Gamma \\Rightarrow \\Delta} \\qquad \\Rightarrow\\text{w}: \\dfrac{\\Gamma \\Rightarrow \\Delta}{\\Gamma \\Rightarrow \\Delta, \\varphi}",
    "\\text{c}\\Rightarrow: \\dfrac{\\varphi, \\varphi, \\Gamma \\Rightarrow \\Delta}{\\varphi, \\Gamma \\Rightarrow \\Delta} \\qquad \\Rightarrow\\text{c}: \\dfrac{\\Gamma \\Rightarrow \\Delta, \\varphi, \\varphi}{\\Gamma \\Rightarrow \\Delta, \\varphi}",
    "\\text{e}\\Rightarrow: \\dfrac{\\Gamma, \\varphi, \\psi, \\Sigma \\Rightarrow \\Delta}{\\Gamma, \\psi, \\varphi, \\Sigma \\Rightarrow \\Delta} \\qquad \\Rightarrow\\text{e}: \\dfrac{\\Gamma \\Rightarrow \\Delta, \\varphi, \\psi}{\\Gamma \\Rightarrow \\Delta, \\psi, \\varphi}",
  ],
  relatedEntryIds: [
    "rule-sc-overview",
    "rule-sc-logical",
    "concept-cut-elimination",
    "concept-admissible-derivable",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Sequent_calculus#Structural_rules",
      label: {
        en: "Sequent calculus: Structural rules (Wikipedia)",
        ja: "シーケント計算: 構造規則 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%B7%E3%83%BC%E3%82%AF%E3%82%A8%E3%83%B3%E3%83%88%E8%A8%88%E7%AE%97",
      label: {
        en: "Sequent calculus (Wikipedia JA)",
        ja: "シーケント計算 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/structural+rule",
      label: {
        en: "Structural rule (nLab)",
        ja: "構造規則 (nLab)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Cut-elimination_theorem",
      label: {
        en: "Cut-elimination theorem (Wikipedia)",
        ja: "カット除去定理 (Wikipedia)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "cut",
    "weakening",
    "contraction",
    "exchange",
    "structural rule",
    "identity",
    "admissible",
    "LK",
    "LJ",
    "LM",
    "カット",
    "弱化",
    "縮約",
    "交換",
    "構造規則",
    "同一律",
    "許容規則",
  ],
  order: 8,
};

const ruleScLogical: ReferenceEntry = {
  id: "rule-sc-logical",
  category: "inference-rule",
  title: {
    en: "SC: Logical Rules",
    ja: "SC: 論理規則",
  },
  summary: {
    en: "Left/right introduction rules for $\\to , \\land , \\lor , \\forall , \\exists$ in sequent calculus.",
    ja: "シーケント計算における $\\to , \\land , \\lor , \\forall , \\exists$ の左右導入規則。",
  },
  body: {
    en: [
      "<b>Implication</b>: ($\\to$⇒) decomposes $\\varphi \\to \\psi$ on the left into two subgoals; (⇒$\\to$) moves $\\varphi$ from right to left assumptions to prove $\\psi$.",
      "<b>Conjunction</b>: ($\\land$⇒) selects one conjunct from the left; (⇒$\\land$) requires proving both conjuncts on the right.",
      "<b>Disjunction</b>: ($\\lor$⇒) performs case analysis on the left; (⇒$\\lor$) selects which disjunct to prove on the right.",
      "<b>Universal</b>: ($\\forall$⇒) instantiates with a term on the left; (⇒$\\forall$) introduces a fresh eigenvariable on the right.",
      "<b>Existential</b>: ($\\exists$⇒) introduces a fresh eigenvariable on the left; (⇒$\\exists$) instantiates with a term on the right.",
    ],
    ja: [
      "<b>含意</b>: ($\\to$⇒) 左の$\\varphi \\to \\psi$を2つの部分目標に分解します; (⇒$\\to$) 右の$\\varphi$を左の仮定に移して$\\psi$を証明します。",
      "<b>連言</b>: ($\\land$⇒) 左から連言の一方を選びます; (⇒$\\land$) 右の両方の連言肢を証明する必要があります。",
      "<b>選言</b>: ($\\lor$⇒) 左で場合分けを行います; (⇒$\\lor$) 右でどちらの選言肢を証明するか選びます。",
      "<b>全称</b>: ($\\forall$⇒) 左で項によって例化します; (⇒$\\forall$) 右で新しい固有変数を導入します。",
      "<b>存在</b>: ($\\exists$⇒) 左で新しい固有変数を導入します; (⇒$\\exists$) 右で項によって例化します。",
    ],
  },
  formalNotation:
    "\\to\\Rightarrow: \\dfrac{\\Gamma \\Rightarrow \\Delta, \\varphi \\qquad \\psi, \\Gamma' \\Rightarrow \\Delta'}{\\varphi \\to \\psi, \\Gamma, \\Gamma' \\Rightarrow \\Delta, \\Delta'}",
  relatedEntryIds: [
    "rule-sc-overview",
    "rule-sc-structural",
    "rule-nd-implication",
    "rule-nd-conjunction",
    "rule-nd-disjunction",
    "concept-context-sharing-independence",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Sequent_calculus#Inference_rules",
      label: {
        en: "Sequent calculus inference rules (Wikipedia)",
        ja: "シーケント計算の推論規則 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%B7%E3%83%BC%E3%82%AF%E3%82%A8%E3%83%B3%E3%83%88%E8%A8%88%E7%AE%97",
      label: {
        en: "Sequent calculus (Wikipedia JA)",
        ja: "シーケント計算 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/sequent+calculus",
      label: {
        en: "Sequent calculus (nLab)",
        ja: "シーケント計算 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "logical rule",
    "left rule",
    "right rule",
    "implication",
    "conjunction",
    "disjunction",
    "universal",
    "existential",
    "論理規則",
    "左規則",
    "右規則",
  ],
  order: 9,
};

// ============================================================
// 論理体系 (Logic Systems)
// ============================================================

const systemLukasiewicz: ReferenceEntry = {
  id: "system-lukasiewicz",
  category: "logic-system",
  title: {
    en: "Łukasiewicz System",
    ja: "ウカシェヴィチ体系",
  },
  summary: {
    en: "Classical propositional logic with axioms A1 (K), A2 (S), A3 (contraposition) + MP.",
    ja: "公理 A1 (K), A2 (S), A3 (対偶) + MP による古典命題論理体系。",
  },
  body: {
    en: [
      "The <b>Łukasiewicz system</b> is a Hilbert-style axiom system for classical propositional logic, named after the Polish logician Jan Łukasiewicz (1878–1956). It uses implication ($\\to$) and negation ($\\lnot$) as primitive connectives.",
      "It consists of three axiom schemas — <b>A1</b> ($\\varphi \\to (\\psi \\to \\varphi)$), <b>A2</b> (($\\varphi \\to (\\psi \\to \\chi)) \\to ((\\varphi \\to \\psi) \\to (\\varphi \\to \\chi)$)), <b>A3</b> (($\\lnot \\varphi \\to \\lnot \\psi) \\to (\\psi \\to \\varphi$)) — and one inference rule (Modus Ponens). All three axioms are independent: none can be derived from the others.",
      "Other connectives are defined in terms of $\\to$ and $\\lnot$: $\\varphi \\land \\psi \\equiv \\lnot (\\varphi \\to \\lnot \\psi), \\varphi \\lor \\psi \\equiv \\lnot \\varphi \\to \\psi , \\varphi \\leftrightarrow \\psi \\equiv (\\varphi \\to \\psi) \\land (\\psi \\to \\varphi)$. This minimality is characteristic of Hilbert-style systems.",
      "The system is <b>sound and complete</b> for classical propositional logic: every provable formula is a tautology (soundness), and every tautology is provable (completeness).",
      "In this application, the Łukasiewicz system serves as the default classical propositional base. It can be extended with predicate logic axioms (A4, A5 + Gen) for first-order logic, equality axioms (E1–E5) for equality logic, and theory-specific axioms (e.g., Peano Arithmetic, Group Theory) for mathematical theories.",
      "<b>Hierarchy in this application</b>: Minimal Logic (A1+A2) ⊂ Intuitionistic (A1+A2+EFQ) ⊂ Łukasiewicz/Classical (A1+A2+A3). The Łukasiewicz and Mendelson systems prove exactly the same theorems but use different formulations of the classical negation axiom.",
      '<b>Standard references</b>: This axiom system appears in many logic textbooks. The contraposition formulation (A3) is associated with the Polish school of logic. For Japanese readers, Daisuke Bekki\'s "数理論理学" covers Hilbert-style axiom systems in the Polish tradition.',
    ],
    ja: [
      "<b>ウカシェヴィチ体系</b>は、ポーランドの論理学者ヤン・ウカシェヴィチ (1878–1956) の名にちなむ古典命題論理のHilbert系公理体系です。含意($\\to$)と否定($\\lnot$)を原始結合子とします。",
      "3つの公理スキーマ — <b>A1</b> ($\\varphi \\to (\\psi \\to \\varphi)$)、<b>A2</b> (($\\varphi \\to (\\psi \\to \\chi)) \\to ((\\varphi \\to \\psi) \\to (\\varphi \\to \\chi)$))、<b>A3</b> (($\\lnot \\varphi \\to \\lnot \\psi) \\to (\\psi \\to \\varphi$)) — と1つの推論規則(モーダスポネンス)からなります。3つの公理はすべて独立しています: いずれも他から導出できません。",
      "他の結合子は$\\to$と$\\lnot$で定義されます: $\\varphi \\land \\psi \\equiv \\lnot (\\varphi \\to \\lnot \\psi)$、$\\varphi \\lor \\psi \\equiv \\lnot \\varphi \\to \\psi$、$\\varphi \\leftrightarrow \\psi \\equiv (\\varphi \\to \\psi) \\land (\\psi \\to \\varphi)$。この最小性はHilbert系の特徴です。",
      "この体系は古典命題論理に対して<b>健全かつ完全</b>です: 証明可能な論理式はすべてトートロジーであり（健全性）、すべてのトートロジーは証明可能です（完全性）。",
      "本アプリケーションでは、ウカシェヴィチ体系がデフォルトの古典命題論理基盤です。述語論理公理(A4, A5 + Gen)で一階論理へ、等号公理(E1–E5)で等号論理へ、理論公理（ペアノ算術、群論など）で数学理論へと拡張できます。",
      "<b>本アプリケーションでの階層</b>: 最小論理(A1+A2) ⊂ 直観主義(A1+A2+EFQ) ⊂ ウカシェヴィチ/古典(A1+A2+A3)。ウカシェヴィチ体系とメンデルソン体系はまったく同じ定理を証明しますが、古典的否定公理の定式化が異なります。",
      "<b>参考文献</b>: この公理系は多くの論理学教科書に登場します。対偶形式(A3)はポーランド学派の論理学に関連します。日本語では、戸次大介『数理論理学』がポーランド流のHilbert系公理体系を扱っています。",
    ],
  },
  relatedEntryIds: [
    "axiom-a1",
    "axiom-a2",
    "axiom-a3",
    "rule-mp",
    "system-mendelson",
    "system-classical",
    "system-minimal",
  ],
  relatedQuestIds: ["prop-01", "prop-02", "prop-03", "prop-04"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Jan_%C5%81ukasiewicz",
      label: {
        en: "Jan Łukasiewicz (Wikipedia)",
        ja: "ヤン・ウカシェヴィチ (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Hilbert_system",
      label: {
        en: "Hilbert system (Wikipedia)",
        ja: "ヒルベルト体系 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%83%92%E3%83%AB%E3%83%99%E3%83%AB%E3%83%88%E6%B5%81%E8%A8%BC%E6%98%8E%E8%AB%96",
      label: {
        en: "Hilbert-style deduction system (Wikipedia JA)",
        ja: "ヒルベルト流証明論 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/Hilbert+system",
      label: {
        en: "Hilbert system (nLab)",
        ja: "ヒルベルト体系 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "Łukasiewicz",
    "classical",
    "propositional",
    "Hilbert",
    "ウカシェヴィチ",
    "古典",
    "命題論理",
    "ヒルベルト",
    "sound",
    "complete",
  ],
  order: 1,
};

const systemMendelson: ReferenceEntry = {
  id: "system-mendelson",
  category: "logic-system",
  title: { en: "Mendelson System", ja: "メンデルソン体系" },
  summary: {
    en: "Classical propositional logic with A1, A2, M3 (reductio ad absurdum) + MP.",
    ja: "A1, A2, M3 (背理法) + MP による古典命題論理体系。",
  },
  body: {
    en: [
      "The <b>Mendelson system</b> is a Hilbert-style axiom system for classical propositional logic, named after the American logician Elliott Mendelson (1931–2020). It replaces the Łukasiewicz contraposition axiom A3 with M3 (reductio ad absurdum): ($\\lnot \\varphi \\to \\lnot \\psi) \\to ((\\lnot \\varphi \\to \\psi) \\to \\varphi$).",
      "A1 and A2 remain the same as in the Łukasiewicz system. M3 and A3 are <b>interderivable</b> in the presence of A1, A2, and MP, so both systems prove exactly the same set of theorems.",
      'The Mendelson system is widely used in logic textbooks, most notably in Mendelson\'s own "Introduction to Mathematical Logic" (1964, multiple editions). The reductio formulation M3 is sometimes considered more intuitive for beginners because it directly encodes proof by contradiction.',
      "In this application, the Mendelson system is available as an alternative classical propositional base. Like the Łukasiewicz system, it can be extended with predicate logic axioms (A4, A5 + Gen), equality axioms (E1–E5), and theory-specific axioms (Peano Arithmetic, Group Theory, etc.).",
      "<b>Comparison with Łukasiewicz</b>: While the two systems are equivalent in deductive power, they differ in proof style. A3 (contraposition) is concise but requires more intermediate steps; M3 (reductio) often leads to shorter proofs when reasoning by contradiction. The choice between them is largely a matter of taste and pedagogical preference.",
      '<b>Standard references</b>: Elliott Mendelson, "Introduction to Mathematical Logic" (1964, 6th ed. 2015) is the definitive textbook for this system. Herbert Enderton\'s "A Mathematical Introduction to Logic" (2001) uses a similar axiomatization.',
    ],
    ja: [
      "<b>メンデルソン体系</b>は、アメリカの論理学者エリオット・メンデルソン (1931–2020) の名にちなむ古典命題論理のHilbert系公理体系です。ウカシェヴィチ体系の対偶公理A3をM3（背理法）($\\lnot \\varphi \\to \\lnot \\psi) \\to ((\\lnot \\varphi \\to \\psi) \\to \\varphi$) に置き換えます。",
      "A1とA2はウカシェヴィチ体系と同じです。M3とA3はA1, A2, MPの存在下で<b>相互導出可能</b>なので、両体系はまったく同じ定理集合を証明します。",
      "メンデルソン体系は論理学の教科書で広く使われています。特にMendelsonの「Introduction to Mathematical Logic」(1964年、複数版)で有名です。背理法の定式化M3は矛盾による証明を直接符号化するため、初学者にはより直観的と考えられることもあります。",
      "本アプリケーションでは、メンデルソン体系は古典命題論理の代替基盤として利用可能です。ウカシェヴィチ体系と同様に、述語論理公理(A4, A5 + Gen)、等号公理(E1–E5)、理論公理（ペアノ算術、群論など）で拡張できます。",
      "<b>ウカシェヴィチ体系との比較</b>: 2つの体系は演繹力では同等ですが、証明のスタイルが異なります。A3（対偶）は簡潔ですが中間ステップが多くなりがちで、M3（背理法）は矛盾による推論で短い証明になることが多いです。選択は主に好みと教育的配慮の問題です。",
      "<b>参考文献</b>: Elliott Mendelson『Introduction to Mathematical Logic』(1964年、第6版2015年)がこの体系の標準的教科書です。Herbert Endertonの『A Mathematical Introduction to Logic』(2001年)も同様の公理化を使用しています。",
    ],
  },
  relatedEntryIds: [
    "axiom-a1",
    "axiom-a2",
    "axiom-m3",
    "rule-mp",
    "system-lukasiewicz",
    "system-classical",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Elliott_Mendelson",
      label: {
        en: "Elliott Mendelson (Wikipedia)",
        ja: "エリオット・メンデルソン (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Hilbert_system",
      label: {
        en: "Hilbert system (Wikipedia)",
        ja: "ヒルベルト体系 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%83%92%E3%83%AB%E3%83%99%E3%83%AB%E3%83%88%E6%B5%81%E8%A8%BC%E6%98%8E%E8%AB%96",
      label: {
        en: "Hilbert-style deduction system (Wikipedia JA)",
        ja: "ヒルベルト流証明論 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/Hilbert+system",
      label: {
        en: "Hilbert system (nLab)",
        ja: "ヒルベルト体系 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "Mendelson",
    "classical",
    "reductio",
    "メンデルソン",
    "背理法",
    "proof by contradiction",
  ],
  order: 2,
};

const systemMinimal: ReferenceEntry = {
  id: "system-minimal",
  category: "logic-system",
  title: { en: "Minimal Logic", ja: "最小論理" },
  summary: {
    en: "The weakest logic: A1, A2 + MP only. No negation axioms.",
    ja: "最も弱い論理: A1, A2 + MP のみ。否定公理なし。",
  },
  body: {
    en: [
      "<b>Minimal logic</b> (also called <i>Johansson's minimal logic</i>, named after Ingebrigt Johansson, 1936) uses only the axioms A1 (K), A2 (S), and the inference rule Modus Ponens. When restricted to implication alone, it is called the <i>positive implicational calculus</i>.",
      "It has no negation axioms: neither <b>ex falso quodlibet</b> (EFQ: $\\varphi \\to (\\lnot \\varphi \\to \\psi)$) nor <b>double negation elimination</b> (DNE: $\\lnot \\lnot \\varphi \\to \\varphi$) holds. Negation $\\lnot \\varphi$ is simply an abbreviation for $\\varphi \\to \\bot$ (or not treated specially at all).",
      "Minimal logic is the common core of all the logic systems in this application: <b>Minimal ⊂ Intuitionistic ⊂ Classical</b>. Any theorem of minimal logic is automatically a theorem of all stronger systems.",
      "In natural deduction, minimal logic corresponds to the system <b>NM</b>: it has introduction and elimination rules for $\\to , \\land , \\lor$, and weakening, but lacks EFQ and DNE. In sequent calculus, it corresponds to <b>LM</b>.",
      "Despite its weakness, minimal logic is computationally significant. Via the Curry-Howard correspondence, proofs in minimal logic correspond to simply-typed lambda calculus terms, making it the logical foundation of functional programming.",
    ],
    ja: [
      "<b>最小論理</b>（<i>ヨハンソンの最小論理</i>とも呼ばれ、Ingebrigt Johansson, 1936年に由来）は、公理A1 (K)、A2 (S)と推論規則モーダスポネンスのみを使用します。含意のみに限定した場合は<i>正含意計算</i>と呼ばれます。",
      "否定公理を持ちません: <b>爆発律</b> (EFQ: $\\varphi \\to (\\lnot \\varphi \\to \\psi)$) も<b>二重否定除去</b> (DNE: $\\lnot \\lnot \\varphi \\to \\varphi$) も成り立ちません。否定$\\lnot \\varphi$は単に$\\varphi \\to \\bot$の省略形（あるいは特別扱いしない）です。",
      "最小論理は本アプリケーションのすべての論理体系の共通核です: <b>最小論理 ⊂ 直観主義 ⊂ 古典</b>。最小論理の定理はすべての強い体系でも自動的に定理です。",
      "自然演繹では最小論理はシステム<b>NM</b>に対応します: $\\to , \\land , \\lor$の導入規則・除去規則と弱化を持ちますが、EFQとDNEを欠きます。シーケント計算では<b>LM</b>に対応します。",
      "弱い体系にもかかわらず、最小論理は計算論的に重要です。Curry-Howard対応を通じて、最小論理の証明は単純型付きラムダ計算の項に対応し、関数型プログラミングの論理的基盤となっています。",
    ],
  },
  relatedEntryIds: [
    "axiom-a1",
    "axiom-a2",
    "rule-mp",
    "system-intuitionistic",
    "system-classical",
    "rule-nd-overview",
    "rule-sc-overview",
    "concept-curry-howard",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Minimal_logic",
      label: {
        en: "Minimal logic (Wikipedia)",
        ja: "最小論理 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Curry%E2%80%93Howard_correspondence",
      label: {
        en: "Curry-Howard correspondence (Wikipedia)",
        ja: "Curry-Howard対応 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%AB%E3%83%AA%E3%83%BC%EF%BC%9D%E3%83%8F%E3%83%AF%E3%83%BC%E3%83%89%E5%90%8C%E5%9E%8B%E5%AF%BE%E5%BF%9C",
      label: {
        en: "Curry-Howard correspondence (Wikipedia JA)",
        ja: "カリー＝ハワード同型対応 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/minimal+logic",
      label: {
        en: "Minimal logic (nLab)",
        ja: "最小論理 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "minimal",
    "Johansson",
    "最小論理",
    "positive implicational",
    "正含意計算",
    "NM",
    "LM",
    "Curry-Howard",
  ],
  order: 3,
};

const systemIntuitionistic: ReferenceEntry = {
  id: "system-intuitionistic",
  category: "logic-system",
  title: { en: "Intuitionistic Logic", ja: "直観主義論理" },
  summary: {
    en: "A1, A2, EFQ + MP. Constructive reasoning without excluded middle.",
    ja: "A1, A2, EFQ + MP。排中律を持たない構成的推論。",
  },
  body: {
    en: [
      "<b>Intuitionistic logic</b> (also called <i>constructive logic</i>) was developed by L.E.J. Brouwer (1881–1966) and formalized by Arend Heyting (1898–1980). In the Hilbert-style formulation, it extends minimal logic with <b>ex falso quodlibet</b> (EFQ): $\\varphi \\to (\\lnot \\varphi \\to \\psi)$ — from a contradiction, anything follows.",
      "It does <b>not</b> have the law of excluded middle ($\\varphi \\lor \\lnot \\varphi$) or double negation elimination ($\\lnot \\lnot \\varphi \\to \\varphi$). A proof of $\\varphi$ requires constructive evidence — you cannot simply show that $\\lnot \\varphi$ leads to a contradiction.",
      "In natural deduction, intuitionistic logic corresponds to <b>NJ</b> (NM + EFQ). In sequent calculus, it corresponds to <b>LJ</b> (right side of sequents has at most one formula). In this application, the Hilbert-style variant uses A1, A2, EFQ, and MP.",
      "Intuitionistic logic is the foundation of <b>constructive mathematics</b> and the <b>BHK interpretation</b> (Brouwer-Heyting-Kolmogorov): a proof of $\\varphi \\to \\psi$ is a function transforming proofs of $\\varphi$ into proofs of $\\psi$; a proof of $\\varphi \\land \\psi$ is a pair of proofs; a proof of $\\varphi \\lor \\psi$ specifies which disjunct holds and provides its proof.",
      "Via the <b>Curry-Howard correspondence</b>, intuitionistic proofs correspond to programs in typed lambda calculi. This connection is the basis of proof assistants like Coq, Agda, and Lean.",
      "<b>Heyting Arithmetic</b> (HA) is the intuitionistic variant of Peano Arithmetic: it uses A1, A2, EFQ (instead of A3/M3/DNE) as the propositional base, combined with predicate logic and PA axioms. HA is available as a preset in this application.",
    ],
    ja: [
      "<b>直観主義論理</b>（<i>構成的論理</i>とも呼ばれる）は L.E.J. ブラウワー (1881–1966) によって発展され、アレンド・ヘイティング (1898–1980) によって形式化されました。Hilbert系の定式化では、最小論理に<b>爆発律</b> (EFQ): $\\varphi \\to (\\lnot \\varphi \\to \\psi)$（矛盾からは何でも導ける）を加えます。",
      "排中律（$\\varphi \\lor \\lnot \\varphi$）や二重否定除去（$\\lnot \\lnot \\varphi \\to \\varphi$）は成り立ち<b>ません</b>。$\\varphi$の証明には構成的な証拠が必要です — $\\lnot \\varphi$が矛盾を導くことを示すだけでは不十分です。",
      "自然演繹では直観主義論理はシステム<b>NJ</b> (NM + EFQ)に対応します。シーケント計算では<b>LJ</b>（シーケントの右辺が高々1つの論理式）に対応します。本アプリケーションのHilbert系では A1, A2, EFQ, MP を使用します。",
      "直観主義論理は<b>構成的数学</b>と<b>BHK解釈</b> (Brouwer-Heyting-Kolmogorov)の基礎です: $\\varphi \\to \\psi$の証明は$\\varphi$の証明を$\\psi$の証明に変換する関数; $\\varphi \\land \\psi$の証明は証明の対; $\\varphi \\lor \\psi$の証明はどちらの選言肢が成り立つか指定しその証明を与えます。",
      "<b>Curry-Howard対応</b>を通じて、直観主義の証明は型付きラムダ計算のプログラムに対応します。この対応関係はCoq, Agda, Leanなどの証明支援系の基礎です。",
      "<b>ヘイティング算術</b> (HA) はペアノ算術の直観主義版です: 命題論理基盤としてA1, A2, EFQ (A3/M3/DNEではなく) を使用し、述語論理とPA公理を組み合わせます。HAは本アプリケーションでプリセットとして利用可能です。",
    ],
  },
  relatedEntryIds: [
    "axiom-a1",
    "axiom-a2",
    "axiom-efq",
    "axiom-dne",
    "system-minimal",
    "system-classical",
    "rule-nd-overview",
    "rule-sc-overview",
    "theory-peano",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Intuitionistic_logic",
      label: {
        en: "Intuitionistic logic (Wikipedia)",
        ja: "直観主義論理 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E7%9B%B4%E8%A6%B3%E4%B8%BB%E7%BE%A9%E8%AB%96%E7%90%86",
      label: {
        en: "Intuitionistic logic (Wikipedia JA)",
        ja: "直観主義論理 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Heyting_arithmetic",
      label: {
        en: "Heyting arithmetic (Wikipedia)",
        ja: "ヘイティング算術 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/intuitionistic+logic",
      label: {
        en: "Intuitionistic logic (nLab)",
        ja: "直観主義論理 (nLab)",
      },
      documentLanguage: "en",
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/IntuitionisticLogic.html",
      label: {
        en: "Intuitionistic Logic (MathWorld)",
        ja: "直観主義論理 (MathWorld)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "intuitionistic",
    "constructive",
    "Brouwer",
    "Heyting",
    "BHK",
    "直観主義",
    "構成的",
    "Curry-Howard",
    "NJ",
    "LJ",
    "HA",
    "ブラウワー",
    "ヘイティング",
  ],
  order: 4,
};

const systemClassical: ReferenceEntry = {
  id: "system-classical",
  category: "logic-system",
  title: { en: "Classical Logic", ja: "古典論理" },
  summary: {
    en: "Full classical propositional/predicate logic with law of excluded middle.",
    ja: "排中律を含む完全な古典命題/述語論理。",
  },
  body: {
    en: [
      "<b>Classical logic</b> is the standard logic of mathematics, extending intuitionistic logic with principles that allow non-constructive reasoning. Any of the following equivalent additions to minimal logic (A1+A2+MP) yields classical propositional logic: <b>A3</b> (contraposition), <b>M3</b> (reductio), <b>DNE</b> (double negation elimination), the <b>law of excluded middle</b> (LEM: $\\varphi \\lor \\lnot \\varphi$), or <b>Peirce's law</b> ($((\\varphi \\to \\psi) \\to \\varphi) \\to \\varphi$).",
      "The key semantic property is <b>bivalence</b>: every proposition is either true or false, with no middle ground. This enables proof techniques like proof by contradiction and case analysis on $\\varphi \\lor \\lnot \\varphi$, which are not available in intuitionistic logic.",
      "In this application, classical logic can be realized in multiple equivalent ways: the <b>Łukasiewicz system</b> (A1+A2+A3), the <b>Mendelson system</b> (A1+A2+M3), or the <b>HK system</b> (A1+A2+DNE). All three prove exactly the same theorems.",
      "In natural deduction, classical logic corresponds to <b>NK</b> (NM + DNE). In sequent calculus, it corresponds to <b>LK</b> (unrestricted right side of sequents). The key difference from LJ (intuitionistic) is that LK allows multiple formulas on the right side, enabling classical reasoning.",
      "<b>Completeness theorems</b>: Classical propositional logic is decidable (truth tables). Classical first-order predicate logic is complete (Gödel's completeness theorem, 1930): every valid formula is provable. However, it is undecidable (Church-Turing theorem, 1936).",
      "<b>Hierarchy</b>: Minimal Logic (A1+A2) ⊂ Intuitionistic (A1+A2+EFQ) ⊂ Classical (A1+A2+A3/M3/DNE). Classical logic proves strictly more theorems than intuitionistic logic, which in turn proves strictly more than minimal logic.",
    ],
    ja: [
      "<b>古典論理</b>は数学の標準的な論理であり、直観主義論理を非構成的推論を可能にする原理で拡張します。最小論理(A1+A2+MP)への以下の同値な追加のいずれかにより古典命題論理が得られます: <b>A3</b>（対偶）、<b>M3</b>（背理法）、<b>DNE</b>（二重否定除去）、<b>排中律</b> (LEM: $\\varphi \\lor \\lnot \\varphi$)、<b>Peirceの法則</b> ($((\\varphi \\to \\psi) \\to \\varphi) \\to \\varphi$)。",
      "重要な意味論的性質は<b>二値性</b>です: すべての命題は真か偽のいずれかであり、中間はありません。これにより背理法や$\\varphi \\lor \\lnot \\varphi$に基づく場合分けなど、直観主義論理では使えない証明技法が可能になります。",
      "本アプリケーションでは、古典論理は複数の同値な方法で実現できます: <b>ウカシェヴィチ体系</b> (A1+A2+A3)、<b>メンデルソン体系</b> (A1+A2+M3)、<b>HK体系</b> (A1+A2+DNE)。3つとも完全に同じ定理を証明します。",
      "自然演繹では古典論理はシステム<b>NK</b> (NM + DNE)に対応します。シーケント計算では<b>LK</b>（シーケントの右辺に制約なし）に対応します。LJ（直観主義）との主要な違いは、LKが右辺に複数の論理式を許すことで、古典的推論を可能にする点です。",
      "<b>完全性定理</b>: 古典命題論理は決定可能です（真理値表）。古典一階述語論理は完全です（ゲーデルの完全性定理, 1930年）: 妥当なすべての論理式は証明可能です。ただし決定不能です（Church-Turingの定理, 1936年）。",
      "<b>階層</b>: 最小論理(A1+A2) ⊂ 直観主義(A1+A2+EFQ) ⊂ 古典(A1+A2+A3/M3/DNE)。古典論理は直観主義論理より真に多くの定理を証明し、直観主義論理は最小論理より真に多くの定理を証明します。",
    ],
  },
  relatedEntryIds: [
    "axiom-a3",
    "axiom-m3",
    "axiom-dne",
    "system-lukasiewicz",
    "system-mendelson",
    "system-intuitionistic",
    "system-minimal",
    "rule-nd-overview",
    "rule-sc-overview",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Classical_logic",
      label: {
        en: "Classical logic (Wikipedia)",
        ja: "古典論理 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E5%8F%A4%E5%85%B8%E8%AB%96%E7%90%86",
      label: {
        en: "Classical logic (Wikipedia JA)",
        ja: "古典論理 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/G%C3%B6del%27s_completeness_theorem",
      label: {
        en: "Gödel's completeness theorem (Wikipedia)",
        ja: "ゲーデルの完全性定理 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%B2%E3%83%BC%E3%83%87%E3%83%AB%E3%81%AE%E5%AE%8C%E5%85%A8%E6%80%A7%E5%AE%9A%E7%90%86",
      label: {
        en: "Gödel's completeness theorem (Wikipedia JA)",
        ja: "ゲーデルの完全性定理 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/classical+logic",
      label: {
        en: "Classical logic (nLab)",
        ja: "古典論理 (nLab)",
      },
      documentLanguage: "en",
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/PropositionalCalculus.html",
      label: {
        en: "Propositional Calculus (MathWorld)",
        ja: "命題計算 (MathWorld)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "classical",
    "excluded middle",
    "bivalence",
    "古典",
    "排中律",
    "二値性",
    "LEM",
    "DNE",
    "NK",
    "LK",
    "HK",
    "Gödel",
    "completeness",
  ],
  order: 5,
};

const systemPredicateLogic: ReferenceEntry = {
  id: "system-predicate",
  category: "logic-system",
  title: { en: "Predicate Logic", ja: "述語論理" },
  summary: {
    en: "First-order predicate logic extending propositional logic with quantifiers ($\\forall , \\exists$) and the Gen rule.",
    ja: "命題論理を量化子（$\\forall , \\exists$）と Gen 規則で拡張した一階述語論理。",
  },
  body: {
    en: [
      '<b>Predicate logic</b> (first-order logic) extends propositional logic with <b>universal quantification</b> ($\\forall x. \\varphi$: "for all x, $\\varphi$ holds") and <b>existential quantification</b> ($\\exists x. \\varphi$: "there exists an x such that $\\varphi$ holds"). This allows reasoning about objects, their properties (predicates), and functions.',
      "The predicate logic system adds two axiom schemas to the propositional base (A1+A2+A3): <b>A4</b> ($\\forall x. \\varphi \\to \\varphi$[t/x], universal instantiation) allows removing $\\forall$ by substituting a specific term, and <b>A5</b> ($\\forall x.(\\varphi \\to \\psi) \\to (\\varphi \\to \\forall x. \\psi)$, universal distribution) allows introducing $\\forall$ when x is not free in $\\varphi$.",
      "A new inference rule <b>Gen</b> (generalization) is also added: from a proved theorem $\\varphi$, derive $\\forall x. \\varphi$. Gen can only be applied to theorems (not to assumptions in a deduction), which is a crucial restriction.",
      'The existential quantifier $\\exists$ is defined as $\\lnot \\forall \\lnot$: $\\exists x. \\varphi \\equiv \\lnot \\forall x. \\lnot \\varphi$. This means "there exists an x satisfying $\\varphi$" is equivalent to "it is not the case that all x fail to satisfy $\\varphi$".',
      "Key properties: (1) $\\forall x. \\forall y. \\varphi \\leftrightarrow \\forall y. \\forall x. \\varphi$ (quantifier order is swappable for $\\forall$), (2) $\\exists x. \\lnot \\varphi \\to \\lnot \\forall x. \\varphi$, (3) $\\forall x. \\lnot \\varphi \\to \\lnot \\exists x. \\varphi$. These relationships between $\\forall$ and $\\exists$ are fundamental in predicate logic reasoning.",
    ],
    ja: [
      "<b>述語論理</b>（一階論理）は命題論理を<b>全称量化</b>（$\\forall x. \\varphi$: 「すべてのxについて$\\varphi$が成り立つ」）と<b>存在量化</b>（$\\exists x. \\varphi$: 「$\\varphi$を満たすxが存在する」）で拡張します。これにより対象、その性質（述語）、関数についての推論が可能になります。",
      "述語論理体系は命題論理の基盤(A1+A2+A3)に2つの公理スキーマを追加します: <b>A4</b>（$\\forall x. \\varphi \\to \\varphi$[t/x], 全称消去）は$\\forall$を外して具体的な項を代入でき、<b>A5</b>（$\\forall x.(\\varphi \\to \\psi) \\to (\\varphi \\to \\forall x. \\psi)$, 全称分配）はxが$\\varphi$に自由出現しないとき$\\forall$を導入できます。",
      "新しい推論規則<b>Gen</b>（汎化）も追加されます: 証明済みの定理$\\varphi$から$\\forall x. \\varphi$を導出します。Genは定理にのみ適用でき（演繹中の仮定には適用不可）、この制約は極めて重要です。",
      "存在量化子$\\exists$は$\\lnot \\forall \\lnot$として定義されます: $\\exists x. \\varphi \\equiv \\lnot \\forall x. \\lnot \\varphi$。「$\\varphi$を満たすxが存在する」は「すべてのxが$\\varphi$を満たさないわけではない」と同値です。",
      "重要な性質: (1) $\\forall x. \\forall y. \\varphi \\leftrightarrow \\forall y. \\forall x. \\varphi$（$\\forall$の順序は交換可能）、(2) $\\exists x. \\lnot \\varphi \\to \\lnot \\forall x. \\varphi$、(3) $\\forall x. \\lnot \\varphi \\to \\lnot \\exists x. \\varphi$。これらの$\\forall$と$\\exists$の関係は述語論理の推論の基本です。",
    ],
  },
  relatedEntryIds: [
    "axiom-a4",
    "axiom-a5",
    "rule-gen",
    "system-classical",
    "concept-free-variable",
    "concept-substitution",
  ],
  relatedQuestIds: ["pred-01", "pred-02", "pred-03"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/First-order_logic",
      label: {
        en: "First-order logic (Wikipedia)",
        ja: "一階論理 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E4%B8%80%E9%9A%8E%E8%BF%B0%E8%AA%9E%E8%AB%96%E7%90%86",
      label: {
        en: "First-order logic (Wikipedia JA)",
        ja: "一階述語論理 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/first-order+logic",
      label: {
        en: "First-order logic (nLab)",
        ja: "一階論理 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "predicate",
    "first-order",
    "quantifier",
    "forall",
    "exists",
    "述語",
    "一階",
    "量化",
    "全称",
    "存在",
  ],
  order: 6,
};

// ============================================================
// 概念 (Concepts)
// ============================================================

const conceptSubstitution: ReferenceEntry = {
  id: "concept-substitution",
  category: "concept",
  title: { en: "Substitution", ja: "代入" },
  summary: {
    en: "Replacing meta-variables or term variables with specific formulas or terms.",
    ja: "メタ変数や項変数を具体的な論理式や項に置き換える操作。",
  },
  body: {
    en: [
      "<b>Substitution</b> is the operation of replacing occurrences of a variable (or meta-variable) with a specific expression.",
      "There are two kinds: <i>meta-variable substitution</i> (replacing $\\varphi$ with a specific formula) and <i>term variable substitution</i> (replacing x with a specific term in $\\varphi$[t/x]).",
      "A key concern is <b>variable capture</b>: when substituting, free variables in the replacement expression must not become accidentally bound by quantifiers in the target formula.",
    ],
    ja: [
      "<b>代入</b>は、変数（またはメタ変数）の出現を特定の式に置き換える操作です。",
      "2種類あります: <i>メタ変数代入</i>（$\\varphi$を具体的な論理式に置き換え）と<i>項変数代入</i>（$\\varphi$[t/x]でxを具体的な項に置き換え）。",
      "重要な注意点は<b>変数捕獲</b>です: 代入時に、置き換え式の自由変数が対象論理式の量化子に誤って束縛されてはなりません。",
    ],
  },
  relatedEntryIds: ["concept-free-variable", "axiom-a4", "concept-unification"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Substitution_(logic)",
      label: {
        en: "Substitution in logic (Wikipedia)",
        ja: "論理における代入 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/substitution",
      label: {
        en: "Substitution (nLab)",
        ja: "代入 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "substitution",
    "variable capture",
    "代入",
    "変数捕獲",
    "meta-variable",
  ],
  order: 1,
};

const conceptFreeVariable: ReferenceEntry = {
  id: "concept-free-variable",
  category: "concept",
  title: { en: "Free and Bound Variables", ja: "自由変数と束縛変数" },
  summary: {
    en: "A variable is free if not under a quantifier; bound if quantified.",
    ja: "変数は量化子の下にない場合は自由、量化されている場合は束縛。",
  },
  body: {
    en: [
      "A variable x is <b>free</b> in a formula if it occurs outside the scope of any $\\forall$x or $\\exists$x quantifier.",
      "A variable x is <b>bound</b> in a formula if it occurs within the scope of a $\\forall$x or $\\exists$x quantifier.",
      "The distinction is critical for substitution (A4) and the side condition of A5: $\\forall x.(\\varphi \\to \\psi) \\to (\\varphi \\to \\forall x. \\psi)$ requires x not free in $\\varphi$.",
    ],
    ja: [
      "変数xが論理式中で<b>自由</b>であるとは、$\\forall$xや$\\exists$x量化子のスコープの外に出現することです。",
      "変数xが論理式中で<b>束縛</b>されているとは、$\\forall$xや$\\exists$x量化子のスコープ内に出現することです。",
      "この区別は代入(A4)とA5の条件にとって決定的です: $\\forall x.(\\varphi \\to \\psi) \\to (\\varphi \\to \\forall x. \\psi)$ はxが$\\varphi$に自由出現しないことを要求します。",
    ],
  },
  relatedEntryIds: ["concept-substitution", "axiom-a4", "axiom-a5"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Free_variables_and_bound_variables",
      label: {
        en: "Free and bound variables (Wikipedia)",
        ja: "自由変数と束縛変数 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E8%87%AA%E7%94%B1%E5%A4%89%E6%95%B0%E3%81%A8%E6%9D%9F%E7%B8%9B%E5%A4%89%E6%95%B0",
      label: {
        en: "Free and bound variables (Wikipedia JA)",
        ja: "自由変数と束縛変数 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/free+variable",
      label: {
        en: "Free variable (nLab)",
        ja: "自由変数 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "free variable",
    "bound variable",
    "自由変数",
    "束縛変数",
    "scope",
  ],
  order: 2,
};

const conceptUnification: ReferenceEntry = {
  id: "concept-unification",
  category: "concept",
  title: { en: "Unification", ja: "ユニフィケーション" },
  summary: {
    en: "Finding a substitution that makes two formulas identical.",
    ja: "2つの論理式を同一にする代入を見つける操作。",
  },
  body: {
    en: [
      "<b>Unification</b> is the process of finding a substitution that makes two formula schemas syntactically identical.",
      "This application uses the Martelli-Montanari algorithm for unification, which handles occurs checks to prevent infinite types.",
      "Unification is used internally when applying MP: the system needs to find substitutions that make the premises match.",
    ],
    ja: [
      "<b>ユニフィケーション</b>は、2つの論理式スキーマを構文的に同一にする代入を見つけるプロセスです。",
      "本アプリケーションではMartelli-Montanariアルゴリズムを使用し、無限型を防ぐためのoccursチェックを処理します。",
      "ユニフィケーションはMP適用時に内部的に使用されます: システムは前提をマッチさせる代入を見つける必要があります。",
    ],
  },
  relatedEntryIds: ["concept-substitution", "rule-mp"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Unification_(computer_science)",
      label: {
        en: "Unification (Wikipedia)",
        ja: "ユニフィケーション (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/unification",
      label: {
        en: "Unification (nLab)",
        ja: "ユニフィケーション (nLab)",
      },
      documentLanguage: "en",
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/Unification.html",
      label: {
        en: "Unification (MathWorld)",
        ja: "ユニフィケーション (MathWorld)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "unification",
    "Martelli-Montanari",
    "ユニフィケーション",
    "occurs check",
  ],
  order: 3,
};

const conceptDeductionTheorem: ReferenceEntry = {
  id: "concept-deduction-theorem",
  category: "concept",
  title: { en: "Deduction Theorem", ja: "演繹定理" },
  summary: {
    en: "Γ, $\\varphi \\vdash \\psi$ if and only if Γ $\\vdash \\varphi \\to \\psi$ — derivation from a hypothesis is equivalent to proving an implication.",
    ja: "Γ, $\\varphi \\vdash \\psi \\iff$ Γ $\\vdash \\varphi \\to \\psi$ — 仮説からの導出は含意の証明と同値である。",
  },
  body: {
    en: [
      "The <b>Deduction Theorem</b> is a fundamental meta-theorem in Hilbert-style proof systems. It states that if $\\psi$ can be derived from a set of hypotheses Γ together with an additional hypothesis $\\varphi$, then the implication $\\varphi \\to \\psi$ can be derived from Γ alone. Conversely, if Γ $\\vdash \\varphi \\to \\psi$, then Γ, $\\varphi \\vdash \\psi$ follows immediately by Modus Ponens.",
      "<b>Formal statement:</b> Γ, $\\varphi \\vdash \\psi$ if and only if Γ $\\vdash \\varphi \\to \\psi$. The left-to-right direction (⇒) is the non-trivial part. It is proved by induction on the length of the derivation of $\\psi$ from Γ ∪ {$\\varphi$}. The proof critically uses axioms A1 (K: $\\varphi \\to (\\psi \\to \\varphi)$) and A2 (S: ($\\varphi \\to (\\psi \\to \\chi)) \\to ((\\varphi \\to \\psi) \\to (\\varphi \\to \\chi)$)).",
      "<b>Proof — Base cases:</b> Suppose Γ, $\\varphi \\vdash \\psi$. Each line $\\psi$ in the derivation is either (i) an axiom, (ii) a member of Γ, or (iii) the hypothesis $\\varphi$ itself. In cases (i) and (ii), we have Γ $\\vdash \\psi$, so by A1 we get Γ $\\vdash \\psi \\to (\\varphi \\to \\psi)$, and by MP, Γ $\\vdash \\varphi \\to \\psi$. In case (iii), $\\psi$ is $\\varphi$, and we need Γ $\\vdash \\varphi \\to \\varphi$, which is the identity theorem provable from A1, A2, and MP.",
      "<b>Proof — Inductive step (MP case):</b> If $\\psi$ was obtained by Modus Ponens from earlier lines α and α $\\to \\psi$, then by the induction hypothesis we already have Γ $\\vdash \\varphi \\to$ α and Γ $\\vdash \\varphi \\to$ (α $\\to \\psi$). Applying A2 as S: ($\\varphi \\to$ (α $\\to \\psi)) \\to ((\\varphi \\to$ α) $\\to (\\varphi \\to \\psi)$), followed by two applications of MP, yields Γ $\\vdash \\varphi \\to \\psi$. This is the key step where the S combinator (A2) plays its essential role.",
      "<b>Proof — Converse direction:</b> The right-to-left direction (⟸) is straightforward. If Γ $\\vdash \\varphi \\to \\psi$, then in the extended context Γ ∪ {$\\varphi$}, we have both $\\varphi$ and $\\varphi \\to \\psi$ available. A single application of Modus Ponens gives Γ, $\\varphi \\vdash \\psi$.",
      "<b>The identity theorem:</b> The proof of $\\varphi \\to \\varphi$ (used in base case (iii)) is itself a classic exercise. It proceeds as: (1) A2 instance: ($\\varphi \\to ((\\varphi \\to \\varphi) \\to \\varphi)) \\to ((\\varphi \\to (\\varphi \\to \\varphi)) \\to (\\varphi \\to \\varphi)$); (2) A1 instance: $\\varphi \\to ((\\varphi \\to \\varphi) \\to \\varphi)$; (3) MP on (1) and (2): ($\\varphi \\to (\\varphi \\to \\varphi)) \\to (\\varphi \\to \\varphi$); (4) A1 instance: $\\varphi \\to (\\varphi \\to \\varphi)$; (5) MP on (3) and (4): $\\varphi \\to \\varphi$. This 5-step proof demonstrates the mechanical nature of the Deduction Theorem's constructive proof.",
      "<b>Significance:</b> In Hilbert-style systems, proofs are notoriously difficult to construct because the only inference rule is Modus Ponens. The Deduction Theorem provides a powerful proof strategy: to prove $\\varphi \\to \\psi$, one can instead assume $\\varphi$ and derive $\\psi$, which is often much easier. This bridges the gap between Hilbert systems and the more intuitive natural deduction style.",
      "<b>Constructive nature:</b> The proof of the Deduction Theorem is constructive — it provides an algorithm that transforms any derivation of Γ, $\\varphi \\vdash \\psi$ into a derivation of Γ $\\vdash \\varphi \\to \\psi$. Each step of the original derivation is replaced by a short sequence using A1, A2, and MP. The resulting proof is typically much longer (roughly 3× the original length), illustrating the trade-off between proof brevity with hypotheses and proof length without them.",
      "<b>Example:</b> To prove $\\varphi \\to \\varphi$ (identity) in a Hilbert system, one can use the Deduction Theorem: assume $\\varphi$, then $\\varphi$ is immediately derivable, so by the theorem, $\\vdash \\varphi \\to \\varphi$. The actual Hilbert-style proof (using S, K, and MP) is the 5-step construction shown above. For more complex theorems like ($\\varphi \\to \\psi) \\to ((\\psi \\to \\chi) \\to (\\varphi \\to \\chi)$) (hypothetical syllogism), the Deduction Theorem allows two nested applications: assume $\\varphi \\to \\psi$, assume $\\psi \\to \\chi$, assume $\\varphi$, derive $\\psi$ by MP, derive $\\chi$ by MP, then unwrap the three assumptions.",
      "<b>Limitations:</b> The Deduction Theorem does not hold in all logical systems. In particular, for predicate logic, the generalization rule (Gen) requires a side condition: the Deduction Theorem holds only when the hypothesis $\\varphi$ does not contain free occurrences of the variable being generalized. For example, if we have Γ, P(x) $\\vdash \\forall$x.P(x) (by Gen), we cannot conclude Γ $\\vdash$ P(x) $\\to \\forall$x.P(x), because this formula is not valid — the generalization over x captures the free x in P(x).",
    ],
    ja: [
      "<b>演繹定理</b>はヒルベルト流証明体系における基本的なメタ定理です。仮説の集合Γに追加の仮説$\\varphi$を合わせたものから$\\psi$が導出できるならば、Γだけから含意$\\varphi \\to \\psi$が導出できることを述べます。逆に、Γ $\\vdash \\varphi \\to \\psi$ であれば、モーダスポネンスにより直ちに Γ, $\\varphi \\vdash \\psi$ が従います。",
      "<b>形式的記述:</b> Γ, $\\varphi \\vdash \\psi \\iff$ Γ $\\vdash \\varphi \\to \\psi$。左から右の方向（⇒）が非自明な部分です。Γ ∪ {$\\varphi$} からの$\\psi$の導出の長さに関する帰納法で証明されます。証明では公理A1（K: $\\varphi \\to (\\psi \\to \\varphi)$）と公理A2（S: ($\\varphi \\to (\\psi \\to \\chi)) \\to ((\\varphi \\to \\psi) \\to (\\varphi \\to \\chi)$)）が本質的に使われます。",
      "<b>証明 — 基底ケース:</b> Γ, $\\varphi \\vdash \\psi$ を仮定する。導出の各行$\\psi$は (i) 公理、(ii) Γの元、(iii) 仮説$\\varphi$自身のいずれかである。(i)(ii) の場合、Γ $\\vdash \\psi$ が成り立つので、A1により Γ $\\vdash \\psi \\to (\\varphi \\to \\psi)$ を得て、MPにより Γ $\\vdash \\varphi \\to \\psi$ を得る。(iii) の場合、$\\psi$は$\\varphi$であり、Γ $\\vdash \\varphi \\to \\varphi$ が必要となるが、これはA1, A2, MPから証明可能な恒等定理である。",
      "<b>証明 — 帰納ステップ（MPケース）:</b> $\\psi$が先行する行αとα $\\to \\psi$からモーダスポネンスで得られた場合、帰納法の仮定により Γ $\\vdash \\varphi \\to$ α と Γ $\\vdash \\varphi \\to$ (α $\\to \\psi$) が既に得られている。A2をS: ($\\varphi \\to$ (α $\\to \\psi)) \\to ((\\varphi \\to$ α) $\\to (\\varphi \\to \\psi)$) として適用し、MPを2回適用すると Γ $\\vdash \\varphi \\to \\psi$ が得られる。これがSコンビネータ（A2）が本質的役割を果たす鍵となるステップである。",
      "<b>証明 — 逆方向:</b> 右から左の方向（⟸）は直接的である。Γ $\\vdash \\varphi \\to \\psi$ ならば、拡張された文脈 Γ ∪ {$\\varphi$} において、$\\varphi$と$\\varphi \\to \\psi$の両方が利用可能である。モーダスポネンスを1回適用すれば Γ, $\\varphi \\vdash \\psi$ が得られる。",
      "<b>恒等定理:</b> $\\varphi \\to \\varphi$の証明（基底ケース(iii)で使用）は、それ自体が古典的な練習問題である。手順: (1) A2のインスタンス: ($\\varphi \\to ((\\varphi \\to \\varphi) \\to \\varphi)) \\to ((\\varphi \\to (\\varphi \\to \\varphi)) \\to (\\varphi \\to \\varphi)$); (2) A1のインスタンス: $\\varphi \\to ((\\varphi \\to \\varphi) \\to \\varphi)$; (3) (1)と(2)にMP: ($\\varphi \\to (\\varphi \\to \\varphi)) \\to (\\varphi \\to \\varphi$); (4) A1のインスタンス: $\\varphi \\to (\\varphi \\to \\varphi)$; (5) (3)と(4)にMP: $\\varphi \\to \\varphi$。この5ステップの証明は、演繹定理の構成的証明の機械的な性質を示している。",
      "<b>意義:</b> ヒルベルト流体系では、唯一の推論規則がモーダスポネンスであるため、証明の構成は非常に困難です。演繹定理は強力な証明戦略を提供します: $\\varphi \\to \\psi$ を証明するには、$\\varphi$を仮定して$\\psi$を導出すればよく、これは多くの場合はるかに容易です。これにより、ヒルベルト体系とより直観的な自然演繹スタイルの間の橋渡しが実現されます。",
      "<b>構成的性質:</b> 演繹定理の証明は構成的です — Γ, $\\varphi \\vdash \\psi$ の導出を Γ $\\vdash \\varphi \\to \\psi$ の導出に変換するアルゴリズムを提供します。元の導出の各ステップは、A1, A2, MPを用いた短い列に置き換えられます。結果として得られる証明は通常、元の長さの約3倍になり、仮説ありでの証明の簡潔さと仮説なしでの証明の長さのトレードオフを示しています。",
      "<b>例:</b> ヒルベルト体系で$\\varphi \\to \\varphi$（恒等式）を証明するには、演繹定理を使えます: $\\varphi$を仮定すると、$\\varphi$は直ちに導出可能なので、定理により $\\vdash \\varphi \\to \\varphi$ が得られます。実際のヒルベルト流の証明（S, K, MPを使用）は上述の5ステップの構成です。($\\varphi \\to \\psi) \\to ((\\psi \\to \\chi) \\to (\\varphi \\to \\chi)$)（仮説的三段論法）のような、より複雑な定理では、演繹定理を入れ子に2回適用できます: $\\varphi \\to \\psi$ を仮定し、$\\psi \\to \\chi$ を仮定し、$\\varphi$を仮定し、MPで$\\psi$を導出し、MPで$\\chi$を導出し、3つの仮定を巻き戻します。",
      "<b>制限:</b> 演繹定理はすべての論理体系で成り立つわけではありません。特に述語論理では、汎化規則（Gen）に条件が必要です: 演繹定理は、仮説$\\varphi$が汎化される変数の自由出現を含まない場合にのみ成り立ちます。例えば、Γ, P(x) $\\vdash \\forall$x.P(x)（Genによる）が成り立っても、Γ $\\vdash$ P(x) $\\to \\forall$x.P(x) を結論することはできません。この論理式は妥当ではなく、xに対する汎化がP(x)の自由変数xを捕獲してしまうためです。",
    ],
  },
  formalNotation:
    "\\Gamma, \\varphi \\vdash \\psi \\iff \\Gamma \\vdash \\varphi \\to \\psi",
  relatedEntryIds: [
    "axiom-a1",
    "axiom-a2",
    "rule-mp",
    "system-lukasiewicz",
    "system-mendelson",
    "rule-gen",
    "concept-soundness",
    "concept-completeness",
  ],
  relatedQuestIds: [
    "prop-01",
    "prop-02",
    "prop-03",
    "prop-04",
    "prop-05",
    "prop-06",
    "prop-07",
    "prop-08",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Deduction_theorem",
      label: {
        en: "Deduction theorem (Wikipedia)",
        ja: "演繹定理 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E6%BC%94%E7%B9%B9%E5%AE%9A%E7%90%86",
      label: {
        en: "Deduction theorem (Wikipedia JA)",
        ja: "演繹定理 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/deduction+theorem",
      label: {
        en: "Deduction theorem (nLab)",
        ja: "演繹定理 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "deduction theorem",
    "演繹定理",
    "hypothesis",
    "仮説",
    "meta-theorem",
    "メタ定理",
    "Herbrand",
    "induction",
    "帰納法",
    "identity theorem",
    "恒等定理",
    "S combinator",
    "K combinator",
  ],
  order: 4,
};

const conceptGlivenko: ReferenceEntry = {
  id: "concept-glivenko",
  category: "concept",
  title: { en: "Glivenko's Theorem", ja: "グリヴェンコの定理" },
  summary: {
    en: "Γ $\\vdash$_LK $\\varphi$ if and only if Γ $\\vdash$_LJ $\\lnot \\lnot \\varphi$ — a formula provable in classical logic is provable under double negation in intuitionistic logic.",
    ja: "Γ $\\vdash$_LK $\\varphi \\iff$ Γ $\\vdash$_LJ $\\lnot \\lnot \\varphi$ — 古典論理で証明可能な命題は、直観主義論理で二重否定を付ければ証明可能。",
  },
  body: {
    en: [
      "<b>Glivenko's Theorem</b> (1929) establishes a precise relationship between classical and intuitionistic propositional logic. It states that a propositional formula $\\varphi$ is provable in classical logic (LK) if and only if its double negation $\\lnot \\lnot \\varphi$ is provable in intuitionistic logic (LJ). This holds even when hypotheses Γ are present: Γ $\\vdash$_LK $\\varphi \\iff$ Γ $\\vdash$_LJ $\\lnot \\lnot \\varphi$.",
      '<b>Proof outline:</b> The right-to-left direction (⟸) follows from the fact that intuitionistic logic is a subsystem of classical logic, and DNE ($\\lnot \\lnot \\varphi \\to \\varphi$) holds classically. For the left-to-right direction (⟹), one shows that for every classical axiom and inference rule, the double-negation translation preserves derivability in intuitionistic logic. The key insight is that $\\lnot \\lnot$ acts as a "modality" that absorbs classical reasoning.',
      '<b>Significance:</b> Glivenko\'s theorem shows that classical and intuitionistic logic are "not so far apart" for propositional logic — every classical theorem has an intuitionistic counterpart under double negation. This is a foundational result in the study of the relationship between constructive and classical mathematics.',
      "<b>Limitation to propositional logic:</b> Glivenko's theorem in its original form applies only to propositional logic. For predicate logic, a more refined translation is needed. Kuroda's negative translation (inserting $\\lnot \\lnot$ after each $\\forall$) provides the predicate-logic generalization.",
      '<b>Connection to other results:</b> Glivenko\'s theorem is closely related to the Kuroda translation and the Gödel-Gentzen negative translation. These translations systematically embed classical logic into intuitionistic logic, demonstrating that classical reasoning can always be "interpreted" constructively via double negation.',
    ],
    ja: [
      "<b>グリヴェンコの定理</b> (1929) は、古典命題論理と直観主義命題論理の間の正確な関係を確立するものです。命題論理式 $\\varphi$ が古典論理 (LK) で証明可能であることと、その二重否定 $\\lnot \\lnot \\varphi$ が直観主義論理 (LJ) で証明可能であることは同値です。仮説 Γ がある場合にも成立します: Γ $\\vdash$_LK $\\varphi \\iff$ Γ $\\vdash$_LJ $\\lnot \\lnot \\varphi$。",
      "<b>証明の概略:</b> 右から左の方向 (⟸) は、直観主義論理が古典論理の部分体系であり、古典論理では DNE ($\\lnot \\lnot \\varphi \\to \\varphi$) が成り立つことから従います。左から右の方向 (⟹) では、古典論理の各公理と推論規則について、二重否定翻訳が直観主義論理での導出可能性を保存することを示します。鍵となる洞察は、$\\lnot \\lnot$ が古典的推論を吸収する「モダリティ」として機能することです。",
      "<b>意義:</b> グリヴェンコの定理は、命題論理に関しては古典論理と直観主義論理が「それほど離れていない」ことを示します — すべての古典的定理は、二重否定の下で直観主義的な対応物を持ちます。これは、構成的数学と古典的数学の関係の研究における基礎的な結果です。",
      "<b>命題論理への限定:</b> グリヴェンコの定理は、元の形では命題論理にのみ適用されます。述語論理に対しては、より精緻な翻訳が必要です。黒田の否定翻訳（各 $\\forall$ の直後に $\\lnot \\lnot$ を挿入する）が、述語論理への一般化を提供します。",
      "<b>他の結果との関連:</b> グリヴェンコの定理は、黒田翻訳やゲーデル・ゲンツェンの否定翻訳と密接に関連しています。これらの翻訳は、古典論理を直観主義論理に体系的に埋め込むものであり、古典的推論が二重否定を通じて常に構成的に「解釈」できることを示しています。",
    ],
  },
  formalNotation:
    "\\Gamma \\vdash_{\\mathbf{LK}} \\varphi \\iff \\Gamma \\vdash_{\\mathbf{LJ}} \\lnot\\lnot\\varphi",
  relatedEntryIds: [
    "axiom-dne",
    "system-classical",
    "system-intuitionistic",
    "concept-deduction-theorem",
    "concept-kuroda-translation",
    "concept-axiom-independence",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Glivenko%27s_theorem",
      label: {
        en: "Glivenko's theorem (Wikipedia)",
        ja: "グリヴェンコの定理 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%B0%E3%83%AA%E3%83%B4%E3%82%A7%E3%83%B3%E3%82%B3%E3%81%AE%E5%AE%9A%E7%90%86",
      label: {
        en: "Glivenko's theorem (Wikipedia JA)",
        ja: "グリヴェンコの定理 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/Glivenko%27s+theorem",
      label: {
        en: "Glivenko's theorem (nLab)",
        ja: "グリヴェンコの定理 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "Glivenko",
    "グリヴェンコ",
    "double negation",
    "二重否定",
    "classical",
    "古典論理",
    "intuitionistic",
    "直観主義論理",
    "negative translation",
    "否定翻訳",
  ],
  order: 5,
};

const conceptKurodaTranslation: ReferenceEntry = {
  id: "concept-kuroda-translation",
  category: "concept",
  title: {
    en: "Kuroda's Negative Translation",
    ja: "黒田の否定翻訳",
  },
  summary: {
    en: "A translation inserting $\\lnot \\lnot$ after each $\\forall$ to embed classical predicate logic into intuitionistic logic: $\\vdash$_LK $\\varphi \\iff \\vdash$_LJ $\\lnot \\lnot \\varphi$*.",
    ja: "各 $\\forall$ の直後に $\\lnot \\lnot$ を挿入し、古典述語論理を直観主義論理に埋め込む翻訳: $\\vdash$_LK $\\varphi \\iff \\vdash$_LJ $\\lnot \\lnot \\varphi$*。",
  },
  body: {
    en: [
      "<b>Kuroda's negative translation</b> (1951) extends Glivenko's theorem from propositional logic to first-order predicate logic. While Glivenko showed that $\\vdash$_LK $\\varphi \\iff \\vdash$_LJ $\\lnot \\lnot \\varphi$ for propositional formulas, simply prefixing $\\lnot \\lnot$ does not work for predicate logic. Kuroda's key insight is that inserting $\\lnot \\lnot$ immediately after each universal quantifier ($\\forall$) is sufficient to bridge the gap.",
      "<b>Definition:</b> The Kuroda transform $\\varphi$<i> of a formula $\\varphi$ is defined recursively: (1) Atomic formulas are unchanged: P(t₁,...,tₙ)</i> = P(t₁,...,tₙ). (2) Propositional connectives distribute to subformulas: ($\\lnot \\varphi$)<i> = $\\lnot (\\varphi$</i>), ($\\varphi \\to \\psi$)<i> = $\\varphi$</i> $\\to \\psi$<i>, ($\\varphi \\land \\psi$)</i> = $\\varphi$<i> $\\land \\psi$</i>, ($\\varphi \\lor \\psi$)<i> = $\\varphi$</i> $\\lor \\psi$<i>. (3) The universal quantifier gets a $\\lnot \\lnot$ insertion: ($\\forall x. \\varphi$)</i> = $\\forall x. \\lnot \\lnot (\\varphi$<i>). (4) The existential quantifier just recurses: ($\\exists x. \\varphi$)</i> = $\\exists x.(\\varphi$*).",
      "<b>Main theorem:</b> For any first-order formula $\\varphi , \\vdash$_LK $\\varphi$ if and only if $\\vdash$_LJ $\\lnot \\lnot \\varphi$*. This extends Glivenko's result to the full first-order predicate logic, using the Kuroda transform to handle the universal quantifier.",
      "<b>Why simple $\\lnot \\lnot$ prefix fails for predicate logic:</b> The formula $\\forall$x(F(x) $\\lor \\lnot$F(x)) is provable in classical logic (LK), but $\\lnot \\lnot \\forall$x(F(x) $\\lor \\lnot$F(x)) is not provable in intuitionistic logic (LJ). The universal quantifier interacts non-trivially with excluded middle, and Kuroda's insertion of $\\lnot \\lnot$ after each $\\forall$ precisely neutralizes this interaction.",
      "<b>Comparison with other negative translations:</b> Kolmogorov's translation (1925) prefixes every subformula with $\\lnot \\lnot$. The Gödel-Gentzen translation (1933) places $\\lnot \\lnot$ before atomic formulas, disjunctions, and existential quantifiers. Kuroda's translation is the simplest — it only modifies universal quantifiers. All three translations produce intuitionistically equivalent results.",
      "<b>Significance:</b> Kuroda's translation reveals that the gap between classical and intuitionistic predicate logic resides specifically in the universal quantifier. Classical reasoning about \"for all x\" implicitly uses excluded middle at each instance, and Kuroda's $\\lnot \\lnot$ after $\\forall$ neutralizes precisely this. The result is foundational for proof theory, establishing that classical systems (LK, NK, HK) are equivalent to their minimal logic counterparts plus the DNE rule.",
    ],
    ja: [
      "<b>黒田の否定翻訳</b> (1951) は、グリヴェンコの定理を命題論理から一階述語論理に拡張するものです。グリヴェンコは命題論理式について $\\vdash$_LK $\\varphi \\iff \\vdash$_LJ $\\lnot \\lnot \\varphi$ を示しましたが、述語論理では単に $\\lnot \\lnot$ を前置するだけでは不十分です。黒田の鍵となる洞察は、各全称量化子 ($\\forall$) の直後に $\\lnot \\lnot$ を挿入するだけで十分であるということです。",
      "<b>定義:</b> 論理式 $\\varphi$ の黒田変換 $\\varphi$<i> は再帰的に定義されます: (1) 原子論理式は変更なし: P(t₁,...,tₙ)</i> = P(t₁,...,tₙ)。(2) 命題結合子は部分論理式に分配: ($\\lnot \\varphi$)<i> = $\\lnot (\\varphi$</i>)、($\\varphi \\to \\psi$)<i> = $\\varphi$</i> $\\to \\psi$<i>、($\\varphi \\land \\psi$)</i> = $\\varphi$<i> $\\land \\psi$</i>、($\\varphi \\lor \\psi$)<i> = $\\varphi$</i> $\\lor \\psi$<i>。(3) 全称量化子に $\\lnot \\lnot$ を挿入: ($\\forall x. \\varphi$)</i> = $\\forall x. \\lnot \\lnot (\\varphi$<i>)。(4) 存在量化子は再帰のみ: ($\\exists x. \\varphi$)</i> = $\\exists x.(\\varphi$*)。",
      "<b>主定理:</b> 任意の一階論理式 $\\varphi$ について、$\\vdash$_LK $\\varphi$ であることと $\\vdash$_LJ $\\lnot \\lnot \\varphi$* であることは同値です。これは黒田変換を用いて全称量化子を処理することで、グリヴェンコの結果を一階述語論理全体に拡張するものです。",
      "<b>述語論理で単純な $\\lnot \\lnot$ 前置が失敗する理由:</b> 論理式 $\\forall$x(F(x) $\\lor \\lnot$F(x)) は古典論理 (LK) で証明可能ですが、$\\lnot \\lnot \\forall$x(F(x) $\\lor \\lnot$F(x)) は直観主義論理 (LJ) では証明できません。全称量化子は排中律と非自明に相互作用し、黒田の各 $\\forall$ の直後への $\\lnot \\lnot$ 挿入がまさにこの相互作用を中和します。",
      "<b>他の否定翻訳との比較:</b> コルモゴロフの翻訳 (1925) はすべての部分論理式に $\\lnot \\lnot$ を前置します。ゲーデル・ゲンツェンの翻訳 (1933) は原子論理式、選言、存在量化子の前に $\\lnot \\lnot$ を配置します。黒田の翻訳は最も単純で、全称量化子のみを修正します。3つの翻訳はすべて直観主義的に同値な結果を生成します。",
      "<b>意義:</b> 黒田の翻訳は、古典述語論理と直観主義述語論理の間の差異が特に全称量化子に存在することを明らかにします。「すべての x について」という古典的推論は各インスタンスで暗黙に排中律を使用しており、黒田の $\\forall$ の直後の $\\lnot \\lnot$ がまさにこれを中和します。この結果は証明論の基礎であり、古典的体系 (LK, NK, HK) がそれぞれの最小論理の対応物に DNE 規則を加えたものと等価であることを確立します。",
    ],
  },
  formalNotation:
    "(\\forall x.\\varphi)^<i> = \\forall x.\\lnot\\lnot(\\varphi^</i>)",
  relatedEntryIds: [
    "concept-glivenko",
    "axiom-dne",
    "system-classical",
    "system-intuitionistic",
    "axiom-a4",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Double-negation_translation",
      label: {
        en: "Double-negation translation (Wikipedia)",
        ja: "二重否定翻訳 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E4%BA%8C%E9%87%8D%E5%90%A6%E5%AE%9A%E7%BF%BB%E8%A8%B3",
      label: {
        en: "Double-negation translation (Wikipedia JA)",
        ja: "二重否定翻訳 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/double+negation+translation",
      label: {
        en: "Double negation translation (nLab)",
        ja: "二重否定翻訳 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "Kuroda",
    "黒田",
    "negative translation",
    "否定翻訳",
    "double negation",
    "二重否定",
    "classical",
    "古典論理",
    "intuitionistic",
    "直観主義論理",
    "universal quantifier",
    "全称量化子",
    "Glivenko",
    "グリヴェンコ",
    "predicate logic",
    "述語論理",
  ],
  order: 6,
};

const conceptSystemEquivalence: ReferenceEntry = {
  id: "concept-system-equivalence",
  category: "concept",
  title: {
    en: "Equivalence of Proof Systems (H = N = L)",
    ja: "証明体系の等価性 (H = N = L)",
  },
  summary: {
    en: "Hilbert systems, natural deduction, and sequent calculus prove the same formulas: HM=NM=LM, HJ=NJ=LJ, HK=NK=LK.",
    ja: "ヒルベルト系、自然演繹、シーケント計算は同じ論理式を証明する: HM=NM=LM, HJ=NJ=LJ, HK=NK=LK。",
  },
  body: {
    en: [
      "<b>Three styles, one logic.</b> For each level of logical strength — minimal (M), intuitionistic (J), and classical (K) — there exist three distinct proof systems: the Hilbert-style system (H), natural deduction (N), and sequent calculus (L). Despite their vastly different structure, each triple proves exactly the same set of formulas. Formally, for any formula $\\varphi$: $\\vdash$_HX $\\varphi \\iff \\vdash$_NX $\\varphi \\iff \\vdash$_LX $\\varphi$, where X ∈ {M, J, K}.",
      '<b>What "equivalence" means precisely.</b> Two proof systems are equivalent if they have the same set of theorems — that is, a formula $\\varphi$ is provable in one system if and only if it is provable in the other. This does not mean the proofs look the same: a Hilbert-style proof is a linear sequence of formulas, a natural deduction proof is a tree of hypothetical derivations with discharge, and a sequent calculus proof operates on sequents Γ ⇒ Δ. The equivalence is purely about provability, not about proof structure.',
      "<b>H ⊆ N (Hilbert to Natural Deduction).</b> Every Hilbert-style axiom can be derived in natural deduction without hypotheses. For instance, A1 ($\\varphi \\to (\\psi \\to \\varphi)$) is derivable by: assume $\\varphi$, then assume $\\psi$, weaken to get $\\varphi$, apply $\\to$I twice. Similarly, A2 is derivable using $\\to$I and $\\to$E. Modus Ponens corresponds directly to $\\to$E. Thus every Hilbert proof can be simulated step-by-step in natural deduction.",
      "<b>N ⊆ L (Natural Deduction to Sequent Calculus).</b> The key insight is that each natural deduction rule has a sequent calculus counterpart. The discharge mechanism of natural deduction corresponds to having formulas on the left side of the sequent (antecedent). The $\\to$I rule corresponds to ($\\to$⇒), and $\\to$E corresponds to combining (⇒$\\to$) with Cut. The translation preserves provability (bekki Ch.10, Theorem 10.41).",
      "<b>L ⊆ H (Sequent Calculus to Hilbert).</b> Each sequent rule can be simulated using Hilbert axioms and MP. The structural rules (exchange, contraction, weakening) correspond to propositional tautologies derivable in the Hilbert system. Logical rules translate to combinations of axiom instances and MP applications. The translation is typically by induction on the derivation height (bekki Ch.9, Theorem 9.24).",
      "<b>The three levels.</b> (1) <b>Minimal logic (M):</b> HM uses axioms A1, A2, A3 + MP. NM has $\\to$I/E, $\\land$I/E, $\\lor$I/E, and weakening. LM is LJ without ($\\bot$⇒). All three prove exactly the same formulas. (2) <b>Intuitionistic logic (J):</b> HJ adds the absurdity axiom ($\\bot \\to \\varphi$). NJ adds EFQ (ex falso quodlibet). LJ adds ($\\bot$⇒). (3) <b>Classical logic (K):</b> HK adds DNE ($\\lnot \\lnot \\varphi \\to \\varphi$) or Peirce's law. NK adds the DNE rule. LK allows multiple formulas on the right side of sequents.",
      '<b>Significance.</b> The equivalence theorems have deep consequences: (1) Any metatheorem proved about one system immediately transfers to the others. For example, cut elimination in LK implies the subformula property for HK and NK proofs. (2) Each system has distinct practical advantages — Hilbert systems are minimal and elegant, natural deduction mirrors informal mathematical reasoning, and sequent calculus is ideal for proof search and metatheory. (3) The equivalence shows that the notion of "provability" is robust and independent of the particular formalization chosen.',
    ],
    ja: [
      "<b>3つの流儀、1つの論理。</b> 論理的強さの各レベル — 最小論理 (M)、直観主義論理 (J)、古典論理 (K) — に対して、3つの異なる証明体系が存在します: ヒルベルト系 (H)、自然演繹 (N)、シーケント計算 (L)。その構造は大きく異なりますが、各三つ組はまったく同じ論理式の集合を証明します。形式的に、任意の論理式 $\\varphi$ について: $\\vdash$_HX $\\varphi \\iff \\vdash$_NX $\\varphi \\iff \\vdash$_LX $\\varphi$、ただし X ∈ {M, J, K}。",
      "<b>「等価性」の正確な意味。</b> 2つの証明体系が等価であるとは、同じ定理の集合を持つことです — すなわち、論理式 $\\varphi$ が一方の体系で証明可能であることと他方の体系で証明可能であることが同値です。これは証明が同じ見た目であることを意味しません: ヒルベルト系の証明は論理式の線形列、自然演繹の証明は仮定の打ち消しを伴う仮説的導出の木、シーケント計算の証明はシーケント Γ ⇒ Δ 上で操作します。等価性は純粋に証明可能性に関するものであり、証明の構造に関するものではありません。",
      "<b>H ⊆ N（ヒルベルト系から自然演繹へ）。</b> ヒルベルト系のすべての公理は、自然演繹で仮定なしに導出できます。例えば A1 ($\\varphi \\to (\\psi \\to \\varphi)$) は: $\\varphi$ を仮定し、$\\psi$ を仮定し、弱化で $\\varphi$ を得て、$\\to$I を2回適用することで導出できます。同様に A2 も $\\to$I と $\\to$E で導出可能です。モーダスポネンスは直接 $\\to$E に対応します。したがって、すべてのヒルベルト証明は自然演繹でステップごとにシミュレートできます。",
      "<b>N ⊆ L（自然演繹からシーケント計算へ）。</b> 鍵となる洞察は、各自然演繹規則にシーケント計算の対応物があることです。自然演繹の打ち消し機構は、シーケントの左辺（前件）に論理式を持つことに対応します。$\\to$I 規則は ($\\to$⇒) に対応し、$\\to$E は (⇒$\\to$) とカットの組み合わせに対応します。この翻訳は証明可能性を保存します（戸次 Ch.10, 定理10.41）。",
      "<b>L ⊆ H（シーケント計算からヒルベルト系へ）。</b> 各シーケント規則はヒルベルト公理と MP を用いてシミュレートできます。構造規則（交換、縮約、弱化）はヒルベルト系で導出可能な命題論理のトートロジーに対応します。論理規則は公理インスタンスと MP 適用の組み合わせに翻訳されます。翻訳は通常、導出の高さに関する帰納法で行います（戸次 Ch.9, 定理9.24）。",
      "<b>3つのレベル。</b> (1) <b>最小論理 (M):</b> HM は公理 A1, A2, A3 + MP を使用。NM は $\\to$I/E, $\\land$I/E, $\\lor$I/E と弱化を持ちます。LM は LJ から ($\\bot$⇒) を除いた体系です。3つすべてがまったく同じ論理式を証明します。(2) <b>直観主義論理 (J):</b> HJ は矛盾公理 ($\\bot \\to \\varphi$) を追加。NJ は EFQ（矛盾からの爆発）を追加。LJ は ($\\bot$⇒) を追加。(3) <b>古典論理 (K):</b> HK は DNE ($\\lnot \\lnot \\varphi \\to \\varphi$) またはパースの法則を追加。NK は DNE 規則を追加。LK はシーケント右辺に複数の論理式を許可します。",
      "<b>意義。</b> 等価性定理は深い帰結を持ちます: (1) 1つの体系について証明されたメタ定理は直ちに他の体系に転用できます。例えば、LK のカット除去は HK と NK の証明に対する部分論理式性を含意します。(2) 各体系には異なる実用上の利点があります — ヒルベルト系は最小限でエレガント、自然演繹は非形式的な数学的推論を反映、シーケント計算は証明探索とメタ理論に最適です。(3) 等価性は「証明可能性」の概念が頑健であり、選択した特定の形式化に依存しないことを示しています。",
    ],
  },
  formalNotation:
    "\\vdash_{HX} \\varphi \\;\\Longleftrightarrow\\; \\vdash_{NX} \\varphi \\;\\Longleftrightarrow\\; \\vdash_{LX} \\varphi \\quad (X \\in \\{M, J, K\\})",
  relatedEntryIds: [
    "system-minimal",
    "system-intuitionistic",
    "system-classical",
    "concept-glivenko",
    "concept-kuroda-translation",
    "rule-nd-overview",
    "rule-sc-overview",
    "concept-tab-lk-equivalence",
    "concept-consistency-from-cut-elimination",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Curry%E2%80%93Howard_correspondence",
      label: {
        en: "Curry–Howard correspondence (Wikipedia)",
        ja: "カリー＝ハワード対応 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%AB%E3%83%AA%E3%83%BC%EF%BC%9D%E3%83%8F%E3%83%AF%E3%83%BC%E3%83%89%E5%90%8C%E5%9E%8B",
      label: {
        en: "Curry–Howard isomorphism (Wikipedia JA)",
        ja: "カリー＝ハワード同型 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/natural+deduction",
      label: {
        en: "Natural deduction (nLab)",
        ja: "自然演繹 (nLab)",
      },
      documentLanguage: "en",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/sequent+calculus",
      label: {
        en: "Sequent calculus (nLab)",
        ja: "シーケント計算 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "equivalence",
    "等価性",
    "Hilbert",
    "ヒルベルト",
    "natural deduction",
    "自然演繹",
    "sequent calculus",
    "シーケント計算",
    "HM",
    "NM",
    "LM",
    "HJ",
    "NJ",
    "LJ",
    "HK",
    "NK",
    "LK",
    "minimal",
    "最小論理",
    "intuitionistic",
    "直観主義論理",
    "classical",
    "古典論理",
    "proof system",
    "証明体系",
  ],
  order: 7,
};

const conceptSoundness: ReferenceEntry = {
  id: "concept-soundness",
  category: "concept",
  title: {
    en: "Soundness Theorem",
    ja: "健全性定理",
  },
  summary: {
    en: "If a formula is provable in a proof system, then it is semantically valid: $\\vdash$_K Δ implies $\\models$ Δ.",
    ja: "証明体系で証明可能な論理式は意味論的に妥当である: $\\vdash$_K Δ ならば $\\models$ Δ。",
  },
  body: {
    en: [
      `<b>What soundness means.</b> The soundness theorem states that if a formula (or sequent) is provable in a proof system K, then it is semantically valid — that is, true under every interpretation. Formally: if Γ $\\vdash$_K Δ, then Γ $\\models$ Δ. In other words, the proof system never "lies": it cannot prove something that is false. This is a fundamental requirement for any proof system to be trustworthy.`,
      `<b>Semantic validity ($\\models$).</b> To say Γ $\\models$ Δ means that for every interpretation (M, g), if (M, g) satisfies all formulas in Γ, then (M, g) satisfies at least one formula in Δ. Equivalently, the set $\\lnot$Δ, Γ is unsatisfiable — there is no interpretation making all of Γ true while making all of Δ false. For propositional logic, an interpretation is a truth-value assignment; for predicate logic, it is a structure with a domain and interpretation function (bekki Ch.5, Definition 5.66).`,
      `<b>Proof strategy: preserving satisfiability.</b> The standard proof of soundness proceeds by induction on the derivation. For tableau-style sequent calculus (TAB), the key lemma (bekki Lemma 13.7) shows that each inference rule preserves satisfiability upward: if the conclusion sequent Γ ⇒ has a satisfying interpretation, then at least one premise also has a satisfying interpretation. Since axioms (basic sequents) $\\lnot \\varphi , \\varphi$, Γ ⇒ are clearly unsatisfiable, any completed derivation starting from provable sequents reaches only unsatisfiable leaves, guaranteeing the root is valid.`,
      `<b>Soundness for specific systems.</b> (1) <b>TAB</b> (Theorem 13.10): Γ $\\vdash$_TAB Δ ⟹ Γ $\\models$ Δ. Proved by contraposition — if Γ ⊭ Δ, then $\\lnot$Δ, Γ is satisfiable, and the satisfiability lemma shows Γ ⊬_TAB Δ. (2) <b>LK</b> (Theorem 13.24): Γ $\\vdash$_LK Δ ⟹ Γ $\\models$ Δ. Proved similarly via a soundness lemma for LK rules (Lemma 13.25). By the equivalence of proof systems (HK = NK = LK = TAB), soundness extends to all classical proof systems.`,
      `<b>Consequences of soundness.</b> Soundness has important corollaries: (1) <b>Consistency:</b> If a system is sound, it cannot prove a contradiction ($\\bot$), since $\\bot$ has no satisfying interpretation. (2) <b>Semantic cut elimination:</b> From LK soundness, for any LK derivation of S, there exists an LK-CUT derivation of S. This gives a completely different proof of cut elimination via semantics rather than syntactic transformation (bekki Section 13.6). (3) <b>Trustworthiness:</b> Soundness justifies using the proof system as a reliable tool for establishing truths about mathematical structures.`,
      `<b>Soundness vs. completeness.</b> Soundness ($\\vdash$ ⟹ $\\models$) and completeness ($\\models$ ⟹ $\\vdash$) are dual properties. Together they establish that provability and semantic validity coincide: $\\vdash \\iff \\models$. While soundness is generally straightforward to prove (induction on derivations), completeness is significantly harder and historically deeper — Gödel's completeness theorem (1930) established it for first-order logic. Soundness says the system is safe; completeness says the system is sufficient.`,
    ],
    ja: [
      `<b>健全性の意味。</b> 健全性定理は、証明体系 K で証明可能な論理式（またはシーケント）が意味論的に妥当であること — すなわち、すべての解釈のもとで真であること — を述べます。形式的に: Γ $\\vdash$_K Δ ならば Γ $\\models$ Δ。言い換えれば、証明体系は決して「嘘をつかない」: 偽であるものを証明することはできません。これは、証明体系が信頼できるための基本的な要件です。`,
      `<b>意味論的妥当性（$\\models$）。</b> Γ $\\models$ Δ とは、任意の解釈 (M, g) について、(M, g) が Γ のすべての論理式を充足するならば、(M, g) が Δ の少なくとも1つの論理式を充足することを意味します。同値的に、集合 $\\lnot$Δ, Γ が充足不能 — Γ のすべてを真にしつつ Δ のすべてを偽にする解釈が存在しない — ということです。命題論理では解釈は真理値割当であり、述語論理では解釈は領域と解釈関数を持つ構造です（戸次 Ch.5, 定義5.66）。`,
      `<b>証明戦略: 充足可能性の保存。</b> 健全性の標準的な証明は、導出に関する帰納法で進みます。タブロー式シーケント計算 (TAB) では、鍵となる補題（戸次 補題13.7）が、各推論規則が充足可能性を上方に保存することを示します: 結論のシーケント Γ ⇒ に充足する解釈があるならば、少なくとも1つの前提にも充足する解釈があります。公理（基本式）$\\lnot \\varphi , \\varphi$, Γ ⇒ は明らかに充足不能なので、証明可能なシーケントから始まる完成した導出は充足不能な葉のみに到達し、根が妥当であることが保証されます。`,
      `<b>各体系の健全性。</b> (1) <b>TAB</b>（定理13.10）: Γ $\\vdash$_TAB Δ ⟹ Γ $\\models$ Δ。対偶による証明 — Γ ⊭ Δ ならば $\\lnot$Δ, Γ は充足可能であり、充足可能性補題により Γ ⊬_TAB Δ。(2) <b>LK</b>（定理13.24）: Γ $\\vdash$_LK Δ ⟹ Γ $\\models$ Δ。LK 規則に対する健全性補題（補題13.25）を用いて同様に証明されます。証明体系の等価性（HK = NK = LK = TAB）により、健全性はすべての古典論理の証明体系に拡張されます。`,
      `<b>健全性の帰結。</b> 健全性には重要な系があります: (1) <b>無矛盾性:</b> 体系が健全であれば、矛盾（$\\bot$）を証明できません。$\\bot$ には充足する解釈が存在しないからです。(2) <b>意味論的カット除去:</b> LK の健全性から、任意の LK 導出のシーケント S に対して LK-CUT の導出が存在します。これは構文的変換ではなく意味論を介したカット除去の全く異なる証明を与えます（戸次 13.6節）。(3) <b>信頼性:</b> 健全性は、証明体系を数学的構造に関する真理を確立するための信頼できるツールとして使うことを正当化します。`,
      `<b>健全性と完全性。</b> 健全性（$\\vdash$ ⟹ $\\models$）と完全性（$\\models$ ⟹ $\\vdash$）は双対的な性質です。これらを合わせると、証明可能性と意味論的妥当性が一致することが確立されます: $\\vdash \\iff \\models$。健全性の証明は一般に比較的容易（導出に関する帰納法）ですが、完全性の証明はかなり困難で歴史的にも深い結果です — ゲーデルの完全性定理（1930年）が一階論理に対してこれを確立しました。健全性は体系が安全であることを、完全性は体系が十分であることを述べます。`,
    ],
  },
  formalNotation:
    "\\Gamma \\vdash_K \\Delta \\;\\Longrightarrow\\; \\Gamma \\vDash \\Delta",
  relatedEntryIds: [
    "concept-semantic-validity",
    "concept-system-equivalence",
    "concept-consistency-from-cut-elimination",
    "system-classical",
    "rule-sc-overview",
    "rule-sc-logical",
    "rule-sc-structural",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Soundness",
      label: {
        en: "Soundness (Wikipedia)",
        ja: "健全性 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E5%81%A5%E5%85%A8%E6%80%A7",
      label: {
        en: "Soundness (Wikipedia JA)",
        ja: "健全性 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/soundness+theorem",
      label: {
        en: "Soundness theorem (nLab)",
        ja: "健全性定理 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "soundness",
    "健全性",
    "sound",
    "semantic validity",
    "意味論的妥当性",
    "satisfiability",
    "充足可能性",
    "interpretation",
    "解釈",
    "consistency",
    "無矛盾性",
    "trustworthy",
    "信頼性",
  ],
  order: 8,
};

const conceptCompleteness: ReferenceEntry = {
  id: "concept-completeness",
  category: "concept",
  title: {
    en: "Completeness Theorem",
    ja: "完全性定理",
  },
  summary: {
    en: "If a formula is semantically valid, then it is provable in the proof system: $\\models$ Δ implies $\\vdash$_K Δ. Gödel's completeness theorem.",
    ja: "意味論的に妥当な論理式は証明体系で証明可能である: $\\models$ Δ ならば $\\vdash$_K Δ。ゲーデルの完全性定理。",
  },
  body: {
    en: [
      `<b>What completeness means.</b> The completeness theorem states that if a formula (or sequent) is semantically valid, then it is provable in the proof system K. Formally: if Γ $\\models$ Δ, then Γ $\\vdash$_K Δ (bekki Definition 13.2). In other words, the proof system has no "gaps": every semantic truth can be captured by a formal derivation. Together with soundness ($\\vdash$ ⟹ $\\models$), completeness establishes the equivalence $\\vdash \\iff \\models$, meaning the syntactic notion of provability perfectly matches the semantic notion of validity.`,
      `<b>Two forms of completeness.</b> Completeness comes in two variants: (1) <b>(Weak) completeness</b> (Theorem 13.13): $\\models \\varphi$ ⟹ $\\vdash$_TAB $\\varphi$ — if a sentence is valid (true in all interpretations), it is provable. (2) <b>Strong completeness</b> (Theorem 13.14): Γ $\\models$ Δ ⟹ Γ $\\vdash$_TAB Δ — if Δ is a semantic consequence of Γ, then Δ is derivable from Γ. Strong completeness subsumes weak completeness (take Γ = ∅). Both forms hold for classical first-order logic.`,
      `<b>Henkin's theorem: the key ingredient.</b> The proof of completeness relies on Henkin's theorem (Theorem 13.12): if Γ ⊬_TAB, then Γ is satisfiable in a countable domain. The contrapositive gives completeness. The proof constructs a <i>full</i> (充満) sequence (Definition 13.17) — a maximally expanded sequence of formulas where every TAB rule's requirements are met — and then extracts an <i>induced Herbrand interpretation</i> (Definition 13.19) from this full sequence, which serves as a countable model.`,
      `<b>Full sequences and induced interpretations.</b> A full sequence Γ̂ (Definition 13.17) satisfies the condition that for every formula that is a principal formula of a TAB rule, the corresponding requirements of that rule are met within Γ̂. Given an unprovable Γ, Lemma 13.18 constructs such a full Γ̂ ⊇ Γ with Γ̂ ⊬_TAB by systematically enumerating all formulas and extending Γ step by step. The induced interpretation F_M from this full sequence (Definition 13.19) assigns truth values based on membership in the sequence, and Lemma 13.20 shows this interpretation satisfies every formula in Γ̂.`,
      `<b>Gödel's completeness theorem.</b> The completeness of first-order logic was first proved by Kurt Gödel in 1930 (his doctoral dissertation). From Theorem 13.13 and TAB soundness, one obtains $\\models \\varphi \\iff \\vdash$_TAB $\\varphi$ — this is Gödel's completeness theorem (bekki p.285, footnote). By the equivalence of proof systems (HK = NK = LK = TAB), completeness extends to all formulations of classical first-order logic.`,
      `<b>Significance and related results.</b> Completeness has profound consequences: (1) It guarantees that the proof system is <i>sufficient</i> — no valid inference escapes it. (2) Combined with soundness, it shows the proof system is equivalent to the semantics (Chapter 5). (3) It underlies the Löwenheim–Skolem theorem (every satisfiable set has a countable model) and the compactness theorem (a set is satisfiable iff every finite subset is). Note: Gödel's completeness theorem should not be confused with Gödel's <i>incompleteness</i> theorems, which concern the limitations of formal systems for arithmetic.`,
    ],
    ja: [
      `<b>完全性の意味。</b> 完全性定理は、意味論的に妥当な論理式（またはシーケント）が証明体系 K で証明可能であることを述べます。形式的に: Γ $\\models$ Δ ならば Γ $\\vdash$_K Δ（戸次 定義13.2）。言い換えれば、証明体系に「漏れ」はない: すべての意味論的真理は形式的な導出で捉えることができます。健全性（$\\vdash$ ⟹ $\\models$）と合わせて、完全性は $\\vdash \\iff \\models$ という等価性を確立し、証明可能性という構文的概念と妥当性という意味論的概念が完全に一致することを意味します。`,
      `<b>完全性の二つの形式。</b> 完全性には二つのバリエーションがあります: (1) <b>（弱い）完全性定理</b>（定理13.13）: $\\models \\varphi$ ⟹ $\\vdash$_TAB $\\varphi$ — 恒真な文（すべての解釈で真）は証明可能である。(2) <b>強い完全性定理</b>（定理13.14）: Γ $\\models$ Δ ⟹ Γ $\\vdash$_TAB Δ — Δ が Γ の意味論的帰結ならば、Δ は Γ から導出可能である。強い完全性は弱い完全性を包含します（Γ = ∅ とすればよい）。両形式とも古典一階論理で成立します。`,
      `<b>ヘンキンの定理: 鍵となる成分。</b> 完全性の証明はヘンキンの定理（定理13.12）に依拠します: Γ ⊬_TAB ならば、Γ は可算領域で充足可能です。この対偶が完全性を与えます。証明は <i>充満</i> した列（定義13.17）— TAB の各規則の要請がすべて満たされた、極大的に拡張された論理式の列 — を構成し、この充満した列から <i>導出された解釈</i>（エルブラン解釈）（定義13.19）を取り出します。これが可算モデルとして機能します。`,
      `<b>充満した列と導出された解釈。</b> 充満した列 Γ̂（定義13.17）は、TAB 規則の主論理式であるすべての論理式について、その規則の対応する要請が Γ̂ 内で満たされるという条件を満足します。証明不能な Γ が与えられたとき、補題13.18 はすべての論理式を体系的に列挙し、Γ を段階的に拡張することで、Γ̂ ⊇ Γ かつ Γ̂ ⊬_TAB である充満した列を構成します。この充満した列からの導出された解釈 F_M（定義13.19）は列への所属に基づいて真理値を割り当て、補題13.20 はこの解釈が Γ̂ 内のすべての論理式を充足することを示します。`,
      `<b>ゲーデルの完全性定理。</b> 一階論理の完全性は、1930年にクルト・ゲーデルによって初めて証明されました（博士論文）。定理13.13 と TAB の健全性から、$\\models \\varphi \\iff \\vdash$_TAB $\\varphi$ が得られます — これがゲーデルの完全性定理です（戸次 p.285, 脚注）。証明体系の等価性（HK = NK = LK = TAB）により、完全性は古典一階論理のすべての定式化に拡張されます。`,
      `<b>意義と関連する結果。</b> 完全性には深い帰結があります: (1) 証明体系が <i>十分</i> であること — 妥当な推論は一つも漏れない — を保証します。(2) 健全性と合わせて、証明体系が意味論（第5章）と等価であることを示します。(3) レーヴェンハイム・スコーレムの定理（充足可能な集合は可算モデルを持つ）やコンパクト性定理（集合が充足可能 $\\iff$ すべての有限部分集合が充足可能）の基礎となります。注意: ゲーデルの完全性定理はゲーデルの <i>不完全性</i> 定理と混同してはなりません。後者は算術の形式体系の限界に関するものです。`,
    ],
  },
  formalNotation:
    "\\Gamma \\vDash \\Delta \\;\\Longrightarrow\\; \\Gamma \\vdash_K \\Delta",
  relatedEntryIds: [
    "concept-soundness",
    "concept-semantic-validity",
    "concept-system-equivalence",
    "system-classical",
    "rule-sc-overview",
    "rule-sc-logical",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/G%C3%B6del%27s_completeness_theorem",
      label: {
        en: "Gödel's completeness theorem (Wikipedia)",
        ja: "ゲーデルの完全性定理 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%B2%E3%83%BC%E3%83%87%E3%83%AB%E3%81%AE%E5%AE%8C%E5%85%A8%E6%80%A7%E5%AE%9A%E7%90%86",
      label: {
        en: "Gödel's completeness theorem (Wikipedia JA)",
        ja: "ゲーデルの完全性定理 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/completeness+theorem",
      label: {
        en: "Completeness theorem (nLab)",
        ja: "完全性定理 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "completeness",
    "完全性",
    "complete",
    "Gödel",
    "ゲーデル",
    "Henkin",
    "ヘンキン",
    "semantic validity",
    "意味論的妥当性",
    "satisfiability",
    "充足可能性",
    "countable model",
    "可算モデル",
    "full sequence",
    "充満",
  ],
  order: 9,
};

const conceptLowenheimSkolem: ReferenceEntry = {
  id: "concept-lowenheim-skolem",
  category: "concept",
  title: {
    en: "Löwenheim–Skolem Theorem",
    ja: "レーヴェンハイム・スコーレムの定理",
  },
  summary: {
    en: "If a set of first-order formulas is satisfiable, then it is satisfiable in a countable domain. Skolem's paradox.",
    ja: "一階論理式の集合が充足可能ならば、可算領域で充足可能である。スコーレムのパラドックス。",
  },
  body: {
    en: [
      `<b>Statement of the theorem.</b> The (downward) Löwenheim–Skolem theorem (bekki Theorem 13.23) states: if a set Γ of first-order formulas is satisfiable, then Γ is satisfiable in a countable domain. Formally: if there exists any interpretation (M, g) satisfying Γ, then there exists a countable interpretation (M', g') also satisfying Γ. This means that no first-order theory can force its models to be uncountable — even theories that "talk about" uncountable sets always have countable models.`,
      `<b>Proof from Henkin's theorem.</b> The proof is remarkably short. Henkin's theorem (Theorem 13.12) shows that if Γ is unprovable (Γ ⊬_TAB), then Γ is satisfiable in a countable domain. Combined with Lemma 13.9 (if Γ is satisfiable, then Γ ⊬_TAB), the Löwenheim–Skolem theorem follows immediately. The key insight is that the Henkin construction always builds a countable model, since it uses only countably many terms as domain elements.`,
      `<b>Skolem's paradox.</b> The theorem leads to the famous Skolem's paradox: set theory (ZFC) proves the existence of uncountable sets, yet by the Löwenheim–Skolem theorem, ZFC itself has a countable model. How can a countable model contain an "uncountable" set? The resolution is that "uncountable" is defined <i>within</i> the model — the model lacks a bijection between its version of ℕ and its version of the reals, even though from outside both are countable. This reveals a fundamental limitation of first-order expressiveness.`,
      `<b>Upward variant.</b> While bekki presents only the downward direction, there is also an upward Löwenheim–Skolem theorem: any first-order theory with an infinite model has models of every infinite cardinality. Together, the downward and upward versions show that first-order logic cannot characterize infinite structures up to isomorphism — it cannot distinguish between different infinite cardinalities.`,
      `<b>Significance for model theory.</b> The Löwenheim–Skolem theorem is a cornerstone of model theory and has far-reaching consequences: (1) It establishes that first-order logic has limited expressive power regarding cardinality. (2) It is closely related to the compactness theorem (Theorem 5.109) — both follow from the completeness theorem. (3) It motivates the study of stronger logics (second-order, infinitary) that can distinguish cardinalities.`,
    ],
    ja: [
      `<b>定理の記述。</b> （下方）レーヴェンハイム・スコーレムの定理（戸次 定理13.23）は次のように述べます: 一階論理式の集合 Γ が充足可能ならば、Γ は可算領域で充足可能である。形式的に: Γ を充足する解釈 (M, g) が存在するならば、Γ を充足する可算な解釈 (M', g') も存在する。これは、いかなる一階理論もモデルを非可算に強制することはできないことを意味します — 非可算集合を「語る」理論であっても常に可算モデルを持ちます。`,
      `<b>ヘンキンの定理からの証明。</b> 証明は驚くほど短いです。ヘンキンの定理（定理13.12）は、Γ が証明不能（Γ ⊬_TAB）ならば、Γ が可算領域で充足可能であることを示します。補題13.9（Γ が充足可能ならば Γ ⊬_TAB）と組み合わせることで、レーヴェンハイム・スコーレムの定理が直ちに従います。鍵となる洞察は、ヘンキンの構成が常に可算モデルを構築するということです。領域の要素として可算個の項のみを使用するからです。`,
      `<b>スコーレムのパラドックス。</b> この定理は有名なスコーレムのパラドックスを導きます: 集合論 (ZFC) は非可算集合の存在を証明しますが、レーヴェンハイム・スコーレムの定理により ZFC 自体が可算モデルを持ちます。可算モデルがどのようにして「非可算」集合を含むことができるのでしょうか？ 解決は、「非可算」がモデル <i>内部</i> で定義されるということにあります — モデルには ℕ の版と実数の版の間の全単射が欠けていますが、外部から見ればどちらも可算です。これは一階論理の表現力の根本的な限界を露呈します。`,
      `<b>上方バリアント。</b> 戸次では下方向のみが提示されていますが、上方レーヴェンハイム・スコーレムの定理もあります: 無限モデルを持つ一階理論は、あらゆる無限基数のモデルを持ちます。下方と上方を合わせると、一階論理は無限構造を同型を除いて特徴づけることができない — 異なる無限基数を区別できない — ことが示されます。`,
      `<b>モデル理論への意義。</b> レーヴェンハイム・スコーレムの定理はモデル理論の礎石であり、広範な帰結を持ちます: (1) 一階論理が基数に関して限定的な表現力を持つことを確立します。(2) コンパクト性定理（定理5.109）と密接に関連します — どちらも完全性定理から従います。(3) 基数を区別できるより強力な論理（二階論理、無限長論理）の研究を動機づけます。`,
    ],
  },
  formalNotation:
    "\\Gamma \\text{ is satisfiable} \\;\\Longrightarrow\\; \\Gamma \\text{ is satisfiable in a countable domain}",
  relatedEntryIds: [
    "concept-completeness",
    "concept-soundness",
    "concept-system-equivalence",
    "system-classical",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/L%C3%B6wenheim%E2%80%93Skolem_theorem",
      label: {
        en: "Löwenheim–Skolem theorem (Wikipedia)",
        ja: "レーヴェンハイム・スコーレムの定理 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%83%AC%E3%83%BC%E3%83%B4%E3%82%A7%E3%83%B3%E3%83%8F%E3%82%A4%E3%83%A0%E2%80%93%E3%82%B9%E3%82%B3%E3%83%BC%E3%83%AC%E3%83%A0%E3%81%AE%E5%AE%9A%E7%90%86",
      label: {
        en: "Löwenheim–Skolem theorem (Wikipedia JA)",
        ja: "レーヴェンハイム・スコーレムの定理 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/L%C3%B6wenheim-Skolem+theorem",
      label: {
        en: "Löwenheim–Skolem theorem (nLab)",
        ja: "レーヴェンハイム・スコーレムの定理 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "Löwenheim",
    "レーヴェンハイム",
    "Skolem",
    "スコーレム",
    "countable model",
    "可算モデル",
    "Skolem's paradox",
    "スコーレムのパラドックス",
    "downward",
    "下方",
    "model theory",
    "モデル理論",
    "cardinality",
    "基数",
  ],
  order: 10,
};

const conceptCompactness: ReferenceEntry = {
  id: "concept-compactness",
  category: "concept",
  title: {
    en: "Compactness Theorem",
    ja: "コンパクト性定理",
  },
  summary: {
    en: "A set of first-order formulas is satisfiable if and only if every finite subset is satisfiable.",
    ja: "一階論理式の集合が充足可能であるのは、そのすべての有限部分集合が充足可能であるときに限る。",
  },
  body: {
    en: [
      `<b>Statement of the theorem.</b> The compactness theorem (bekki Theorem 5.109, restated in Section 13.5) states: a set Γ of first-order formulas is satisfiable if and only if every finite subset Γ' ⊆ Γ is satisfiable. The "if" direction is the non-trivial part — the "only if" direction is immediate (any interpretation satisfying Γ also satisfies all its subsets). This theorem captures a remarkable property of first-order logic: infinite unsatisfiability always has a finite "witness."`,
      `<b>Proof from Henkin's theorem.</b> In bekki's presentation, compactness follows immediately from Henkin's theorem and the completeness theorem. If every finite subset of Γ is satisfiable, then by soundness, no finite subset is refutable. Since proofs are finite objects, Γ itself is not refutable (any proof of $\\bot$ from Γ would use only finitely many premises). By completeness, Γ is therefore satisfiable. The proof was originally given in Section 5.5.3, where it was used in proving Herbrand's theorem (Theorem 5.110).`,
      `<b>Why "compactness"?</b> The name comes from topology. Consider the space of all truth-value assignments (interpretations) with the product topology. The set of models of each formula is a closed set, and satisfiability of Γ means the intersection of these closed sets is non-empty. By the topological compactness of the product space (Tychonoff's theorem), if every finite sub-intersection is non-empty (every finite subset is satisfiable), then the full intersection is non-empty.`,
      `<b>Applications.</b> Compactness is one of the most powerful tools in model theory: (1) <b>Non-standard models:</b> It can show that if a theory has arbitrarily large finite models, it has an infinite model (adding axioms saying "there exist at least n distinct elements" for each n). (2) <b>Transfer principles:</b> Properties true in all finite structures that can be expressed in first-order logic must also hold in some infinite structures. (3) <b>Constructing models:</b> It enables the construction of models with specific properties by adding axiom schemas.`,
      `<b>Failure in stronger logics.</b> Compactness is specific to first-order logic and fails in most stronger logics. For example, in second-order logic, the set {"there exist at least n elements" | n ∈ ℕ} ∪ {"the domain is finite"} has every finite subset satisfiable, but the whole set is not. This failure is intimately related to the failure of completeness in second-order logic. Together with the Löwenheim–Skolem theorem, compactness characterizes first-order logic (Lindström's theorem).`,
    ],
    ja: [
      `<b>定理の記述。</b> コンパクト性定理（戸次 定理5.109、13.5節に再掲）は次のように述べます: 一階論理式の集合 Γ が充足可能であるのは、すべての有限部分集合 Γ' ⊆ Γ が充足可能であるときに限る。「ときに限る」の「ならば」方向が自明でない部分です — 「であるならば」方向は自明です（Γ を充足する解釈はそのすべての部分集合も充足します）。この定理は一階論理の驚くべき性質を捉えています: 無限の充足不能性には常に有限の「証拠」があります。`,
      `<b>ヘンキンの定理からの証明。</b> 戸次の提示では、コンパクト性はヘンキンの定理と完全性定理から直ちに従います。Γ のすべての有限部分集合が充足可能ならば、健全性により、有限部分集合は反駁不能です。証明は有限のオブジェクトなので、Γ 自体も反駁不能です（Γ からの $\\bot$ の証明は有限個の前提のみを使うため）。完全性により、Γ は充足可能です。証明は元々5.5.3節で与えられ、エルブランの定理（定理5.110）の証明に使われました。`,
      `<b>なぜ「コンパクト性」か？</b> 名前は位相幾何学に由来します。すべての真理値割当（解釈）の空間を直積位相で考えます。各論理式のモデルの集合は閉集合であり、Γ の充足可能性はこれらの閉集合の共通部分が空でないことを意味します。直積空間の位相的コンパクト性（チコノフの定理）により、すべての有限部分共通が空でなければ（すべての有限部分集合が充足可能ならば）、全体の共通部分も空でありません。`,
      `<b>応用。</b> コンパクト性はモデル理論における最も強力なツールの一つです: (1) <b>超準モデル:</b> ある理論が任意に大きな有限モデルを持つならば、無限モデルも持つことを示せます（「少なくとも n 個の異なる要素が存在する」という公理を各 n について追加）。(2) <b>転移原理:</b> すべての有限構造で成り立つ一階論理で表現可能な性質は、ある無限構造でも成立しなければなりません。(3) <b>モデルの構成:</b> 公理スキーマを追加することで特定の性質を持つモデルの構成が可能になります。`,
      `<b>より強い論理での不成立。</b> コンパクト性は一階論理に特有であり、ほとんどのより強い論理では成立しません。例えば、二階論理では {「少なくとも n 個の要素が存在する」 | n ∈ ℕ} ∪ {「領域は有限である」} はすべての有限部分集合が充足可能ですが、全体は充足不能です。この不成立は二階論理での完全性の不成立と密接に関連しています。レーヴェンハイム・スコーレムの定理とともに、コンパクト性は一階論理を特徴づけます（リンドストレームの定理）。`,
    ],
  },
  formalNotation:
    "\\forall \\Gamma' \\subseteq \\Gamma \\;(|\\Gamma'| < \\omega \\Rightarrow \\Gamma' \\text{ sat.}) \\;\\Longrightarrow\\; \\Gamma \\text{ sat.}",
  relatedEntryIds: [
    "concept-completeness",
    "concept-soundness",
    "concept-lowenheim-skolem",
    "system-classical",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Compactness_theorem",
      label: {
        en: "Compactness theorem (Wikipedia)",
        ja: "コンパクト性定理 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%B3%E3%83%B3%E3%83%91%E3%82%AF%E3%83%88%E6%80%A7%E5%AE%9A%E7%90%86",
      label: {
        en: "Compactness theorem (Wikipedia JA)",
        ja: "コンパクト性定理 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/compactness+theorem",
      label: {
        en: "Compactness theorem (nLab)",
        ja: "コンパクト性定理 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "compactness",
    "コンパクト性",
    "compact",
    "finite subset",
    "有限部分集合",
    "satisfiable",
    "充足可能",
    "model theory",
    "モデル理論",
    "non-standard model",
    "超準モデル",
    "Lindström",
    "リンドストレーム",
  ],
  order: 11,
};

const conceptProofTheoreticSemantics: ReferenceEntry = {
  id: "concept-proof-theoretic-semantics",
  category: "concept",
  title: {
    en: "Proof-Theoretic Semantics",
    ja: "証明論的意味論",
  },
  summary: {
    en: "An approach that defines the meaning of logical connectives through their behavior in proof systems, rather than through truth values or model-theoretic interpretations.",
    ja: "論理結合子の意味を真理値やモデル論的解釈ではなく、証明体系における振る舞いによって定める立場。",
  },
  body: {
    en: [
      `<b>From soundness and completeness to meaning.</b> The soundness and completeness theorems for first-order logic establish that Γ $\\vdash$ Δ if and only if Γ $\\models$ Δ. This means that any formula provable in a proof system (Hilbert, natural deduction, sequent calculus, or tableau — all equivalent by the results of Chapters 9–10) is indeed semantically valid. In the standard view, this gives proof systems their "legitimacy": they are justified because they agree with model-theoretic truth.`,
      `<b>Two perspectives on legitimacy.</b> However, one can also adopt a different viewpoint (bekki Section 13.7). Instead of asking whether a proof system faithfully captures semantic truth, one can ask whether every individual proof system is legitimate in its own right. Under this view, soundness and completeness theorems are needed to certify that a proof system is a "genuine proof system." But another perspective — proof-theoretic semantics — proposes that proof systems can define the meaning of logical connectives independently.`,
      `<b>Meaning through proof rules.</b> In proof-theoretic semantics, the meaning of a connective like $\\land$ (conjunction) is not given by "$\\land$ is true when both conjuncts are true" (the model-theoretic account). Instead, it is determined by the inference rules that govern it. In model-theoretic semantics, |$\\land$| is expressed as a truth table; in proof-theoretic semantics, the meaning of $\\land$ is determined by the two rules ($\\land$) and ($\\lnot \\land$) in the tableau system — or equivalently by the introduction and elimination rules $\\land$I and $\\land$E in natural deduction (bekki Section 13.7).`,
      `<b>Circularity concern and its resolution.</b> A natural worry arises: when we transfer from one proof system to another (say, from Hilbert to natural deduction), is the validity ultimately preserved? Could the transfer chain produce a circularity, where no system is grounded in absolute correctness? In proof-theoretic semantics, the definition of validity is internal to each system: a proof system's rules themselves constitute the meaning of the connectives. There is no need to appeal to an external notion of truth. However, the equivalence between proof systems and their inclusion relationships guarantee that validity is maintained relatively — each system is justified by its relationship to other systems (bekki Section 13.7).`,
      `<b>Significance: meaning without truth.</b> The key insight from soundness and completeness is that the meaning of a formula need not be defined via truth values. Model-theoretic semantics defines meaning through truth functions and interpretations, but proof-theoretic semantics shows that an entirely different — yet equally valid — notion of "meaning" can be given through the behavior of formulas in proofs. This observation, discussed in bekki's concluding remarks on Chapter 2, challenges the common intuition that truth is the fundamental concept. Multiple "meaning" frameworks can coexist, each revealing different aspects of logic.`,
    ],
    ja: [
      `<b>健全性と完全性から意味へ。</b> 一階論理の健全性定理と完全性定理は Γ $\\vdash$ Δ と Γ $\\models$ Δ が同値であることを確立します。つまり、証明体系（ヒルベルト流、自然演繹、シーケント計算、タブロー — 9–10章の結果によりすべて等価）で証明可能な論理式は、意味論的に妥当です。標準的な見方では、これが証明体系に「正当性」を与えます: モデル論的な真理と一致するがゆえに正当化されるのです。`,
      `<b>正当性に関する二つの視点。</b> しかし、別の見方も可能です（戸次 13.7節）。証明体系が意味論的真理を忠実に捉えているかを問う代わりに、個々の証明体系がそれ自体として正当であるかを問うこともできます。この見方では、証明体系が「まともな証明体系」であることを保証するために健全性・完全性定理が必要です。しかし別の視点 — 証明論的意味論 — は、証明体系が論理結合子の意味を独立に定義できると提案します。`,
      `<b>証明規則による意味。</b> 証明論的意味論では、$\\land$（連言）のような結合子の意味は「両方の連言肢が真のとき $\\land$ は真」（モデル論的説明）としてではなく、それを支配する推論規則によって定められます。モデル論の意味論では |$\\land$| は真理値表として表されますが、証明論的意味論では $\\land$ の意味はタブロー体系における ($\\land$) と ($\\lnot \\land$) の二つの規則によって — あるいは同等に自然演繹の導入規則 $\\land$I と除去規則 $\\land$E によって — 決定されます（戸次 13.7節）。`,
      `<b>循環の懸念とその解消。</b> 自然な疑問が生じます: ある証明体系から別の体系へ（たとえばヒルベルト流から自然演繹へ）移行するとき、妥当性は最終的に保存されるのでしょうか？ 移行の連鎖が循環を生み、どの体系も絶対的な正しさに基盤を持たないということにならないでしょうか？ 証明論的意味論では、妥当性の定義は各体系の内部にあります: 証明体系の規則自体が結合子の意味を構成するのです。外部的な真理概念に訴える必要はありません。ただし、証明体系間の等価性や包含関係により、妥当性は相対的に保証されます — 各体系は他の体系との関係によって正当化されます（戸次 13.7節）。`,
      `<b>意義: 真理なしの意味。</b> 健全性と完全性からの重要な洞察は、論理式の意味が真理値によって定義される必要がないということです。モデル論の意味論は真理関数と解釈を通じて意味を定義しますが、証明論的意味論は、証明における論理式の振る舞いを通じて、まったく異なりながらも同様に妥当な「意味」の概念を与えられることを示します。戸次の第2章に関する結びの考察で述べられたこの観察は、真理が根本概念であるという一般的直観に挑戦するものです。複数の「意味」の枠組みが共存でき、それぞれが論理の異なる側面を明らかにするのです。`,
    ],
  },
  relatedEntryIds: [
    "concept-soundness",
    "concept-completeness",
    "concept-system-equivalence",
    "rule-nd-overview",
    "rule-sc-overview",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Proof-theoretic_semantics",
      label: {
        en: "Proof-theoretic semantics (Wikipedia)",
        ja: "証明論的意味論 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E8%A8%BC%E6%98%8E%E8%AB%96%E7%9A%84%E6%84%8F%E5%91%B3%E8%AB%96",
      label: {
        en: "Proof-theoretic semantics (Wikipedia JA)",
        ja: "証明論的意味論 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/proof-theoretic+semantics",
      label: {
        en: "Proof-theoretic semantics (nLab)",
        ja: "証明論的意味論 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "proof-theoretic semantics",
    "証明論的意味論",
    "proof-theoretic",
    "meaning",
    "意味",
    "inference rule",
    "推論規則",
    "introduction rule",
    "導入規則",
    "elimination rule",
    "除去規則",
    "Dummett",
    "Prawitz",
    "harmony",
    "調和",
  ],
  order: 12,
};

const conceptCutElimination: ReferenceEntry = {
  id: "concept-cut-elimination",
  category: "concept",
  title: {
    en: "Cut Elimination Theorem",
    ja: "カット除去定理",
  },
  summary: {
    en: "Any sequent provable with the CUT rule can be proved without it. The CUT rule is admissible in LM, LJ, and LK. Also known as Gentzen's Hauptsatz.",
    ja: "カット規則を用いた証明は、カット規則なしの証明に変換できる。カット規則は LM, LJ, LK において許容規則である。ゲンツェンの基本定理とも呼ばれる。",
  },
  body: {
    en: [
      `<b>Statement and significance.</b> The cut elimination theorem (Hauptsatz) states that for any sequent S, if S is provable in the sequent calculus K (= K-CUT + CUT), then S is provable in K-CUT (i.e., without the CUT rule). This holds for all three sequent calculi: LM (minimal logic), LJ (intuitionistic logic), and LK (classical logic) (bekki Theorem 11.2). Since K = K-CUT + CUT by definition, this means the CUT rule is an <b>admissible rule</b> — adding it does not increase the set of provable sequents. This fundamental result, discovered by Gerhard Gentzen in 1934, is one of the most important theorems in proof theory.`,
      `<b>The MIX rule and proof strategy.</b> The proof uses a variant of CUT called the <b>MIX rule</b>, which replaces <i>all</i> occurrences of the cut formula rather than just one. On LM-CUT and LJ-CUT, CUT and MIX are equivalent (bekki Lemma 11.13), so proving that MIX is admissible suffices. MIX has better structural properties for the induction argument. The proof proceeds by <b>double induction</b> on the pair (depth d, rank r): the depth d measures the syntactic complexity of the principal (cut) formula, and the rank r counts the consecutive occurrences of the principal formula along paths in the proof tree (bekki Definitions 11.16–11.18).`,
      `<b>Double induction structure.</b> The elimination is decomposed into three lemmas: (1) Cut(1,1) — the base case for depth 1 and rank 1 (bekki Lemma 11.23); (2) Cut(d,r) follows from Cut(d,1)…Cut(d,r−1) for r ≥ 2 — reducing rank while keeping depth fixed (bekki Lemma 11.24); (3) Cut(d,1) follows from Cut(1,r)…Cut(d−1,r) for all r, for d ≥ 2 — reducing depth at the cost of possibly increasing rank (bekki Lemma 11.26). This lexicographic induction on (d,r) terminates because each step strictly decreases the pair (bekki Remark 11.28).`,
      `<b>Consistency as a corollary.</b> A profound consequence of cut elimination is the <b>consistency</b> (inconsistency-freeness) of the proof systems: $\\bot$ is not provable in LK or LJ (bekki Theorem 11.5). The proof is elegant: if $\\bot$ were provable, there would be a CUT-free proof of the sequent ⇒ $\\bot$. But no CUT-free inference rule can produce a sequent with an empty antecedent and $\\bot$ as the sole succedent, yielding a contradiction. This extends to all equivalent systems (NK, NJ, HK, HJ).`,
      `<b>Independence of classical axioms.</b> Another corollary is the <b>independence of DNE from intuitionistic logic</b>: the law of double negation elimination ($\\lnot \\lnot \\varphi \\to \\varphi$) is not provable in LJ (bekki Theorem 11.9). The proof uses the fact that LEM ($\\varphi \\lor \\lnot \\varphi$) is not LJ-provable (bekki Theorem 11.8), which follows from a structural analysis of LJ-CUT proofs showing that CUT-free proofs in LJ must have non-empty antecedents with compound formulas (bekki Lemma 11.6). The LK proof uses a different, elegant approach: via Glivenko's theorem, LK cut elimination is reduced to LJ cut elimination (bekki p.266–267).`,
    ],
    ja: [
      `<b>定理の主張と意義。</b> カット除去定理（基本定理, Hauptsatz）は、シーケント S が体系 K（= K-CUT + CUT）で証明可能ならば、K-CUT（カット規則なし）でも証明可能であることを述べます。これはすべてのシーケント計算 — LM（最小論理）、LJ（直観主義論理）、LK（古典論理）— で成り立ちます（戸次 定理11.2）。K = K-CUT + CUT なので、これはカット規則が<b>許容規則</b>であることを意味します — カット規則を追加しても証明可能なシーケントの集合は増えません。ゲルハルト・ゲンツェンが1934年に発見したこの基本的な結果は、証明論において最も重要な定理の一つです。`,
      `<b>ミックス規則と証明戦略。</b> 証明にはカットの変種である<b>ミックス規則 (MIX)</b> が使われます。MIX はカット論理式のすべての出現を一度に置き換える規則で、LM-CUT および LJ-CUT 上でカットと同値です（戸次 補題11.13）。そのため、MIX の許容性を示せば十分です。MIX は帰納法の議論により適した構造的性質を持ちます。証明は対 (深さ d, 階数 r) に対する<b>二重帰納法</b>で進みます。深さ d は主論理式（カット論理式）の構文的複雑さ、階数 r は証明図の経路に沿った主論理式の連続出現回数を測ります（戸次 定義11.16–11.18）。`,
      `<b>二重帰納法の構造。</b> 除去は3つの補題に分解されます: (1) Cut(1,1) — 深さ1・階数1の基本ケース（戸次 補題11.23）、(2) r ≥ 2 のとき Cut(d,1)…Cut(d,r−1) から Cut(d,r) が従う — 深さを固定して階数を減少（戸次 補題11.24）、(3) d ≥ 2 のとき任意の r に対して Cut(1,r)…Cut(d−1,r) から Cut(d,1) が従う — 階数が増える可能性があるが深さが減少（戸次 補題11.26）。(d,r) の辞書式帰納法は各ステップで対を真に減少させるため停止します（戸次 解説11.28）。`,
      `<b>系としての無矛盾性。</b> カット除去の深い帰結として、証明体系の<b>無矛盾性</b>（矛盾の導出不可能性）があります: LK でも LJ でも $\\bot$ は証明不能です（戸次 定理11.5）。証明は簡明です: もし $\\bot$ が証明可能なら、シーケント ⇒ $\\bot$ のカットなし証明が存在しますが、前件が空で $\\bot$ のみを後件に持つシーケントを結論とするカットなし推論規則は存在しないため矛盾します。これは等価な体系（NK, NJ, HK, HJ）にも拡張されます。`,
      `<b>古典論理固有の公理の独立性。</b> もう一つの系として、<b>直観主義論理からの DNE の独立性</b>があります: 二重否定除去（$\\lnot \\lnot \\varphi \\to \\varphi$）は LJ では証明不能です（戸次 定理11.9）。証明には、排中律（$\\varphi \\lor \\lnot \\varphi$）が LJ で証明不能であること（戸次 定理11.8）を利用します。これは LJ-CUT の証明の構造分析 — カットなし証明では前件が非空で複合論理式を含む必要がある（戸次 補題11.6）— から従います。LK の証明は異なる巧妙なアプローチを取ります: グリベンコの定理を経由して、LK のカット除去を LJ のカット除去に帰着させます（戸次 p.266–267）。`,
    ],
  },
  formalNotation:
    "\\vdash_K S \\;\\Longrightarrow\\; \\vdash_{K\\text{-CUT}} S",
  relatedEntryIds: [
    "concept-soundness",
    "concept-completeness",
    "concept-system-equivalence",
    "rule-sc-overview",
    "rule-sc-structural",
    "rule-sc-logical",
    "concept-glivenko",
    "concept-curry-howard",
    "concept-admissible-derivable",
    "concept-tab-lk-equivalence",
    "concept-consistency-from-cut-elimination",
    "concept-axiom-independence",
    "concept-speed-up-theorem",
  ],
  relatedQuestIds: ["sc-ce-01", "sc-ce-02", "sc-ce-03"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Cut-elimination_theorem",
      label: {
        en: "Cut-elimination theorem (Wikipedia)",
        ja: "カット除去定理 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%AB%E3%83%83%E3%83%88%E9%99%A4%E5%8E%BB%E5%AE%9A%E7%90%86",
      label: {
        en: "Cut elimination theorem (Wikipedia JA)",
        ja: "カット除去定理 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/cut+elimination",
      label: {
        en: "Cut elimination (nLab)",
        ja: "カット除去 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "cut elimination",
    "カット除去",
    "Hauptsatz",
    "基本定理",
    "Gentzen",
    "ゲンツェン",
    "admissible",
    "許容規則",
    "MIX rule",
    "ミックス規則",
    "consistency",
    "無矛盾性",
    "double induction",
    "二重帰納法",
    "rank",
    "階数",
  ],
  order: 13,
};

const conceptCurryHoward: ReferenceEntry = {
  id: "concept-curry-howard",
  category: "concept",
  title: {
    en: "Curry-Howard Correspondence",
    ja: "カリー・ハワード対応",
  },
  summary: {
    en: "A deep structural isomorphism between typed lambda calculus and natural deduction: proofs correspond to programs, and propositions correspond to types.",
    ja: "型付きラムダ計算と自然演繹の間の深い構造的同型: 証明はプログラムに、命題は型に対応する。",
  },
  body: {
    en: [
      `<b>Proofs as programs, propositions as types.</b> The Curry-Howard correspondence (also called the Curry-Howard isomorphism or proofs-as-programs interpretation) reveals a profound structural identity between formal proof systems and type systems in programming languages. Under this correspondence, <b>propositions correspond to types</b> and <b>proofs correspond to programs</b> (lambda terms). For example, a proof of the implication $\\varphi \\to \\psi$ corresponds to a function of type $\\varphi \\to \\psi$ — a program that takes an input of type $\\varphi$ and produces an output of type $\\psi$. This insight, discovered independently by Haskell Curry (1958) and William Howard (1969), fundamentally connects logic and computation.`,
      `<b>The correspondence table.</b> The key correspondences are: implication ($\\to$) corresponds to function types, conjunction ($\\land$) to product types (pairs), disjunction ($\\lor$) to sum types (tagged unions), universal quantification ($\\forall$) to dependent function types, and existential quantification ($\\exists$) to dependent pair types. On the proof side, the introduction and elimination rules of natural deduction correspond precisely to the construction and destruction operations of typed lambda calculus: $\\to$-introduction is lambda abstraction, $\\to$-elimination is function application, $\\land$-introduction is pair construction, and so on.`,
      `<b>Cut elimination and normalization.</b> One of the most striking aspects of the correspondence is the connection between <b>cut elimination</b> in sequent calculus and <b>normalization</b> (β-reduction) in lambda calculus. A cut in a proof corresponds to a β-redex in a lambda term — the composition of an introduction rule immediately followed by an elimination rule. Cut elimination transforms a proof into cut-free (normal) form, just as β-reduction normalizes a lambda term. The strong normalization theorem for typed lambda calculus is thus the computational counterpart of the cut elimination theorem (bekki Afterword p.298). Key references include Prawitz (1965), Zucker (1974), Pottinger (1977), and Barendregt and Ghilezan (2000).`,
      `<b>Logical systems and type systems.</b> Different logical systems correspond to different type systems: minimal logic (NM) corresponds to the simply typed lambda calculus, intuitionistic logic (NJ) to the simply typed lambda calculus with an empty type ($\\bot$), and classical logic (NK) to extensions with control operators (such as call/cc or continuations). The correspondence extends beyond propositional logic — Martin-Löf's intuitionistic type theory extends it to predicate logic with dependent types, forming the foundation of proof assistants such as Coq, Agda, and Lean.`,
      `<b>Significance and applications.</b> The Curry-Howard correspondence bridges the gap between mathematics and computer science, enabling: (1) proof assistants that verify mathematical proofs as type-checked programs, (2) program extraction from constructive proofs, and (3) a unified framework for understanding both proof theory and programming language theory. The correspondence has inspired the development of modern programming language features including pattern matching (corresponding to case analysis on disjunctions), dependent types (corresponding to quantifiers), and effects/continuations (corresponding to classical reasoning principles).`,
    ],
    ja: [
      `<b>証明はプログラム、命題は型。</b> カリー・ハワード対応（カリー・ハワード同型とも呼ばれる）は、形式的な証明体系とプログラミング言語の型システムの間に存在する深い構造的同一性を明らかにします。この対応のもとで、<b>命題は型に対応</b>し、<b>証明はプログラム</b>（ラムダ項）に対応します。たとえば、含意 $\\varphi \\to \\psi$ の証明は型 $\\varphi \\to \\psi$ を持つ関数 — 型 $\\varphi$ の入力を受け取り型 $\\psi$ の出力を返すプログラム — に対応します。この洞察はハスケル・カリー（1958年）とウィリアム・ハワード（1969年）によって独立に発見され、論理学と計算を根本的に結びつけるものです。`,
      `<b>対応表。</b> 主要な対応は次のとおりです: 含意（$\\to$）は関数型に、連言（$\\land$）は直積型（ペア）に、選言（$\\lor$）は直和型（タグ付き共用体）に、全称量化（$\\forall$）は依存関数型に、存在量化（$\\exists$）は依存ペア型に対応します。証明の側では、自然演繹の導入規則と除去規則が型付きラムダ計算の構成操作と分解操作に正確に対応します: $\\to$導入はラムダ抽象、$\\to$除去は関数適用、$\\land$導入はペア構成、などとなります。`,
      `<b>カット除去と正規化。</b> この対応の最も顕著な側面の一つが、シーケント計算における<b>カット除去</b>とラムダ計算における<b>正規化</b>（β簡約）の間の結びつきです。証明のカットはラムダ項のβ簡約基（β-redex）— 導入規則の直後に除去規則が続く合成 — に対応します。カット除去は証明をカットなし（正規）の形に変換しますが、これはちょうどβ簡約がラムダ項を正規化するのと同じです。型付きラムダ計算の強正規化定理はカット除去定理の計算的対応物です（戸次 おわりに p.298）。主要な参考文献として Prawitz (1965)、Zucker (1974)、Pottinger (1977)、Barendregt and Ghilezan (2000) があります。`,
      `<b>論理体系と型システム。</b> 異なる論理体系は異なる型システムに対応します: 最小論理（NM）は単純型付きラムダ計算に、直観主義論理（NJ）は空型（$\\bot$）を持つ単純型付きラムダ計算に、古典論理（NK）は制御演算子（call/ccや継続など）を持つ拡張に対応します。この対応は命題論理を超えて拡張され — マルティン＝レーフの直観主義型理論は依存型による述語論理への拡張であり、Coq, Agda, Lean などの証明支援系の基盤となっています。`,
      `<b>意義と応用。</b> カリー・ハワード対応は数学と計算機科学を橋渡しし、以下を可能にします: (1) 数学的証明を型検査されたプログラムとして検証する証明支援系、(2) 構成的証明からのプログラム抽出、(3) 証明論とプログラミング言語理論の両方を理解するための統一的な枠組み。この対応は現代のプログラミング言語機能の発展にも影響を与えており、パターンマッチング（選言に対するケース分析に対応）、依存型（量化子に対応）、エフェクト・継続（古典的推論原理に対応）などがあります。`,
    ],
  },
  formalNotation:
    "\\text{Proof of } \\varphi \\;\\longleftrightarrow\\; \\text{Term } M : \\varphi",
  relatedEntryIds: [
    "concept-cut-elimination",
    "rule-nd-overview",
    "rule-nd-implication",
    "system-minimal",
    "system-intuitionistic",
    "system-classical",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Curry%E2%80%93Howard_correspondence",
      label: {
        en: "Curry-Howard correspondence (Wikipedia)",
        ja: "カリー・ハワード対応 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%AB%E3%83%AA%E3%83%BC%EF%BC%9D%E3%83%8F%E3%83%AF%E3%83%BC%E3%83%89%E5%90%8C%E5%9E%8B",
      label: {
        en: "Curry-Howard isomorphism (Wikipedia JA)",
        ja: "カリー＝ハワード同型 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/propositions+as+types",
      label: {
        en: "Propositions as types (nLab)",
        ja: "命題としての型 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "Curry-Howard",
    "カリー・ハワード",
    "proofs as programs",
    "propositions as types",
    "命題は型",
    "証明はプログラム",
    "isomorphism",
    "同型",
    "typed lambda calculus",
    "型付きラムダ計算",
    "normalization",
    "正規化",
    "β-reduction",
    "β簡約",
    "proof assistant",
    "証明支援系",
  ],
  order: 14,
};

const conceptAdmissibleDerivable: ReferenceEntry = {
  id: "concept-admissible-derivable",
  category: "concept",
  title: {
    en: "Admissible vs Derivable Rules",
    ja: "許容規則と派生規則",
  },
  summary: {
    en: "A derivable rule can be justified within the system by a proof tree; an admissible rule preserves provability but may lack such justification.",
    ja: "派生規則は体系内の証明図で正当化できる規則であり、許容規則は証明可能性を保存するが体系内での正当化を持つとは限らない。",
  },
  body: {
    en: [
      `<b>Derivable and admissible rules.</b> In formal proof systems, particularly sequent calculus, the distinction between <b>derivable</b> (derivable) and <b>admissible</b> (admissible) rules is fundamental. Consider a rule R of the form "from premises S₁, ..., Sₙ conclude S." Rule R is <b>derivable</b> in a proof system K if there exists a proof tree in K from S₁, ..., Sₙ to S — that is, the rule can be justified entirely within the system. Rule R is <b>admissible</b> in K if whenever S₁, ..., Sₙ are all provable in K, then S is also provable in K — that is, adding the rule does not increase the set of theorems (bekki Definition 9.24).`,
      `<b>Every derivable rule is admissible.</b> If a rule can be justified within the system (derivable), then it certainly preserves provability (admissible). The converse does not hold in general: there are rules that preserve provability without being justifiable within the system. This asymmetry is precisely what makes the distinction important (bekki Remark 9.25).`,
      `<b>The cut rule as a key example.</b> The most prominent example of this distinction is the <b>cut rule</b> in sequent calculus. The cut rule is derivable in systems that include it (such as LK, LJ, LM with cut), but the <b>cut elimination theorem</b> shows that the cut rule is admissible in the cut-free systems — any sequent provable with cut is also provable without it. This means removing the cut rule does not reduce the proving power of the system, even though the cut rule cannot be derived from the remaining rules alone (bekki Theorem 9.28).`,
      `<b>Characterization theorem.</b> Bekki's Theorem 9.28 provides five equivalent conditions for a rule R to be admissible in K: (1) K = K+R (adding the rule does not change the system), (2) anything provable in K+R is already provable in K, (3) any K+R proof can be transformed into a K proof, (4) any K+R proof where R is used only at the bottom can be transformed into a K proof, and (5) the premises being provable in K implies the conclusion is provable in K. Furthermore, two rules R and R' are equivalent over K if and only if each is admissible in the system extended by the other (bekki Theorem 9.30).`,
      `<b>Significance in proof theory.</b> The admissible/derivable distinction is central to understanding the structure of proof systems. When designing or analyzing a logic, one must determine whether certain rules (weakening, contraction, cut) are built into the system (derivable) or merely preserve theorems (admissible). This distinction also affects the computational content of proofs under the Curry-Howard correspondence: derivable rules correspond to definable functions, while admissible rules may require global transformations that have no direct computational counterpart.`,
    ],
    ja: [
      `<b>派生規則と許容規則。</b> 形式的な証明体系、特にシーケント計算において、<b>派生可能</b>（derivable）と<b>許容的</b>（admissible）の区別は基本的に重要です。「前提 S₁, ..., Sₙ から結論 S を得る」形式の規則 R を考えます。規則 R が証明体系 K において<b>派生規則</b>であるとは、S₁, ..., Sₙ から S への K の証明図が存在すること — すなわち、その規則が体系内で完全に正当化できることを意味します。規則 R が K において<b>許容規則</b>であるとは、S₁, ..., Sₙ がすべて K で証明可能であるならば S もまた K で証明可能であること — すなわち、その規則を加えても定理の集合が増えないことを意味します（戸次 定義9.24）。`,
      `<b>すべての派生規則は許容規則である。</b> 規則が体系内で正当化できる（派生可能な）場合、それは確実に証明可能性を保存します（許容的です）。逆は一般には成り立ちません: 証明可能性を保存するが体系内では正当化できない規則が存在します。この非対称性こそが、この区別を重要にしている点です（戸次 解説9.25）。`,
      `<b>カット規則 — 鍵となる例。</b> この区別の最も顕著な例は、シーケント計算における<b>カット規則</b>です。カット規則はそれを含む体系（カット付きの LK, LJ, LM など）では派生規則ですが、<b>カット除去定理</b>はカットなし体系においてカット規則が許容規則であることを示しています — カットを使って証明できるシーケントはカットなしでも証明可能です。これは、カット規則を除いても体系の証明力が減らないことを意味しますが、残りの規則だけからカット規則を導出することはできません（戸次 定理9.28）。`,
      `<b>特徴付け定理。</b> 戸次の定理9.28は、規則 R が K において許容規則であるための5つの同値条件を与えます: (1) K = K+R（規則を加えても体系が変わらない）、(2) K+R で証明可能なものはすでに K で証明可能、(3) K+R の証明図は K の証明図に変換できる、(4) R が最下段のみで使われている K+R の証明図は K の証明図に変換できる、(5) 前提が K で証明可能ならば結論も K で証明可能。さらに、2つの規則 R と R' が K 上で等価であるための必要十分条件は、それぞれが他方を加えた体系の許容規則であることです（戸次 定理9.30）。`,
      `<b>証明論における意義。</b> 許容規則と派生規則の区別は、証明体系の構造を理解するうえで中心的です。論理を設計・分析する際には、ある規則（弱化、縮約、カット）が体系に組み込まれている（派生可能）のか、単に定理を保存する（許容的）だけなのかを判定する必要があります。この区別はカリー・ハワード対応のもとでの証明の計算的内容にも影響します: 派生規則は定義可能な関数に対応しますが、許容規則は直接的な計算的対応物を持たない大域的変換を要求する場合があります。`,
    ],
  },
  formalNotation: [
    "\\text{Derivable: } \\exists\\text{proof tree in }\\mathcal{K}\\text{ from }S_1,\\ldots,S_n\\text{ to }S",
    "\\text{Admissible: } \\vdash_{\\mathcal{K}} S_1,\\ldots,\\vdash_{\\mathcal{K}} S_n \\implies \\vdash_{\\mathcal{K}} S",
  ],
  relatedEntryIds: [
    "concept-cut-elimination",
    "concept-curry-howard",
    "rule-sc-structural",
    "rule-sc-logical",
    "system-classical",
    "system-intuitionistic",
    "system-minimal",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Admissible_rule",
      label: {
        en: "Admissible rule (Wikipedia)",
        ja: "許容規則 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E8%A8%B1%E5%AE%B9%E8%A6%8F%E5%89%87",
      label: {
        en: "Admissible rule (Wikipedia JA)",
        ja: "許容規則 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/admissible+rule",
      label: {
        en: "Admissible rule (nLab)",
        ja: "許容規則 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "admissible",
    "derivable",
    "許容規則",
    "派生規則",
    "許容的",
    "派生可能",
    "admissible rule",
    "derivable rule",
    "cut rule",
    "カット規則",
    "cut elimination",
    "カット除去",
    "structural rule",
    "構造規則",
  ],
  order: 15,
};

const conceptContextSharingIndependence: ReferenceEntry = {
  id: "concept-context-sharing-independence",
  category: "concept",
  title: {
    en: "Context-Sharing vs Context-Independent Rules",
    ja: "構造共有形と構造独立形の規則",
  },
  summary: {
    en: "Two formulations of sequent calculus rules: context-sharing (Gentzen's original) where premises share the same context Γ,Δ, and context-independent (this app's choice) where premises have separate contexts.",
    ja: "シーケント計算の規則の2つの定式化: 前提が同一のコンテキストΓ,Δを共有する構造共有形（Gentzenのオリジナル）と、前提が独立したコンテキストを持つ構造独立形（本アプリの採用形式）。",
  },
  body: {
    en: [
      `<b>Two formulations of inference rules.</b> In sequent calculus, two-premise rules like ($\\to$⇒) can be formulated in two different ways. In the <b>context-sharing</b> form (Gentzen's original), both premises share the same side formulas Γ and Δ. In the <b>context-independent</b> form (used in this application, following bekki), each premise has its own independent context. For ($\\to$⇒), these look like:`,
      `<b>Context-sharing ($\\to$⇒):</b> From Γ ⇒ Δ, $\\varphi$ and $\\psi$, Γ ⇒ Δ, conclude $\\varphi \\to \\psi$, Γ ⇒ Δ. Here the context Γ, Δ is shared between both premises and the conclusion. This is Gentzen's original 1935 formulation.`,
      `<b>Context-independent ($\\to$⇒):</b> From Γ ⇒ Δ, $\\varphi$ and $\\psi$, Γ' ⇒ Δ', conclude $\\varphi \\to \\psi$, Γ, Γ' ⇒ Δ, Δ'. Here each premise has its own context (Γ,Δ and Γ',Δ' respectively), and the conclusion combines them.`,
      `<b>Why this application uses the context-independent form.</b> The context-independent form is adopted here for a specific reason related to the relationship between LK (classical) and LJ (intuitionistic). When LJ is defined by restricting LK's right side to at most one formula, the context-sharing ($\\to$⇒) forces Δ to be empty (since both Δ,$\\varphi$ and Δ must have length ≤ 1). This means the LJ version of ($\\to$⇒) becomes a special case with a different form. Troelstra and Schwichtenberg (2000) address this in their systems G1i and G1m by using a modified rule: from Γ ⇒ $\\varphi$ and $\\psi$, Γ ⇒ $\\chi$, conclude $\\varphi \\to \\psi$, Γ ⇒ $\\chi$ (bekki pp.296–297).`,
      `<b>The problem with the modified rule.</b> While this modified ($\\to$⇒) is a derivable rule in LK, it is not the same as LK's ($\\to$⇒) restricted to single-conclusion sequents. Consequently, a proof in G1i is not automatically a proof in G1c (the classical system), making the relationship between intuitionistic and classical provability less transparent.`,
      `<b>Trade-off.</b> The context-independent form avoids these issues: the LJ version of ($\\to$⇒) is simply the LK version with single-formula right sides, so any LJ proof is automatically an LK proof. However, it introduces an asymmetry — while all other logical rules in this application's LK use the context-sharing form, ($\\to$⇒) alone uses the context-independent form (bekki p.297). The choice reflects a deliberate design decision prioritizing the clean subsystem relationship LM ⊂ LJ ⊂ LK.`,
      `<b>Connection to weakening and contraction.</b> The context-sharing and context-independent forms are interderivable in the presence of weakening and contraction. Context-sharing can simulate context-independence by weakening both premises to have a common context; conversely, context-independence can simulate context-sharing by using the same context Γ in both premises (setting Γ' = Γ and Δ' = Δ). This means the two formulations yield the same set of provable sequents.`,
    ],
    ja: [
      `<b>推論規則の2つの定式化。</b> シーケント計算において、($\\to$⇒) のような2前提規則には2通りの定式化があります。<b>構造共有形</b>（Gentzenのオリジナル）では両前提が同一の副論理式列 Γ, Δ を共有します。<b>構造独立形</b>（本アプリケーションが戸次に従い採用する形式）では各前提が独立したコンテキストを持ちます。($\\to$⇒) の場合、以下のようになります:`,
      `<b>構造共有形 ($\\to$⇒):</b> Γ ⇒ Δ, $\\varphi$ と $\\psi$, Γ ⇒ Δ から $\\varphi \\to \\psi$, Γ ⇒ Δ を得る。ここでコンテキスト Γ, Δ は両前提と結論で共有されます。これが Gentzen (1935) のオリジナルの定式化です。`,
      `<b>構造独立形 ($\\to$⇒):</b> Γ ⇒ Δ, $\\varphi$ と $\\psi$, Γ' ⇒ Δ' から $\\varphi \\to \\psi$, Γ, Γ' ⇒ Δ, Δ' を得る。ここで各前提はそれぞれ独立したコンテキスト (Γ,Δ と Γ',Δ') を持ち、結論でそれらが結合されます。`,
      `<b>本アプリケーションが構造独立形を採用する理由。</b> 構造独立形の採用にはLK（古典論理）とLJ（直観主義論理）の関係に関する具体的な理由があります。LJをLKの右辺を高々1つの論理式に制限して定義する場合、構造共有形の($\\to$⇒)ではΔが空列に限定されます（Δ,$\\varphi$ と Δ の両方が長さ1以下でなければならないため）。このためLJ版の($\\to$⇒)は異なる形式の特殊なものになります。Troelstra and Schwichtenberg (2000) はG1i・G1m体系で修正された規則を使っています: Γ ⇒ $\\varphi$ と $\\psi$, Γ ⇒ $\\chi$ から $\\varphi \\to \\psi$, Γ ⇒ $\\chi$ を導く形式です（戸次 pp.296–297）。`,
      `<b>修正規則の問題点。</b> この修正された ($\\to$⇒) はLKの派生規則ではありますが、単結論シーケントに制限したLKの ($\\to$⇒) とは同一ではありません。その結果、G1i の証明が自動的に G1c（古典体系）の証明にはならず、直観主義と古典論理の証明可能性の関係が不透明になります。`,
      `<b>トレードオフ。</b> 構造独立形はこれらの問題を回避します: LJ版の($\\to$⇒)は単にLK版を右辺1論理式に制限したものになるため、あらゆるLJ証明が自動的にLK証明となります。ただし、非対称性が生じます — 本アプリケーションのLKにおいて、他のすべての論理規則は構造共有形なのに対し、($\\to$⇒) だけが構造独立形です（戸次 p.297）。この選択は、LM ⊂ LJ ⊂ LK という明確な部分体系関係を優先する意図的な設計判断を反映しています。`,
      `<b>弱化・縮約との関係。</b> 構造共有形と構造独立形は、弱化と縮約がある体系では相互に導出可能です。構造共有形は、両前提を弱化して共通のコンテキストを持たせることで構造独立形を模倣でき、逆に構造独立形は同一のコンテキストΓを両前提に使う（Γ' = Γ, Δ' = Δ とする）ことで構造共有形を模倣できます。つまり、2つの定式化は同じ証明可能シーケントの集合を与えます。`,
    ],
  },
  formalNotation: [
    "\\text{Context-sharing: } (\\to\\Rightarrow)\\; \\dfrac{\\Gamma \\Rightarrow \\Delta, \\varphi \\qquad \\psi, \\Gamma \\Rightarrow \\Delta}{\\varphi \\to \\psi, \\Gamma \\Rightarrow \\Delta}",
    "\\text{Context-independent: } (\\to\\Rightarrow)\\; \\dfrac{\\Gamma \\Rightarrow \\Delta, \\varphi \\qquad \\psi, \\Gamma' \\Rightarrow \\Delta'}{\\varphi \\to \\psi, \\Gamma, \\Gamma' \\Rightarrow \\Delta, \\Delta'}",
  ],
  relatedEntryIds: [
    "rule-sc-overview",
    "rule-sc-structural",
    "rule-sc-logical",
    "concept-admissible-derivable",
    "system-classical",
    "system-intuitionistic",
    "system-minimal",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Sequent_calculus",
      label: {
        en: "Sequent calculus (Wikipedia)",
        ja: "シーケント計算 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%B7%E3%83%BC%E3%82%AF%E3%82%A8%E3%83%B3%E3%83%88%E8%A8%88%E7%AE%97",
      label: {
        en: "Sequent calculus (Wikipedia JA)",
        ja: "シーケント計算 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/sequent+calculus",
      label: {
        en: "Sequent calculus (nLab)",
        ja: "シーケント計算 (nLab)",
      },
      documentLanguage: "en",
    },
    {
      type: "other",
      url: "https://www.cambridge.org/core/books/basic-proof-theory/51CA760BC24E2B4C3FC1E7072961AE49",
      label: {
        en: "Troelstra & Schwichtenberg: Basic Proof Theory",
        ja: "Troelstra & Schwichtenberg: Basic Proof Theory",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "context-sharing",
    "context-independent",
    "構造共有形",
    "構造独立形",
    "implication left",
    "→⇒",
    "Gentzen",
    "G1c",
    "G1i",
    "G1m",
    "LK",
    "LJ",
    "Troelstra",
    "Schwichtenberg",
  ],
  order: 16,
};

const conceptPredicateSemantics: ReferenceEntry = {
  id: "concept-predicate-semantics",
  category: "concept",
  title: {
    en: "Structure and Interpretation in Predicate Logic",
    ja: "述語論理の構造と解釈",
  },
  summary: {
    en: "A structure M = (D_M, F_M) provides a domain and interpretation for non-logical symbols; together with an assignment g, it determines the truth value of every formula.",
    ja: "構造 M = (D_M, F_M) は領域と非論理記号の解釈を与え、割り当て g と合わせて、すべての論理式の真理値を決定する。",
  },
  body: {
    en: [
      `<b>From propositional to predicate semantics.</b> In propositional logic, a truth-value assignment to propositional variables suffices to determine the truth value of any formula. In predicate logic, the situation is richer: formulas speak about objects in a domain, and their truth depends on which objects the domain contains and how names, functions, and predicates are interpreted. The semantic framework requires two components: a <b>structure</b> M providing the "world" being described, and a variable <b>assignment</b> g specifying which objects the variables denote (bekki Ch.5, Section 5.3).`,
      `<b>Structure: domain and interpretation.</b> A structure M = (D_M, F_M) consists of a non-empty set D_M called the <b>domain</b> (or universe) and an <b>interpretation function</b> F_M (bekki Definition 5.43). The domain D_M is the collection of <b>entities</b> that the formulas talk about — for example, the natural numbers N, the real numbers R, or any non-empty set. The interpretation function F_M maps each non-logical symbol to a mathematical object: each name (constant) α maps to an element F_M(α) ∈ D_M; each n-ary function symbol o maps to a function F_M(o): D_M^n $\\to$ D_M; and each n-ary predicate symbol θ maps to a truth-function F_M(θ): D_M^n $\\to$ D_t (where D_t = {0, 1}).`,
      `<b>Variable assignment.</b> An assignment g is a function from the set of variables to D_M (bekki Section 5.3.4). Given a structure M and assignment g, the pair (M, g) is called an <b>interpretation</b>. Since predicate logic formulas may contain free variables, the assignment is needed to specify what those variables denote. For a variable ξ, g(ξ) ∈ D_M. An important operation is the <b>ξ-variant</b> g[ξ ↦ a] that agrees with g on all variables except ξ, which it maps to a ∈ D_M (bekki Definition 5.49).`,
      `<b>Denotation of terms.</b> Given an interpretation (M, g), every term τ receives a value ⟦τ⟧_{M,g} ∈ D_M, called its <b>denotation</b> (bekki Definition 5.45). For a name α: ⟦α⟧_{M,g} = F_M(α). For a variable ξ: ⟦ξ⟧_{M,g} = g(ξ). For a function application o(τ₁, …, τₙ): ⟦o(τ₁, …, τₙ)⟧_{M,g} = F_M(o)(⟦τ₁⟧_{M,g}, …, ⟦τₙ⟧_{M,g}). This recursive definition ensures that every term denotes a unique element of D_M.`,
      `<b>Satisfaction of formulas.</b> The truth value ⟦$\\varphi$⟧_{M,g} ∈ {0, 1} of a formula $\\varphi$ under interpretation (M, g) is defined recursively (bekki Definitions 5.46–5.51). For atomic formulas: ⟦θ(τ₁, …, τₙ)⟧_{M,g} = F_M(θ)(⟦τ₁⟧_{M,g}, …, ⟦τₙ⟧_{M,g}). For propositional connectives ($\\lnot , \\land , \\lor , \\to , \\leftrightarrow$), the truth functions are the standard ones from propositional logic (bekki Definition 5.47). The key new cases are the quantifiers: ⟦$\\forall$ξ$\\varphi$⟧_{M,g} = 1 if and only if for every a ∈ D_M, ⟦$\\varphi$⟧_{M,g[ξ↦a]} = 1; and ⟦$\\exists$ξ$\\varphi$⟧_{M,g} = 1 if and only if there exists an a ∈ D_M such that ⟦$\\varphi$⟧_{M,g[ξ↦a]} = 1 (bekki Definition 5.51).`,
      `<b>Examples.</b> Consider a structure where D_M = {mammals}, F(x) means "x is a mammal" and G(x) means "x lays eggs". The formula $\\exists$x(F(x) $\\land$ G(x)) asserts "there exists an egg-laying mammal." Under an assignment mapping x to a platypus, both F(x) and G(x) are true, so the formula is satisfied. In contrast, under D_M = N (natural numbers) with the standard interpretation, $\\forall$x(F(x) $\\to \\exists$xF(x)) is always true regardless of the predicate F, since if F(a) holds for some a, then $\\exists$xF(x) follows (bekki Examples 5.52–5.53).`,
      `<b>Semantic entailment.</b> An interpretation (M, g) <b>satisfies</b> a formula $\\varphi$ (written (M, g) $\\models \\varphi$) if ⟦$\\varphi$⟧_{M,g} = 1. A set Γ <b>semantically entails</b> Δ (written Γ $\\models$ Δ) if every interpretation satisfying all formulas in Γ also satisfies at least one formula in Δ (bekki Definition 5.66). A formula $\\varphi$ is a <b>tautology</b> (or logically valid) if $\\models \\varphi$, meaning it is true under every interpretation. These semantic notions are the predicate-logic analogues of propositional tautology and entailment, and they are connected to the proof-theoretic notions ($\\vdash$) by the soundness and completeness theorems.`,
    ],
    ja: [
      `<b>命題論理から述語論理の意味論へ。</b> 命題論理では、命題変数への真理値割当だけで任意の論理式の真理値が決まります。述語論理では状況がより豊かです: 論理式は領域内の対象について述べ、その真理値は領域がどのような対象を含み、名前・関数・述語がどう解釈されるかに依存します。意味論的枠組みには2つの要素が必要です: 記述される「世界」を提供する<b>構造</b> M と、変数がどの対象を指示するかを指定する変数<b>割り当て</b> g です（戸次 Ch.5, 5.3節）。`,
      `<b>構造: 領域と対応付け。</b> 構造 M = (D_M, F_M) は、<b>領域</b>（または存在物の集合）と呼ばれる空でない集合 D_M と<b>対応付け</b> F_M からなります（戸次 定義5.43）。領域 D_M は論理式が語る<b>存在物</b>の集まりです — 例えば、自然数 N、実数 R、または任意の空でない集合です。対応付け F_M は各非論理記号を数学的対象に写します: 各名前（定数）α は要素 F_M(α) ∈ D_M に、各 n 項演算子 o は関数 F_M(o): D_M^n $\\to$ D_M に、各 n 項述語 θ は真理関数 F_M(θ): D_M^n $\\to$ D_t（ただし D_t = {0, 1}）に写されます。`,
      `<b>変数の割り当て。</b> 割り当て g は変数の集合から D_M への関数です（戸次 5.3.4節）。構造 M と割り当て g の対 (M, g) を<b>解釈</b>と呼びます。述語論理の論理式は自由変数を含みうるため、それらの変数が何を指示するかを指定する割り当てが必要です。変数 ξ に対して g(ξ) ∈ D_M です。重要な操作として、ξ 以外のすべての変数で g と一致し、ξ を a ∈ D_M に写す<b>ξ変異</b> g[ξ ↦ a] があります（戸次 定義5.49）。`,
      `<b>項の指示対象。</b> 解釈 (M, g) のもとで、すべての項 τ は値 ⟦τ⟧_{M,g} ∈ D_M を受け取ります。これを<b>指示対象</b>（denotation）と呼びます（戸次 定義5.45）。名前 α の場合: ⟦α⟧_{M,g} = F_M(α)。変数 ξ の場合: ⟦ξ⟧_{M,g} = g(ξ)。関数適用 o(τ₁, …, τₙ) の場合: ⟦o(τ₁, …, τₙ)⟧_{M,g} = F_M(o)(⟦τ₁⟧_{M,g}, …, ⟦τₙ⟧_{M,g})。この再帰的定義により、すべての項は D_M の一意な要素を指示します。`,
      `<b>論理式の充足。</b> 解釈 (M, g) のもとでの論理式 $\\varphi$ の真理値 ⟦$\\varphi$⟧_{M,g} ∈ {0, 1} は再帰的に定義されます（戸次 定義5.46–5.51）。基本述語式: ⟦θ(τ₁, …, τₙ)⟧_{M,g} = F_M(θ)(⟦τ₁⟧_{M,g}, …, ⟦τₙ⟧_{M,g})。命題結合子（$\\lnot , \\land , \\lor , \\to , \\leftrightarrow$）の真理関数は命題論理の標準的なものです（戸次 定義5.47）。鍵となる新しい場合は量化子です: ⟦$\\forall$ξ$\\varphi$⟧_{M,g} = 1 $\\iff$ すべての a ∈ D_M について ⟦$\\varphi$⟧_{M,g[ξ↦a]} = 1 であり、⟦$\\exists$ξ$\\varphi$⟧_{M,g} = 1 $\\iff$ ⟦$\\varphi$⟧_{M,g[ξ↦a]} = 1 となる a ∈ D_M が存在する（戸次 定義5.51）。`,
      `<b>例。</b> D_M = {哺乳類}、F(x) が「xは哺乳類である」、G(x) が「xは卵生である」という構造を考えます。論理式 $\\exists$x(F(x) $\\land$ G(x)) は「卵を産む哺乳類が存在する」と主張します。x にカモノハシを割り当てると F(x) も G(x) も真になるので、この論理式は充足されます。一方、D_M = N（自然数）で標準的な解釈のもとでは、$\\forall$x(F(x) $\\to \\exists$xF(x)) は述語 F によらず常に真です。ある a に対して F(a) が成り立てば $\\exists$xF(x) が従うからです（戸次 例5.52–5.53）。`,
      `<b>意味論的含意。</b> 解釈 (M, g) が論理式 $\\varphi$ を<b>充足する</b>（(M, g) $\\models \\varphi$ と書く）とは ⟦$\\varphi$⟧_{M,g} = 1 のことです。集合 Γ が Δ を<b>意味論的に含意する</b>（Γ $\\models$ Δ と書く）とは、Γ のすべての論理式を充足するすべての解釈が Δ の少なくとも1つの論理式も充足することです（戸次 定義5.66）。論理式 $\\varphi$ が<b>恒真</b>（論理的に妥当）であるとは $\\models \\varphi$ のこと、すなわちすべての解釈のもとで真であることです。これらの意味論的概念は命題論理のトートロジーや含意の述語論理版であり、健全性定理と完全性定理によって証明論的概念（$\\vdash$）と結びつけられます。`,
    ],
  },
  formalNotation: [
    "M = (D_M, F_M)",
    "\\llbracket \\tau \\rrbracket_{M,g} \\in D_M",
    "\\llbracket \\forall \\xi \\, \\varphi \\rrbracket_{M,g} = 1 \\;\\Longleftrightarrow\\; \\text{for all } a \\in D_M,\\; \\llbracket \\varphi \\rrbracket_{M,g[\\xi \\mapsto a]} = 1",
  ],
  relatedEntryIds: [
    "concept-soundness",
    "concept-completeness",
    "concept-semantic-validity",
    "concept-lowenheim-skolem",
    "concept-compactness",
    "system-predicate",
    "notation-quantifiers",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Interpretation_(logic)",
      label: {
        en: "Interpretation (Wikipedia)",
        ja: "解釈 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E8%A7%A3%E9%87%88_(%E8%AB%96%E7%90%86%E5%AD%A6)",
      label: {
        en: "Interpretation (Wikipedia JA)",
        ja: "解釈 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Structure_(mathematical_logic)",
      label: {
        en: "Structure (Wikipedia)",
        ja: "構造 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/first-order+theory#semantics",
      label: {
        en: "First-order theory: semantics (nLab)",
        ja: "一階理論: 意味論 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "structure",
    "構造",
    "interpretation",
    "解釈",
    "domain",
    "領域",
    "assignment",
    "割り当て",
    "denotation",
    "指示対象",
    "satisfaction",
    "充足",
    "semantics",
    "意味論",
    "model",
    "モデル",
    "truth value",
    "真理値",
    "variable assignment",
    "変数割り当て",
    "predicate logic",
    "述語論理",
    "quantifier",
    "量化子",
    "semantic entailment",
    "意味論的含意",
  ],
  order: 17,
};

const conceptSemanticValidity: ReferenceEntry = {
  id: "concept-semantic-validity",
  category: "concept",
  title: {
    en: "Semantic Validity, Satisfiability, and Contradiction",
    ja: "意味論的妥当性・充足可能性・矛盾",
  },
  summary: {
    en: "A formula is valid ($\\models \\varphi$) if true under all interpretations, satisfiable if true under some, and a contradiction if true under none. These semantic notions are connected to provability ($\\vdash$) by soundness and completeness.",
    ja: "論理式が妥当（$\\models \\varphi$）であるとはすべての解釈で真、充足可能であるとはある解釈で真、矛盾であるとはどの解釈でも偽であること。これらの意味論的概念は健全性と完全性により証明可能性（$\\vdash$）と結びつく。",
  },
  body: {
    en: [
      `<b>Three fundamental semantic properties.</b> Every formula $\\varphi$ falls into exactly one of three mutually exclusive categories based on its behavior across all possible interpretations: (1) <b>Valid</b> (tautology): $\\varphi$ is true under every interpretation — written $\\models \\varphi$. (2) <b>Satisfiable but not valid</b> (contingent): $\\varphi$ is true under some interpretations and false under others. (3) <b>Unsatisfiable</b> (contradiction): $\\varphi$ is false under every interpretation. A formula is <b>satisfiable</b> if it is true under at least one interpretation, i.e., either valid or contingent. These three categories partition the set of all formulas and provide the semantic classification used throughout mathematical logic (bekki Ch.5, Definition 5.66–5.67).`,
      `<b>Formal definitions.</b> Let (M, g) denote an interpretation (a structure M paired with a variable assignment g). A formula $\\varphi$ is <b>satisfied</b> by (M, g) — written (M, g) $\\models \\varphi$ — if ⟦$\\varphi$⟧_{M,g} = 1. A formula is <b>valid</b> (written $\\models \\varphi$) if for all interpretations (M, g), (M, g) $\\models \\varphi$. A formula is <b>satisfiable</b> if there exists an interpretation (M, g) such that (M, g) $\\models \\varphi$. A formula is <b>unsatisfiable</b> (a contradiction) if no interpretation satisfies it. For propositional logic, interpretations are truth-value assignments; for predicate logic, they include a domain D_M and interpretation function F_M (bekki Definitions 3.48, 5.66).`,
      `<b>Semantic entailment.</b> Beyond classifying individual formulas, the semantic turnstile $\\models$ also captures entailment between sets of formulas: Γ $\\models$ Δ means that every interpretation satisfying all formulas in Γ also satisfies at least one formula in Δ. Important special cases: Γ $\\models \\varphi$ (a single conclusion) means $\\varphi$ is a semantic consequence of Γ — i.e., $\\varphi$ is true whenever all formulas in Γ are true. When Γ = ∅, this reduces to $\\models \\varphi$ (validity). The relationship Γ $\\models$ Δ is purely semantic: it makes no reference to any proof system (bekki Definition 5.66).`,
      `<b>Duality between validity and unsatisfiability.</b> A formula $\\varphi$ is valid ($\\models \\varphi$) if and only if $\\lnot \\varphi$ is unsatisfiable. Equivalently, $\\varphi$ is satisfiable if and only if $\\lnot \\varphi$ is not valid. This duality is fundamental: to show that a formula is valid, it suffices to show that its negation leads to a contradiction (refutation). Tableau methods and resolution exploit this duality directly by attempting to construct a satisfying interpretation for $\\lnot \\varphi$; if no such interpretation exists, $\\varphi$ must be valid.`,
      `<b>Proof-theoretic derivability ($\\vdash$) vs. semantic validity ($\\models$).</b> The syntactic turnstile $\\vdash$ denotes derivability within a formal proof system: Γ $\\vdash$_K $\\varphi$ means "$\\varphi$ is derivable from Γ in system K" using only the axioms and inference rules of K. This is a purely mechanical, finitary notion — a derivation is a finite sequence of rule applications. In contrast, the semantic turnstile $\\models$ quantifies over all (potentially uncountably many) interpretations. The key difference: $\\vdash$ depends on the choice of proof system K; $\\models$ depends only on the logical connectives' meaning. The soundness theorem ($\\vdash$ ⟹ $\\models$) guarantees that provable formulas are valid, and the completeness theorem ($\\models$ ⟹ $\\vdash$) guarantees that valid formulas are provable. Together: Γ $\\vdash$_K Δ $\\iff$ Γ $\\models$ Δ for classical first-order logic (bekki Theorems 13.10, 13.13).`,
      `<b>Propositional vs. predicate logic.</b> In propositional logic, validity is decidable: one can check all 2^n truth-value assignments for n variables. The truth table method provides a complete decision procedure. In predicate logic, however, validity is only semi-decidable (by Church's theorem, 1936): if $\\varphi$ is valid, a proof can eventually be found, but if $\\varphi$ is not valid, no algorithm can always detect this in finite time. This asymmetry makes the completeness theorem all the more remarkable — despite the undecidability of the general validity problem, every valid formula has a finite proof.`,
    ],
    ja: [
      `<b>3つの基本的な意味論的性質。</b> すべての論理式 $\\varphi$ は、可能なすべての解釈に対する振る舞いに基づいて、相互に排他的な3つのカテゴリのちょうど1つに分類されます: (1) <b>妥当</b>（恒真式）: $\\varphi$ がすべての解釈のもとで真 — $\\models \\varphi$ と書きます。(2) <b>充足可能だが妥当でない</b>（偶然的）: $\\varphi$ がある解釈では真、別の解釈では偽。(3) <b>充足不能</b>（矛盾）: $\\varphi$ がすべての解釈のもとで偽。論理式が<b>充足可能</b>であるとは、少なくとも1つの解釈のもとで真であること、すなわち妥当か偶然的かのどちらかです。これら3つのカテゴリはすべての論理式の集合を分割し、数理論理学全体で使用される意味論的分類を提供します（戸次 Ch.5, 定義5.66–5.67）。`,
      `<b>形式的定義。</b> (M, g) を解釈（構造 M と変数割り当て g の対）とします。論理式 $\\varphi$ が (M, g) に<b>充足される</b> — (M, g) $\\models \\varphi$ と書く — とは ⟦$\\varphi$⟧_{M,g} = 1 のことです。論理式が<b>妥当</b>（$\\models \\varphi$ と書く）であるとは、すべての解釈 (M, g) について (M, g) $\\models \\varphi$ が成り立つことです。論理式が<b>充足可能</b>であるとは、(M, g) $\\models \\varphi$ となる解釈 (M, g) が存在することです。論理式が<b>充足不能</b>（矛盾）であるとは、それを充足する解釈が存在しないことです。命題論理では解釈は真理値割当であり、述語論理では領域 D_M と解釈関数 F_M を含みます（戸次 定義3.48, 5.66）。`,
      `<b>意味論的含意。</b> 個々の論理式の分類を超えて、意味論的ターンスタイル $\\models$ は論理式集合間の含意も捉えます: Γ $\\models$ Δ とは、Γ のすべての論理式を充足するすべての解釈が Δ の少なくとも1つの論理式も充足することです。重要な特殊ケース: Γ $\\models \\varphi$（結論が1つ）は $\\varphi$ が Γ の意味論的帰結であること — すなわち Γ のすべての論理式が真であるときは常に $\\varphi$ も真 — を意味します。Γ = ∅ のとき、これは $\\models \\varphi$（妥当性）に帰着します。関係 Γ $\\models$ Δ は純粋に意味論的であり、いかなる証明体系にも言及しません（戸次 定義5.66）。`,
      `<b>妥当性と充足不能性の双対性。</b> 論理式 $\\varphi$ が妥当（$\\models \\varphi$）であることと $\\lnot \\varphi$ が充足不能であることは同値です。同値的に、$\\varphi$ が充足可能であることと $\\lnot \\varphi$ が妥当でないことは同値です。この双対性は基本的です: 論理式が妥当であることを示すには、その否定が矛盾に導くこと（反駁）を示せば十分です。タブロー法や導出原理はこの双対性を直接利用し、$\\lnot \\varphi$ を充足する解釈の構成を試みます; そのような解釈が存在しなければ、$\\varphi$ は妥当でなければなりません。`,
      `<b>証明論的導出可能性（$\\vdash$）と意味論的妥当性（$\\models$）。</b> 構文的ターンスタイル $\\vdash$ は形式的証明体系内での導出可能性を表します: Γ $\\vdash$_K $\\varphi$ は「K の公理と推論規則のみを用いて $\\varphi$ が Γ から導出可能」を意味します。これは純粋に機械的で有限的な概念です — 導出は規則適用の有限列です。対照的に、意味論的ターンスタイル $\\models$ は（潜在的に非可算無限個の）すべての解釈にわたる量化です。主要な違い: $\\vdash$ は証明体系 K の選択に依存し、$\\models$ は論理結合子の意味のみに依存します。健全性定理（$\\vdash$ ⟹ $\\models$）は証明可能な論理式が妥当であることを保証し、完全性定理（$\\models$ ⟹ $\\vdash$）は妥当な論理式が証明可能であることを保証します。合わせると: 古典一階論理では Γ $\\vdash$_K Δ $\\iff$ Γ $\\models$ Δ です（戸次 定理13.10, 13.13）。`,
      `<b>命題論理と述語論理。</b> 命題論理では、妥当性は決定可能です: n 個の変数に対する 2^n 通りの真理値割当をすべて検査できます。真理値表法が完全な決定手続きを提供します。しかし述語論理では、妥当性は半決定可能にすぎません（チャーチの定理, 1936年）: $\\varphi$ が妥当であれば証明はいずれ見つかりますが、$\\varphi$ が妥当でない場合、有限時間でそれを常に検出するアルゴリズムは存在しません。この非対称性は完全性定理をいっそう注目すべきものにします — 一般的な妥当性問題の決定不能性にもかかわらず、すべての妥当な論理式は有限の証明を持つのです。`,
    ],
  },
  formalNotation: [
    "\\vDash \\varphi \\;\\Longleftrightarrow\\; \\text{for all } (M, g),\\; (M,g) \\vDash \\varphi",
    "\\varphi \\text{ satisfiable} \\;\\Longleftrightarrow\\; \\exists (M,g),\\; (M,g) \\vDash \\varphi",
    "\\varphi \\text{ unsatisfiable} \\;\\Longleftrightarrow\\; \\lnot(\\exists (M,g),\\; (M,g) \\vDash \\varphi)",
  ],
  relatedEntryIds: [
    "concept-soundness",
    "concept-completeness",
    "concept-predicate-semantics",
    "concept-cut-elimination",
    "system-classical",
    "notation-connectives",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Validity_(logic)",
      label: {
        en: "Validity (Wikipedia)",
        ja: "妥当性 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E5%A6%A5%E5%BD%93%E6%80%A7",
      label: {
        en: "Validity (Wikipedia JA)",
        ja: "妥当性 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Satisfiability",
      label: {
        en: "Satisfiability (Wikipedia)",
        ja: "充足可能性 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E5%85%85%E8%B6%B3%E5%8F%AF%E8%83%BD%E6%80%A7",
      label: {
        en: "Satisfiability (Wikipedia JA)",
        ja: "充足可能性 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Logical_consequence",
      label: {
        en: "Logical consequence (Wikipedia)",
        ja: "論理的帰結 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/semantics",
      label: {
        en: "Semantics (nLab)",
        ja: "意味論 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "validity",
    "妥当性",
    "valid",
    "妥当",
    "tautology",
    "恒真式",
    "satisfiable",
    "充足可能",
    "satisfiability",
    "充足可能性",
    "unsatisfiable",
    "充足不能",
    "contradiction",
    "矛盾",
    "semantic entailment",
    "意味論的含意",
    "⊨",
    "⊢",
    "turnstile",
    "ターンスタイル",
    "contingent",
    "偶然的",
    "decidable",
    "決定可能",
    "semi-decidable",
    "半決定可能",
    "refutation",
    "反駁",
  ],
  order: 18,
};

const conceptTabLkEquivalence: ReferenceEntry = {
  id: "concept-tab-lk-equivalence",
  category: "concept",
  title: {
    en: "Equivalence of TAB and LK-CUT",
    ja: "TAB と LK-CUT の等価性",
  },
  summary: {
    en: "Tableau-style sequent calculus (TAB) and sequent calculus with cut (LK-CUT) prove exactly the same sequents: TAB ⊆ LK-CUT (Theorem 12.13) and LK-CUT ⊆ TAB (Theorem 12.15).",
    ja: "タブロー式シーケント計算 (TAB) とカット付きシーケント計算 (LK-CUT) はまったく同じシーケントを証明する: TAB ⊆ LK-CUT（定理12.13）および LK-CUT ⊆ TAB（定理12.15）。",
  },
  body: {
    en: [
      `<b>What TAB is.</b> TAB (tableau-style sequent calculus) is a proof system derived from the analytic tableau method, reformulated in the language of sequent calculus. In TAB, sequents have the form Γ ⇒ (with an empty right-hand side), and the basic sequent (axiom) is (BS): $\\lnot \\varphi , \\varphi$, Γ ⇒ — a branch closes when it contains both a formula and its negation. The only structural rule is exchange (e). Logical rules decompose formulas on the left side of the sequent, corresponding to the tableau rules of Chapter 6 (bekki Ch.12.1–12.2, Definitions 12.1–12.3). Unlike Gentzen-style LK, TAB operates purely on the left (antecedent) side.`,
      `<b>Principal and side formulas.</b> Each TAB rule has a <b>principal formula</b> (the formula being decomposed) and zero or more <b>side formulas</b> (the components produced). For example, ($\\land$) decomposes $\\varphi \\land \\psi$ into $\\varphi$ and $\\psi$; ($\\lnot \\land$) decomposes $\\lnot (\\varphi \\land \\psi)$ into two branches with $\\lnot \\varphi$ and $\\lnot \\psi$. The ($\\lnot \\lnot$) rule decomposes $\\lnot \\lnot \\varphi$ into $\\varphi$ (double negation elimination). Rules for quantifiers include ($\\forall$) and ($\\exists$) for positive occurrences, and ($\\lnot \\forall$) and ($\\lnot \\exists$) for negated quantifiers, with appropriate variable conditions (bekki Definition 12.3).`,
      `<b>TAB ⊆ LK-CUT (Theorem 12.13).</b> Every TAB proof can be converted to an LK-CUT proof. The proof works by showing that each TAB rule is <b>admissible</b> in LK-CUT — that is, each TAB rule can be simulated by a combination of LK-CUT rules. For example, the basic sequent (BS): $\\lnot \\varphi , \\varphi$, Γ ⇒ is derivable in LK-CUT using the identity axiom (ID) and structural rules. The TAB rule ($\\land$) corresponds to (⇒$\\land$) combined with cut. The key insight is that TAB's left-side-only decomposition can be faithfully embedded in LK-CUT's richer framework (bekki Ch.12.4, p.278–279).`,
      `<b>LK-CUT ⊆ TAB (Theorem 12.15).</b> Conversely, every LK-CUT proof can be converted to a TAB proof. This direction requires the notion of <b>generalized sequents</b>: Γ ⇒ Δ is defined as $\\lnot$Δ, Γ ⇒ in TAB (where $\\lnot$Δ denotes the negation of each formula in Δ). Each LK-CUT rule — including the identity axiom (ID), structural rules (exchange, weakening, contraction), logical rules, and the cut rule itself — is shown to be admissible in TAB under this translation. The admissibility of weakening (Theorem 12.9) and contraction (Theorem 12.11) in TAB are essential prerequisites (bekki Ch.12.3–12.4, p.280).`,
      `<b>Weakening and contraction in TAB.</b> TAB does not include weakening or contraction as primitive rules, but both are <b>admissible</b> — they can be derived without adding them as rules. Weakening (Theorem 12.9) is shown by induction on proof depth: every TAB+w proof can be transformed into a pure TAB proof by "absorbing" the weakened formula into the proof tree. Contraction (Theorem 12.11) is similarly admissible: duplicate formulas can be eliminated. The substitution lemma (Theorem 12.7) — the TAB analogue of the substitution lemma for LK — is a key ingredient (bekki Ch.12.3).`,
      `<b>Significance: the four-way equivalence.</b> Combined with the equivalence of H (Hilbert systems), N (natural deduction), and L (Gentzen-style sequent calculus) established in earlier chapters, the TAB equivalence gives the full picture: Γ $\\vdash$_LK $\\varphi \\iff$ Γ $\\vdash$_{LK-CUT} $\\varphi \\iff$ Γ $\\vdash$_TAB $\\varphi$. This means that the tableau method — which is the basis for many automated theorem provers — has exactly the same proving power as Hilbert systems, natural deduction, and Gentzen-style sequent calculus. The equivalence is purely about provability; the proof structures are quite different. TAB's advantage lies in its systematic, branching proof search strategy (bekki Ch.13, p.281).`,
    ],
    ja: [
      `<b>TAB とは。</b> TAB（タブロー式シーケント計算）は、分析的タブロー法をシーケント計算の言語で再定式化した証明体系です。TAB ではシーケントは Γ ⇒（右辺が空）の形をとり、基本シーケント（公理）は (BS): $\\lnot \\varphi , \\varphi$, Γ ⇒ — 枝は論理式とその否定の両方を含むときに閉じます。唯一の構造規則は交換 (e) です。論理規則はシーケントの左辺の論理式を分解し、第6章のタブロー規則に対応します（戸次 Ch.12.1–12.2, 定義12.1–12.3）。ゲンツェン流 LK と異なり、TAB は純粋に左辺（前件）側のみで操作します。`,
      `<b>主論理式と副論理式。</b> 各 TAB 規則には<b>主論理式</b>（分解される論理式）と0個以上の<b>副論理式</b>（生成される構成要素）があります。たとえば ($\\land$) は $\\varphi \\land \\psi$ を $\\varphi$ と $\\psi$ に分解し、($\\lnot \\land$) は $\\lnot (\\varphi \\land \\psi)$ を $\\lnot \\varphi$ と $\\lnot \\psi$ の2つの枝に分解します。($\\lnot \\lnot$) 規則は $\\lnot \\lnot \\varphi$ を $\\varphi$ に分解します（二重否定除去）。量化子に対する規則として ($\\forall$) と ($\\exists$)（肯定出現）、($\\lnot \\forall$) と ($\\lnot \\exists$)（否定された量化子）があり、適切な変項条件が付きます（戸次 定義12.3）。`,
      `<b>TAB ⊆ LK-CUT（定理12.13）。</b> すべての TAB の証明は LK-CUT の証明に変換できます。証明は各 TAB 規則が LK-CUT において<b>許容的</b>であること — つまり各 TAB 規則が LK-CUT の規則の組み合わせでシミュレートできること — を示します。たとえば、基本シーケント (BS): $\\lnot \\varphi , \\varphi$, Γ ⇒ は LK-CUT で恒等公理 (ID) と構造規則を用いて導出可能です。TAB 規則 ($\\land$) は (⇒$\\land$) とカットの組み合わせに対応します。鍵となる洞察は、TAB の左辺のみの分解が LK-CUT のより豊かな枠組みに忠実に埋め込めることです（戸次 Ch.12.4, p.278–279）。`,
      `<b>LK-CUT ⊆ TAB（定理12.15）。</b> 逆に、すべての LK-CUT の証明は TAB の証明に変換できます。この方向には<b>一般化シーケント</b>の概念が必要です: Γ ⇒ Δ は TAB では $\\lnot$Δ, Γ ⇒ として定義されます（$\\lnot$Δ は Δ 内の各論理式の否定を表します）。各 LK-CUT 規則 — 恒等公理 (ID)、構造規則（交換、弱化、縮約）、論理規則、カット規則自体 — がこの翻訳のもとで TAB において許容的であることが示されます。TAB における弱化（定理12.9）と縮約（定理12.11）の許容性が本質的な前提条件です（戸次 Ch.12.3–12.4, p.280）。`,
      `<b>TAB における弱化と縮約。</b> TAB は弱化や縮約を原始規則として含みませんが、両方とも<b>許容的</b>です — 規則として追加せずとも導出できます。弱化（定理12.9）は証明の深さに関する帰納法で示されます: すべての TAB+w 証明は、弱化された論理式を証明木に「吸収」することで純粋な TAB 証明に変換できます。縮約（定理12.11）も同様に許容的です: 重複する論理式を除去できます。代入補題（定理12.7）— LK の代入補題の TAB 版 — が重要な道具です（戸次 Ch.12.3）。`,
      `<b>意義: 4体系の等価性。</b> 前章で確立された H（ヒルベルト系）、N（自然演繹）、L（ゲンツェン流シーケント計算）の等価性と合わせると、TAB の等価性により全体像が得られます: Γ $\\vdash$_LK $\\varphi \\iff$ Γ $\\vdash$_{LK-CUT} $\\varphi \\iff$ Γ $\\vdash$_TAB $\\varphi$。これは、多くの自動定理証明器の基礎であるタブロー法が、ヒルベルト系、自然演繹、ゲンツェン流シーケント計算とまったく同じ証明力を持つことを意味します。等価性は純粋に証明可能性に関するものであり、証明の構造はまったく異なります。TAB の利点は体系的な分岐型証明探索戦略にあります（戸次 Ch.13, p.281）。`,
    ],
  },
  formalNotation:
    "\\Gamma \\vdash_{\\text{LK-CUT}} \\varphi \\;\\Longleftrightarrow\\; \\Gamma \\vdash_{\\text{TAB}} \\varphi",
  relatedEntryIds: [
    "concept-system-equivalence",
    "concept-cut-elimination",
    "concept-admissible-derivable",
    "rule-sc-overview",
    "rule-sc-structural",
    "rule-sc-logical",
    "concept-soundness",
    "concept-completeness",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Method_of_analytic_tableaux",
      label: {
        en: "Analytic tableaux (Wikipedia)",
        ja: "分析的タブロー (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%BF%E3%83%96%E3%83%AD%E3%83%BC",
      label: {
        en: "Tableau (Wikipedia JA)",
        ja: "タブロー (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/tableau+calculus",
      label: {
        en: "Tableau calculus (nLab)",
        ja: "タブロー計算 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "TAB",
    "タブロー",
    "tableau",
    "LK-CUT",
    "equivalence",
    "等価性",
    "sequent calculus",
    "シーケント計算",
    "basic sequent",
    "基本シーケント",
    "weakening",
    "弱化",
    "contraction",
    "縮約",
    "admissible",
    "許容規則",
    "Theorem 12.13",
    "Theorem 12.15",
    "定理12.13",
    "定理12.15",
  ],
  order: 19,
};

const conceptConsistencyFromCutElimination: ReferenceEntry = {
  id: "concept-consistency-from-cut-elimination",
  category: "concept",
  title: {
    en: "Consistency from Cut Elimination",
    ja: "カット除去による無矛盾性証明",
  },
  summary: {
    en: "Cut elimination implies that $\\bot$ is not provable in LK, LJ, or LM — the systems are consistent. This elegant argument also extends to all equivalent Hilbert and natural deduction systems.",
    ja: "カット除去定理から、LK・LJ・LM で $\\bot$ は証明不能であること（無矛盾性）が導かれる。この簡明な議論は等価なヒルベルト体系・自然演繹体系にも拡張される。",
  },
  body: {
    en: [
      `<b>The consistency theorem.</b> One of the most profound corollaries of the cut elimination theorem is the <b>consistency</b> (inconsistency-freeness) of the sequent calculi: the sequent ⇒ $\\bot$ is not provable in LK, LJ, or LM (bekki Theorem 11.5). Consistency means that there is no proof of $\\bot$ from the empty set of assumptions — the system cannot derive a contradiction. This result, first established by Gentzen, provided the first purely syntactic proof of the consistency of classical and intuitionistic logic, without relying on any semantic (model-theoretic) argument.`,
      `<b>The proof argument.</b> The proof is remarkably elegant and proceeds by contradiction. Suppose $\\bot$ were provable, i.e., the sequent ⇒ $\\bot$ had a proof in K (= K-CUT + CUT). By the cut elimination theorem, there would then exist a CUT-free proof of ⇒ $\\bot$. Now examine the last rule applied in this CUT-free proof. The sequent ⇒ $\\bot$ has an empty antecedent and $\\bot$ as the sole succedent. However, <b>no CUT-free inference rule in the sequent calculus can produce such a sequent as its conclusion</b>: structural rules require the principal formula to already appear, and logical rules introduce compound formulas (not $\\bot$) in the succedent. Since no rule can derive ⇒ $\\bot$ without CUT, we reach a contradiction, and therefore $\\bot$ is not provable. The same argument works for LJ (where the succedent has at most one formula) by the same structural analysis (bekki Theorem 11.5).`,
      `<b>Extension to equivalent systems.</b> Since LK, LJ, and LM are equivalent to the corresponding Hilbert systems (HK, HJ, HM) and natural deduction systems (NK, NJ, NM) — as established by the system equivalence theorems (bekki Chapter 9, Chapter 10) — the consistency result extends to all these systems. That is, ⊬_HK $\\bot$, ⊬_NK $\\bot$, ⊬_HJ $\\bot$, ⊬_NJ $\\bot$, ⊬_HM $\\bot$, and ⊬_NM $\\bot$. The argument proceeds: if $\\bot$ were provable in any of these systems, by equivalence it would be provable in the corresponding sequent calculus, contradicting the consistency of the sequent calculus. Thus, all the formal proof systems introduced for propositional and predicate logic are consistent.`,
      `<b>Why this matters.</b> The consistency proof via cut elimination is significant for several reasons. First, it is a <b>purely syntactic (proof-theoretic) argument</b> — it does not rely on constructing a model or appeal to set-theoretic semantics. This makes it constructive and finitistic in nature, aligning with Hilbert's program for foundational mathematics. Second, it demonstrates the power of cut elimination as a meta-theorem: by analyzing the structure of CUT-free proofs, we can derive strong consequences about what can and cannot be proved. Third, it provides the foundation for further independence results, such as showing that DNE (double negation elimination) is not provable in intuitionistic logic (bekki Theorem 11.9).`,
      `<b>The sub-formula property.</b> The key insight that makes the consistency proof work is the <b>sub-formula property</b> of CUT-free proofs: in a CUT-free proof, every formula appearing in the proof is a sub-formula of some formula in the end-sequent. Since $\\bot$ is atomic and the end-sequent is ⇒ $\\bot$, the only formulas that can appear in the proof are $\\bot$ itself. This severely constrains the structure of any hypothetical CUT-free proof of ⇒ $\\bot$, ultimately leading to the contradiction. The sub-formula property is what distinguishes CUT-free proofs from proofs with CUT, where the cut formula can be arbitrarily complex (a "lemma" that gets eliminated).`,
      `<b>Historical context.</b> Gentzen's original motivation for developing the sequent calculus and proving the cut elimination theorem was precisely to establish consistency results. His 1934 paper "Untersuchungen über das logische Schließen" (Investigations into Logical Reasoning) introduced both the natural deduction and sequent calculus systems, with the Hauptsatz (cut elimination) as the central technical achievement. Gentzen later extended these ideas to prove the consistency of Peano Arithmetic using transfinite induction up to ε₀, a landmark result in proof theory that demonstrated both the power and the limits of Hilbert's program.`,
    ],
    ja: [
      `<b>無矛盾性定理。</b> カット除去定理の最も深い系の一つが、シーケント計算の<b>無矛盾性</b>（矛盾の導出不可能性）です。すなわち、シーケント ⇒ $\\bot$ は LK・LJ・LM のいずれでも証明不能です（戸次 定理11.5）。無矛盾性とは、空の仮定集合から $\\bot$ の証明が存在しないこと — つまり体系が矛盾を導出できないことを意味します。ゲンツェンによって最初に確立されたこの結果は、意味論的（モデル論的）な議論に頼ることなく、古典論理と直観主義論理の無矛盾性を純粋に構文論的に証明した初めてのものです。`,
      `<b>証明の議論。</b> 証明は驚くほど簡明で、背理法によって進みます。$\\bot$ が証明可能だと仮定すると、シーケント ⇒ $\\bot$ の証明が K（= K-CUT + CUT）に存在します。カット除去定理により、⇒ $\\bot$ のカットなし証明が存在するはずです。このカットなし証明の最後に適用される規則を調べます。⇒ $\\bot$ は前件が空で、$\\bot$ のみを後件に持ちます。しかし、<b>シーケント計算のカットなし推論規則でこのようなシーケントを結論として導けるものは存在しません</b>: 構造規則は主論理式が既に出現していることを要求し、論理規則は後件に（$\\bot$ではなく）複合論理式を導入します。カットなしで ⇒ $\\bot$ を導出する規則がないため矛盾に到達し、したがって $\\bot$ は証明不能です。LJ（後件が高々1つの論理式）についても同様の構造分析で同じ議論が成り立ちます（戸次 定理11.5）。`,
      `<b>等価体系への拡張。</b> LK・LJ・LM は対応するヒルベルト体系（HK・HJ・HM）および自然演繹体系（NK・NJ・NM）と等価であるため — 体系等価性定理（戸次 第9章・第10章）で確立 — 無矛盾性の結果はこれらすべての体系に拡張されます。すなわち、⊬_HK $\\bot$, ⊬_NK $\\bot$, ⊬_HJ $\\bot$, ⊬_NJ $\\bot$, ⊬_HM $\\bot$, ⊬_NM $\\bot$ です。議論は次の通りです: もしこれらの体系のいずれかで $\\bot$ が証明可能なら、等価性により対応するシーケント計算でも証明可能となり、シーケント計算の無矛盾性に矛盾します。このようにして、命題論理・述語論理に導入されたすべての形式証明体系が無矛盾であることが示されます。`,
      `<b>なぜこれが重要か。</b> カット除去による無矛盾性証明は、いくつかの理由で重要です。第一に、これは<b>純粋に構文論的（証明論的）な議論</b>であり、モデルの構成や集合論的意味論に訴えません。これは構成的かつ有限主義的な性格を持ち、ヒルベルトの数学基礎付けプログラムと合致します。第二に、メタ定理としてのカット除去の威力を示します: カットなし証明の構造を分析することで、何が証明できて何が証明できないかについて強い帰結を導けます。第三に、さらなる独立性の結果 — たとえば DNE（二重否定除去）が直観主義論理で証明不能であること（戸次 定理11.9）— の基礎を提供します。`,
      `<b>部分論理式性。</b> 無矛盾性証明が成功する鍵は、カットなし証明の<b>部分論理式性</b>にあります: カットなし証明において、証明に出現するすべての論理式は終シーケントのいずれかの論理式の部分論理式です。$\\bot$ は原子論理式であり終シーケントは ⇒ $\\bot$ なので、証明に出現しうる論理式は $\\bot$ 自身のみです。これはシーケント ⇒ $\\bot$ の仮想的なカットなし証明の構造を厳しく制約し、最終的に矛盾に導きます。部分論理式性こそが、カットなし証明とカットを含む証明を区別するものです — カット論理式は任意に複雑な（除去される「補題」としての）論理式でありえます。`,
      `<b>歴史的文脈。</b> ゲンツェンがシーケント計算を開発しカット除去定理を証明した本来の動機は、まさに無矛盾性の結果を確立することでした。1934年の論文「論理的推論の探究 (Untersuchungen über das logische Schließen)」で自然演繹とシーケント計算の両体系を導入し、基本定理（カット除去）を中心的な技術的成果としました。ゲンツェンはのちにこれらの考えを拡張して、ε₀ までの超限帰納法を用いたペアノ算術の無矛盾性を証明しました。これは証明論における画期的な成果であり、ヒルベルトのプログラムの力と限界の両方を示すものでした。`,
    ],
  },
  formalNotation:
    "\\text{Cut Elimination} \\;\\Longrightarrow\\; \\nvdash_{\\mathsf{LK}} \\bot \\;\\land\\; \\nvdash_{\\mathsf{LJ}} \\bot \\;\\land\\; \\nvdash_{\\mathsf{LM}} \\bot",
  relatedEntryIds: [
    "concept-cut-elimination",
    "concept-system-equivalence",
    "concept-soundness",
    "concept-completeness",
    "concept-admissible-derivable",
    "concept-glivenko",
    "rule-sc-overview",
    "rule-sc-structural",
    "rule-sc-logical",
    "concept-axiom-independence",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Consistency",
      label: {
        en: "Consistency (Wikipedia)",
        ja: "無矛盾性 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E7%84%A1%E7%9F%9B%E7%9B%BE%E6%80%A7",
      label: {
        en: "Consistency (Wikipedia JA)",
        ja: "無矛盾性 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/consistency",
      label: {
        en: "Consistency (nLab)",
        ja: "無矛盾性 (nLab)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Gentzen%27s_consistency_proof",
      label: {
        en: "Gentzen's consistency proof (Wikipedia)",
        ja: "ゲンツェンの無矛盾性証明 (Wikipedia)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "consistency",
    "無矛盾性",
    "inconsistency",
    "矛盾",
    "bottom",
    "falsum",
    "⊥",
    "cut elimination",
    "カット除去",
    "Gentzen",
    "ゲンツェン",
    "sub-formula property",
    "部分論理式性",
    "Theorem 11.5",
    "定理11.5",
    "Hilbert's program",
    "ヒルベルトのプログラム",
  ],
  order: 20,
};

const conceptAxiomIndependence: ReferenceEntry = {
  id: "concept-axiom-independence",
  category: "concept",
  title: {
    en: "Independence of Classical Axioms",
    ja: "古典論理固有の公理の独立性",
  },
  summary: {
    en: "DNE ($\\lnot \\lnot \\varphi \\to \\varphi$) and LEM ($\\varphi \\lor \\lnot \\varphi$) are not provable in intuitionistic logic LJ. This separation between classical and intuitionistic logic is a consequence of the cut elimination theorem.",
    ja: "DNE（$\\lnot \\lnot \\varphi \\to \\varphi$）と LEM（$\\varphi \\lor \\lnot \\varphi$）は直観主義論理 LJ で証明不能である。古典論理と直観主義論理のこの分離は、カット除去定理の帰結である。",
  },
  body: {
    en: [
      `<b>The independence results.</b> One of the most important applications of the cut elimination theorem is the proof that <b>DNE (double negation elimination: $\\lnot \\lnot \\varphi \\to \\varphi$)</b> and <b>LEM (law of excluded middle: $\\varphi \\lor \\lnot \\varphi$)</b> are independent from intuitionistic logic. Specifically, $\\lnot \\lnot \\varphi$ is not provable from $\\varphi$ in LJ (bekki Theorem 11.9), and $\\varphi \\lor \\lnot \\varphi$ is not provable in LJ (bekki Theorem 11.8). Since LJ ⊂ LK (intuitionistic logic is a subsystem of classical logic), these results demonstrate that the inclusion is strict: there are classically valid formulas that are not intuitionistically provable. This separation is fundamental to the philosophy and practice of constructive mathematics.`,
      `<b>Structural analysis of LJ-CUT proofs.</b> The key lemma underlying the independence proofs is a structural characterization of LJ-CUT provable sequents (bekki Lemma 11.6): every sequent S provable in LJ satisfies at least one of: (1) both sides of S are non-empty, or (2) at least one side contains a compound formula or a quantified formula. This follows from the cut elimination theorem: if S is LJ-provable, then by cut elimination there is an LJ-CUT proof, and one can verify that every LJ axiom and every LJ inference rule (without CUT) preserves this structural property. In particular, the initial sequent $\\varphi$ ⇒ $\\varphi$ has non-empty sides, and every logical rule introduces a compound formula.`,
      `<b>Unprovability of LEM.</b> From the structural lemma, it follows that the sequents ⇒ $\\varphi$ and $\\varphi$ ⇒ are not provable in LJ for any propositional variable $\\varphi$ (bekki Corollary 11.7). In particular, the sequent ⇒ $\\varphi \\lor \\lnot \\varphi$, when instantiated with a propositional variable, has an empty antecedent and a single compound formula in the succedent. If $\\varphi \\lor \\lnot \\varphi$ were LJ-provable, then ⇒ $\\varphi \\lor \\lnot \\varphi$ would have a CUT-free proof 𝒟. By the structural lemma, 𝒟 must satisfy condition (2), meaning one side must contain a compound formula. But tracing the proof backward, one reaches sequents that violate both conditions (1) and (2), yielding a contradiction (bekki Theorem 11.8).`,
      `<b>Unprovability of DNE.</b> The independence of DNE from LJ (bekki Theorem 11.9) follows from the independence of LEM. LEM ($\\varphi \\lor \\lnot \\varphi$) is a theorem of LK, and LJ+DNE = LK (since adding double negation elimination to intuitionistic logic yields classical logic, bekki Theorem 10.52). If DNE were provable in LJ, then LJ would equal LK, and LEM would be an LJ theorem — contradicting the result that LEM is independent from LJ. Therefore DNE is not an LJ theorem: $\\lnot \\lnot \\varphi$ ⊬_LJ $\\varphi$.`,
      `<b>Significance for constructive mathematics.</b> The separation between classical and intuitionistic logic has profound implications for the foundations of mathematics. In constructive mathematics (following Brouwer, Heyting, and Bishop), proofs must provide explicit constructions or witnesses — mere non-existence of a counterexample ($\\lnot \\lnot \\varphi$) does not suffice to establish existence ($\\varphi$). The unprovability of DNE in LJ formalizes this philosophical stance: intuitionistic logic does not permit the inference from "it is impossible that $\\varphi$ is false" to "$\\varphi$ is true." Similarly, LEM's independence means that every intuitionistic proof of a disjunction $\\varphi \\lor \\psi$ must effectively determine which disjunct holds — a property known as the <b>disjunction property</b>.`,
      `<b>The method: sub-formula property.</b> The proofs of these independence results all rely on the <b>sub-formula property</b> of CUT-free proofs: in a CUT-free proof, every formula is a sub-formula of some formula in the end-sequent. This property constrains what CUT-free proofs can look like, enabling the structural analysis that yields the independence results. Without cut elimination, such fine structural arguments would not be possible — proofs with CUT can contain arbitrary formulas as "lemmas," making structural analysis intractable. This illustrates why the cut elimination theorem is such a powerful tool in proof theory.`,
    ],
    ja: [
      `<b>独立性の結果。</b> カット除去定理の最も重要な応用の一つが、<b>DNE（二重否定除去: $\\lnot \\lnot \\varphi \\to \\varphi$）</b>と<b>LEM（排中律: $\\varphi \\lor \\lnot \\varphi$）</b>が直観主義論理から独立であることの証明です。具体的には、$\\lnot \\lnot \\varphi$ から $\\varphi$ は LJ で証明不能であり（戸次 定理11.9）、$\\varphi \\lor \\lnot \\varphi$ は LJ で証明不能です（戸次 定理11.8）。LJ ⊂ LK（直観主義論理は古典論理の部分体系）であるため、これらの結果は包含が真であることを示します: 古典論理で妥当な論理式のうち、直観主義的に証明不能なものが存在します。この分離は構成的数学の哲学と実践にとって根本的です。`,
      `<b>LJ-CUT 証明の構造分析。</b> 独立性証明の鍵となる補題は、LJ-CUT で証明可能なシーケントの構造的特徴付けです（戸次 補題11.6）: LJ で証明可能なすべてのシーケント S は、次の少なくとも一方を満たします: (1) S の両辺がいずれも空ではない、(2) 右辺か左辺の少なくとも一方に複合論理式または量化論理式を含む。これはカット除去定理から従います: S が LJ で証明可能なら、カット除去により LJ-CUT 証明が存在し、LJ の公理と（カットなしの）LJ の推論規則がすべてこの構造的性質を保つことが検証できます。特に、初期シーケント $\\varphi$ ⇒ $\\varphi$ は両辺が非空であり、すべての論理規則は複合論理式を導入します。`,
      `<b>LEM の証明不能性。</b> 構造補題から、任意の命題変数 $\\varphi$ について、シーケント ⇒ $\\varphi$ と $\\varphi$ ⇒ は LJ で証明不能であることが従います（戸次 系11.7）。特に、命題変数を代入したシーケント ⇒ $\\varphi \\lor \\lnot \\varphi$ は前件が空で後件に単一の複合論理式を持ちます。もし $\\varphi \\lor \\lnot \\varphi$ が LJ で証明可能なら、⇒ $\\varphi \\lor \\lnot \\varphi$ のカットなし証明 𝒟 が存在するはずです。構造補題により、𝒟 は条件 (2) を満たす必要があり、一方の辺に複合論理式を含むはずです。しかし証明を遡ると、条件 (1) と (2) の両方に違反するシーケントに到達し、矛盾が生じます（戸次 定理11.8）。`,
      `<b>DNE の証明不能性。</b> LJ からの DNE の独立性（戸次 定理11.9）は、LEM の独立性から従います。LEM（$\\varphi \\lor \\lnot \\varphi$）は LK の定理であり、LJ+DNE = LK です（直観主義論理に二重否定除去を追加すると古典論理が得られる、戸次 定理10.52）。もし DNE が LJ で証明可能なら、LJ = LK となり、LEM は LJ の定理になります — しかしこれは LEM が LJ から独立であるという結果と矛盾します。したがって DNE は LJ の定理ではありません: $\\lnot \\lnot \\varphi$ ⊬_LJ $\\varphi$。`,
      `<b>構成的数学にとっての意義。</b> 古典論理と直観主義論理の分離は、数学の基礎に深い含意を持ちます。構成的数学（ブラウワー、ハイティング、ビショップに従い）では、証明は明示的な構成や証拠を提供しなければなりません — 反例の非存在（$\\lnot \\lnot \\varphi$）だけでは存在（$\\varphi$）を確立するには不十分です。LJ における DNE の証明不能性はこの哲学的立場を形式化します: 直観主義論理では「$\\varphi$ が偽であることは不可能」から「$\\varphi$ は真」への推論を許しません。同様に、LEM の独立性は、選言 $\\varphi \\lor \\psi$ の直観主義的証明はどちらの選言肢が成り立つかを実効的に決定しなければならないことを意味します — これは<b>選言性 (disjunction property)</b> として知られる性質です。`,
      `<b>方法: 部分論理式性。</b> これらの独立性の結果の証明はすべて、カットなし証明の<b>部分論理式性</b>に依拠しています: カットなし証明において、すべての論理式は終シーケントのいずれかの論理式の部分論理式です。この性質はカットなし証明の形を制約し、独立性の結果をもたらす構造分析を可能にします。カット除去なしでは、このような精密な構造的議論は不可能です — カットを含む証明は「補題」として任意の論理式を含みうるため、構造分析が困難になります。これは、カット除去定理がなぜ証明論においてかくも強力な道具であるかを示しています。`,
    ],
  },
  formalNotation:
    "\\lnot\\lnot\\varphi \\nvdash_{\\mathsf{LJ}} \\varphi \\quad\\quad \\nvdash_{\\mathsf{LJ}} \\varphi \\lor \\lnot\\varphi",
  relatedEntryIds: [
    "concept-cut-elimination",
    "concept-consistency-from-cut-elimination",
    "concept-system-equivalence",
    "concept-glivenko",
    "axiom-dne",
    "system-intuitionistic",
    "system-classical",
    "concept-admissible-derivable",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Intuitionistic_logic",
      label: {
        en: "Intuitionistic logic (Wikipedia)",
        ja: "直観主義論理 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E7%9B%B4%E8%A6%B3%E4%B8%BB%E7%BE%A9%E8%AB%96%E7%90%86",
      label: {
        en: "Intuitionistic logic (Wikipedia JA)",
        ja: "直観主義論理 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Double_negation#Double_negation_elimination",
      label: {
        en: "Double negation elimination (Wikipedia)",
        ja: "二重否定除去 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Law_of_excluded_middle",
      label: {
        en: "Law of excluded middle (Wikipedia)",
        ja: "排中律 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/excluded+middle",
      label: {
        en: "Excluded middle (nLab)",
        ja: "排中律 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "independence",
    "独立性",
    "DNE",
    "double negation elimination",
    "二重否定除去",
    "LEM",
    "law of excluded middle",
    "排中律",
    "intuitionistic logic",
    "直観主義論理",
    "classical logic",
    "古典論理",
    "LJ",
    "LK",
    "sub-formula property",
    "部分論理式性",
    "disjunction property",
    "選言性",
    "constructive mathematics",
    "構成的数学",
    "Theorem 11.9",
    "定理11.9",
    "Theorem 11.8",
    "定理11.8",
    "Lemma 11.6",
    "補題11.6",
  ],
  order: 21,
};

const conceptAnalyticTableau: ReferenceEntry = {
  id: "concept-analytic-tableau",
  category: "concept",
  title: {
    en: "Analytic Tableau",
    ja: "分析的タブロー",
  },
  summary: {
    en: "The analytic tableau (semantic tableau) is a refutation-based proof method: to prove $\\varphi$, assume F($\\varphi$) and derive contradictions on every branch. Rules are classified as α (non-branching), β (branching), γ/δ (quantifiers).",
    ja: "分析的タブロー（意味論的タブロー）は反駁ベースの証明法である。$\\varphi$ を証明するには F($\\varphi$) を仮定し、すべての枝で矛盾を導出する。規則はα（非分岐）、β（分岐）、γ/δ（量化子）に分類される。",
  },
  body: {
    en: [
      `<b>What is an analytic tableau?</b> The analytic tableau (also called semantic tableau) is a proof method based on <b>refutation</b>: to prove a formula $\\varphi$, one assumes that $\\varphi$ is false — written F($\\varphi$) — and then systematically applies decomposition rules to the signed formulas on each branch of a tree. If every branch closes (contains a contradiction), the original assumption F($\\varphi$) is untenable, and $\\varphi$ is proved. This makes the tableau method a natural way to search for proofs: "assume the conclusion is wrong and look for a contradiction" (bekki Ch.6, Definition 6.2).`,
      `<b>Signed formulas.</b> The building blocks of the analytic tableau are <b>signed formulas</b>: pairs of a sign (T or F) and a formula. T($\\varphi$) asserts "$\\varphi$ is assumed true" and F($\\varphi$) asserts "$\\varphi$ is assumed false." A branch closes (is marked ×) when it contains both T($\\varphi$) and F($\\varphi$) for some formula $\\varphi$ — a direct contradiction. The <b>abbreviated notation</b> (bekki §6.5) identifies T($\\varphi$) with $\\varphi$ and F($\\varphi$) with $\\lnot \\varphi$, so that a closed branch simply contains both $\\varphi$ and $\\lnot \\varphi$. Internally, the implementation preserves the explicit sign for clarity.`,
      `<b>α rules (non-branching).</b> The α rules decompose a signed formula into one or two components that are added to the <b>same branch</b> (no splitting). Examples: T($\\varphi \\land \\psi$) produces T($\\varphi$) and T($\\psi$); F($\\varphi \\lor \\psi$) produces F($\\varphi$) and F($\\psi$); F($\\varphi \\to \\psi$) produces T($\\varphi$) and F($\\psi$); T($\\lnot \\varphi$) produces F($\\varphi$); F($\\lnot \\varphi$) produces T($\\varphi$); and double negation rules T$(\\lnot \\lnot \\varphi) \\to$ T($\\varphi$), F$(\\lnot \\lnot \\varphi) \\to$ F($\\varphi$). The name "α" comes from the Smullyan classification of tableau rules (bekki Definition 6.2, p.131).`,
      `<b>β rules (branching).</b> The β rules decompose a signed formula into two alternatives, creating a <b>branch split</b> (two child branches). Examples: F($\\varphi \\land \\psi$) branches into F($\\varphi$) | F($\\psi$); T($\\varphi \\lor \\psi$) branches into T($\\varphi$) | T($\\psi$); T($\\varphi \\to \\psi$) branches into F($\\varphi$) | T($\\psi$). Both branches must eventually close for the proof to succeed. The β rules capture the fact that a disjunctive situation (e.g., "$\\varphi \\lor \\psi$ is true") requires considering each possibility separately.`,
      `<b>Branch closure and proof completion.</b> A branch is <b>closed</b> (×) when it contains T($\\varphi$) and F($\\varphi$) for the same formula $\\varphi$. A tableau proof is complete when <b>every branch is closed</b>. An open branch (one that cannot be closed) represents a potential countermodel — an assignment under which the original formula is false. Thus the tableau method simultaneously attempts to prove validity and searches for counterexamples.`,
      `<b>γ and δ rules (quantifiers).</b> For predicate logic, two additional rule classes handle quantifiers. <b>γ rules</b> decompose universal-affirmative and existential-negative formulas: T($\\forall$ξ.$\\varphi) \\to$ T($\\varphi$[τ/ξ]) and F($\\exists$ξ.$\\varphi) \\to$ F($\\varphi$[τ/ξ]) for an arbitrary term τ. <b>δ rules</b> decompose existential-affirmative and universal-negative formulas: T($\\exists$ξ.$\\varphi) \\to$ T($\\varphi$[ζ/ξ]) and F($\\forall$ξ.$\\varphi) \\to$ F($\\varphi$[ζ/ξ]) where ζ is a <b>fresh eigenvariable</b> that does not appear elsewhere on the branch. The γ/δ distinction corresponds to the universal/existential asymmetry in quantifier reasoning (bekki Definition 6.24).`,
      `<b>Relationship with TAB.</b> The analytic tableau and TAB (tableau-style sequent calculus, bekki Ch.12) are essentially the same proof system in different guises. TAB uses sequents Γ ⇒ (with an empty right-hand side), where each formula in Γ corresponds to a signed formula on a tableau branch. The TAB axiom (BS): $\\lnot \\varphi , \\varphi$, Γ ⇒ corresponds to a closed branch containing T($\\varphi$) and F($\\varphi$). Every TAB rule has a direct analogue as a tableau rule, and vice versa. The equivalence TAB ⊆ LK-CUT (Theorem 12.13) and LK-CUT ⊆ TAB (Theorem 12.15) therefore also applies to the analytic tableau.`,
      `<b>Abbreviated notation.</b> In the abbreviated notation (bekki §6.5), T($\\varphi$) is written simply as $\\varphi$, and F($\\varphi$) as $\\lnot \\varphi$. Under this convention, the α rule for T($\\varphi \\land \\psi$) becomes "from $\\varphi \\land \\psi$, add $\\varphi$ and $\\psi$," and the β rule for T($\\varphi \\to \\psi$) becomes "from $\\varphi \\to \\psi$, branch into $\\lnot \\varphi$ | $\\psi$." The abbreviated notation makes tableaux look like natural deduction arguments with negation, and indeed there is a systematic correspondence between the two. In this application, the internal representation preserves the sign (T/F) while the display can use either signed or abbreviated notation.`,
    ],
    ja: [
      `<b>分析的タブローとは。</b> 分析的タブロー（意味論的タブローとも呼ばれる）は<b>反駁</b>に基づく証明法です。論理式 $\\varphi$ を証明するには、$\\varphi$ が偽であると仮定し — F($\\varphi$) と書きます — 木の各枝上の署名付き論理式に対して分解規則を体系的に適用します。すべての枝が閉じれば（矛盾を含めば）、元の仮定 F($\\varphi$) は維持できず、$\\varphi$ が証明されます。このためタブロー法は証明探索の自然な方法です:「結論が誤りだと仮定して矛盾を探す」（戸次 Ch.6, 定義6.2）。`,
      `<b>署名付き論理式。</b> 分析的タブローの構成要素は<b>署名付き論理式</b>です: 符号（T または F）と論理式のペアです。T($\\varphi$) は「$\\varphi$ は真と仮定される」、F($\\varphi$) は「$\\varphi$ は偽と仮定される」を表します。枝は、ある論理式 $\\varphi$ について T($\\varphi$) と F($\\varphi$) の両方を含むとき<b>閉じます</b>（× と記されます）— 直接の矛盾です。<b>簡略化記法</b>（戸次 §6.5）では T($\\varphi$) を $\\varphi$、F($\\varphi$) を $\\lnot \\varphi$ と同一視し、閉じた枝は単に $\\varphi$ と $\\lnot \\varphi$ の両方を含むことになります。実装では、明確さのために明示的な符号を内部的に保持しています。`,
      `<b>α規則（非分岐）。</b> α規則は署名付き論理式を、<b>同じ枝</b>に追加される1つまたは2つの要素に分解します（分割なし）。例: T($\\varphi \\land \\psi$) は T($\\varphi$) と T($\\psi$) を生成; F($\\varphi \\lor \\psi$) は F($\\varphi$) と F($\\psi$) を生成; F($\\varphi \\to \\psi$) は T($\\varphi$) と F($\\psi$) を生成; T($\\lnot \\varphi$) は F($\\varphi$) を生成; F($\\lnot \\varphi$) は T($\\varphi$) を生成; 二重否定規則 T$(\\lnot \\lnot \\varphi) \\to$ T($\\varphi$), F$(\\lnot \\lnot \\varphi) \\to$ F($\\varphi$)。「α」という名前はスマリヤンによるタブロー規則の分類に由来します（戸次 定義6.2, p.131）。`,
      `<b>β規則（分岐）。</b> β規則は署名付き論理式を2つの選択肢に分解し、<b>枝の分岐</b>（2つの子枝）を作ります。例: F($\\varphi \\land \\psi$) は F($\\varphi$) | F($\\psi$) に分岐; T($\\varphi \\lor \\psi$) は T($\\varphi$) | T($\\psi$) に分岐; T($\\varphi \\to \\psi$) は F($\\varphi$) | T($\\psi$) に分岐。証明が成功するには両方の枝が最終的に閉じる必要があります。β規則は、選言的状況（例:「$\\varphi \\lor \\psi$ が真」）では各可能性を別々に考慮する必要があるという事実を捉えています。`,
      `<b>枝の閉じと証明の完成。</b> 枝は、同じ論理式 $\\varphi$ について T($\\varphi$) と F($\\varphi$) を含むとき<b>閉じます</b>（×）。タブロー証明は<b>すべての枝が閉じた</b>とき完成です。閉じることができない開いた枝は、反モデル — 元の論理式が偽となる付値 — を表します。したがってタブロー法は、妥当性の証明と反例の探索を同時に行います。`,
      `<b>γ規則とδ規則（量化子）。</b> 述語論理では、量化子を扱う2つの追加規則クラスがあります。<b>γ規則</b>は全称肯定と存在否定の論理式を分解します: T($\\forall$ξ.$\\varphi) \\to$ T($\\varphi$[τ/ξ]) および F($\\exists$ξ.$\\varphi) \\to$ F($\\varphi$[τ/ξ])（任意の項 τ に対して）。<b>δ規則</b>は存在肯定と全称否定の論理式を分解します: T($\\exists$ξ.$\\varphi) \\to$ T($\\varphi$[ζ/ξ]) および F($\\forall$ξ.$\\varphi) \\to$ F($\\varphi$[ζ/ξ])（ζ は枝上の他の場所に出現しない<b>固有変数</b>）。γ/δ の区別は量化子推論における全称/存在の非対称性に対応します（戸次 定義6.24）。`,
      `<b>TAB との関係。</b> 分析的タブローと TAB（タブロー式シーケント計算、戸次 Ch.12）は本質的に同じ証明体系を異なる装いで表現したものです。TAB はシーケント Γ ⇒（右辺が空）を使い、Γ 内の各論理式はタブロー枝上の署名付き論理式に対応します。TAB の公理 (BS): $\\lnot \\varphi , \\varphi$, Γ ⇒ は T($\\varphi$) と F($\\varphi$) を含む閉じた枝に対応します。すべての TAB 規則はタブロー規則として直接の対応物を持ち、逆も同様です。TAB ⊆ LK-CUT（定理12.13）と LK-CUT ⊆ TAB（定理12.15）の等価性は、したがって分析的タブローにも適用されます。`,
      `<b>簡略化記法。</b> 簡略化記法（戸次 §6.5）では、T($\\varphi$) は単に $\\varphi$ と書かれ、F($\\varphi$) は $\\lnot \\varphi$ と書かれます。この記法のもとで、T($\\varphi \\land \\psi$) のα規則は「$\\varphi \\land \\psi$ から $\\varphi$ と $\\psi$ を追加」となり、T($\\varphi \\to \\psi$) のβ規則は「$\\varphi \\to \\psi$ から $\\lnot \\varphi$ | $\\psi$ に分岐」となります。簡略化記法によりタブローは否定付きの自然演繹の議論のように見え、実際に両者には体系的な対応関係があります。本アプリケーションでは、内部表現は符号（T/F）を保持しつつ、表示時に署名付きまたは簡略化記法のいずれかを使用できます。`,
    ],
  },
  formalNotation:
    "\\dfrac{\\text{T}(\\varphi \\to \\psi)}{\\text{F}(\\varphi) \\mid \\text{T}(\\psi)} \\;(\\beta)",
  relatedEntryIds: [
    "concept-tab-lk-equivalence",
    "concept-cut-elimination",
    "concept-system-equivalence",
    "rule-sc-overview",
    "rule-sc-logical",
    "concept-soundness",
    "concept-completeness",
  ],
  relatedQuestIds: ["at-01", "at-02", "at-03"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Method_of_analytic_tableaux",
      label: {
        en: "Method of analytic tableaux (Wikipedia)",
        ja: "分析的タブロー法 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%82%BF%E3%83%96%E3%83%AD%E3%83%BC",
      label: {
        en: "Tableau (Wikipedia JA)",
        ja: "タブロー (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/analytic+tableau",
      label: {
        en: "Analytic tableau (nLab)",
        ja: "分析的タブロー (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "analytic tableau",
    "分析的タブロー",
    "semantic tableau",
    "意味論的タブロー",
    "signed formula",
    "署名付き論理式",
    "alpha rule",
    "α規則",
    "beta rule",
    "β規則",
    "gamma rule",
    "γ規則",
    "delta rule",
    "δ規則",
    "branch closure",
    "枝の閉じ",
    "refutation",
    "反駁",
    "Smullyan",
    "スマリヤン",
    "eigenvariable",
    "固有変数",
    "abbreviated notation",
    "簡略化記法",
    "Definition 6.2",
    "定義6.2",
    "Definition 6.24",
    "定義6.24",
  ],
  order: 22,
};

const conceptSpeedUpTheorem: ReferenceEntry = {
  id: "concept-speed-up-theorem",
  category: "concept",
  title: {
    en: "Speed-Up Theorem: Don't Eliminate Cut",
    ja: "速度向上定理: カットを除去するな",
  },
  summary: {
    en: "Cut elimination can cause an exponential blowup in proof size. Boolos (1984) gave a concrete example where the shortest CUT-free proof is super-exponentially larger than the proof with CUT.",
    ja: "カット除去は証明のサイズを指数関数的に増大させうる。Boolos (1984) は、カットなし証明がカットあり証明より超指数関数的に大きくなる具体例を示した。",
  },
  body: {
    en: [
      `<b>The cost of cut elimination.</b> While the cut elimination theorem guarantees that any sequent provable with the CUT rule can also be proved without it, this transformation comes at a steep computational cost. George Boolos demonstrated in his 1984 paper "Don't Eliminate Cut" that there exist simple, natural inferences whose CUT-free proofs are incomparably longer than their proofs using CUT (modus ponens). This reveals a fundamental tension between the theoretical elegance of cut-free proofs and the practical efficiency of proofs that use lemmas and intermediate results.`,
      `<b>Boolos's example H_n.</b> Boolos constructed a family of inferences H_n ("H" for "heap") with the following premisses: (1) (x)(y)(z) +x+yz = ++xyz (associativity of addition), (2) (x) dx = +xx (doubling), (3) L1 (the predicate L holds for 1), and (4) (x)(Lx $\\to$ L+x1) (successor closure of L). The conclusion is Ld...d1 where d is applied 2^n times consecutively to 1. For example, H₃ concludes Lddddddddd1 (8 = 2³ applications of d). The key result is that while a natural deduction proof (using CUT/modus ponens) requires only about 16(2^n + 8n + 21) symbols — linear in 2^n — the shortest closed tree (CUT-free proof) requires more than 2^(2^n) symbols, a super-exponential blowup.`,
      `<b>Why the blowup occurs.</b> The proof with CUT works by establishing a chain of lemmas: first that L applies to d1 = 1+1 = 2, then to dd1 = 2·2 = 4, then to ddd1 = 2·4 = 8, and so on, each step reusing the previous result as a lemma via modus ponens. Without CUT, however, the tree method cannot reuse previously established results. Each branch of the proof tree must independently verify the entire chain from scratch, leading to an exponential duplication of work at each level. The interpretation I that makes the premisses true assigns positive integers as the domain, with d as doubling and + as addition, and L as a predicate true of all positive integers less than or equal to 2^(2^n).`,
      `<b>Implications for proof theory.</b> This speed-up result shows that CUT is not merely a convenience but is essential for practical reasoning. While CUT-free proofs have desirable properties — they enjoy the subformula property, which means every formula appearing in the proof is a subformula of the conclusion or a premiss — the exponential cost of achieving this property can be prohibitive. Boolos argued that this is a reason to favor natural deduction over the method of trees (analytic tableaux) for certain applications: natural deduction permits the development and reuse of "subsidiary conclusions" or lemmas, which corresponds exactly to the use of CUT. The XM (excluded middle / modus ponens mix) rule, when added to the tree method, restores this capability and eliminates the exponential penalty.`,
    ],
    ja: [
      `<b>カット除去のコスト。</b> カット除去定理は、CUT規則を用いて証明可能なすべてのシーケントがCUTなしでも証明可能であることを保証しますが、この変換には莫大な計算コストが伴います。George Boolosは1984年の論文 "Don't Eliminate Cut" において、CUTなし証明がCUT（モーダスポネンス）を用いた証明に比べて桁違いに長くなる、単純で自然な推論の具体例を示しました。これは、カットなし証明の理論的な美しさと、補題や中間結果を活用する証明の実用的な効率性との間にある、根本的な緊張関係を明らかにしています。`,
      `<b>Boolosの例 H_n。</b> Boolosは推論の族 H_n（"H" は "heap"）を構成しました。前提は次の4つです: (1) (x)(y)(z) +x+yz = ++xyz（加法の結合法則）、(2) (x) dx = +xx（倍化）、(3) L1（述語 L が 1 で成り立つ）、(4) (x)(Lx $\\to$ L+x1)（L の後者閉包）。結論は Ld...d1 で、d を 2^n 回連続適用します。例えば H₃ の結論は Lddddddddd1（d が 8 = 2³ 回）です。主要な結果は、自然演繹（CUT/モーダスポネンスあり）の証明は約 16(2^n + 8n + 21) シンボル — 2^n に対して線形 — で済むのに対し、最短の閉じた木（CUTなし証明）は 2^(2^n) シンボルを超える、つまり超指数関数的な膨張が生じるということです。`,
      `<b>膨張が起きる理由。</b> CUTを使う証明は補題の連鎖を構築します: まず L が d1 = 1+1 = 2 に適用されることを示し、次に dd1 = 2·2 = 4、次に ddd1 = 2·4 = 8、というように、各ステップで前の結果をモーダスポネンスで補題として再利用します。しかしCUTなしでは、木の方法は以前に確立された結果を再利用できません。証明木の各枝が独立に連鎖全体を最初から検証しなければならず、各レベルで指数的な作業の重複が生じます。前提を真にする解釈 I は、正の整数を領域とし、d を倍化、+ を加法とし、L を 2^(2^n) 以下のすべての正の整数で真となる述語とします。`,
      `<b>証明論への含意。</b> この速度向上の結果は、CUTが単なる便宜ではなく、実用的な推論に不可欠であることを示しています。CUTなし証明は望ましい性質 — 証明に現れるすべての論理式が結論または前提の部分論理式であるという部分論理式性 — を持ちますが、この性質を達成するための指数的コストは法外なものになりえます。Boolosは、特定の応用では木の方法（分析的タブロー）よりも自然演繹を支持する理由としてこの結果を挙げました: 自然演繹は「補助的結論」すなわち補題の構築と再利用を許し、これはまさにCUTの使用に対応します。XM規則（排中律/モーダスポネンス混合）を木の方法に追加すれば、この能力が回復し指数的ペナルティが解消されます。`,
    ],
  },
  formalNotation: `H_n: \\; \\text{CUT proof} \\sim O(2^n), \\quad \\text{CUT-free proof} > 2^{2^n} \\text{ symbols}`,
  relatedEntryIds: [
    "concept-cut-elimination",
    "concept-admissible-derivable",
    "concept-analytic-tableau",
    "concept-tab-lk-equivalence",
    "rule-mp",
    "rule-sc-overview",
  ],
  externalLinks: [
    {
      type: "paper",
      url: "https://www.jstor.org/stable/30226313",
      label: {
        en: "Boolos (1984) Don't Eliminate Cut (JSTOR)",
        ja: "Boolos (1984) Don't Eliminate Cut (JSTOR)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Cut-elimination_theorem#Complexity",
      label: {
        en: "Cut elimination: Complexity (Wikipedia)",
        ja: "カット除去: 計算量 (Wikipedia)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "speed-up",
    "速度向上",
    "don't eliminate cut",
    "Boolos",
    "ブーロス",
    "exponential blowup",
    "指数的膨張",
    "proof length",
    "証明の長さ",
    "subformula property",
    "部分論理式性",
    "lemma",
    "補題",
    "modus ponens",
  ],
  order: 23,
};

const conceptFormulaSchema: ReferenceEntry = {
  id: "concept-formula-schema",
  category: "concept",
  title: {
    en: "Formula Schemas vs. Formulas",
    ja: "論理式スキーマと論理式",
  },
  summary: {
    en: "This site proves formula schemas — patterns with metavariables — rather than specific formulas, giving every proof maximal generality.",
    ja: "このサイトでは具体的な論理式ではなく、メタ変数を含むパターン（論理式スキーマ）を証明し、すべての証明に最大の一般性を持たせる。",
  },
  body: {
    en: [
      "<b>What is a formula schema?</b> A <b>formula schema</b> (also called an <b>axiom schema</b> when used as an axiom) is a pattern that represents an infinite family of formulas. For example, the schema $\\varphi \\to (\\psi \\to \\varphi)$ contains metavariables $\\varphi$ and $\\psi$, each of which can be replaced by any well-formed formula. Substituting $\\varphi$ with (P $\\to$ Q) and $\\psi$ with R yields the concrete formula (P $\\to$ Q) $\\to$ (R $\\to$ (P $\\to$ Q)), but equally valid would be any other substitution. A single schema thus captures infinitely many specific formulas.",

      "<b>Formulas vs. schemas.</b> A <b>formula</b> in propositional logic is built from propositional variables (P, Q, R, ...) and logical connectives ($\\to , \\lnot , \\land , \\lor$). Every propositional variable denotes a fixed (though unspecified) truth value. A <b>schema</b>, by contrast, uses <b>metavariables</b> — Greek letters like $\\varphi , \\psi , \\chi$ — that stand for arbitrary formulas, not just propositional variables. The distinction is subtle but crucial: a propositional variable P is part of the object language, while a metavariable $\\varphi$ belongs to the metalanguage and can be replaced by any formula, no matter how complex.",

      "<b>Why prove schemas?</b> Proving a schema is strictly stronger than proving any single instance of it. When you prove $\\varphi \\to (\\psi \\to \\varphi)$, you simultaneously prove P $\\to$ (Q $\\to$ P), (A $\\land$ B) $\\to$ (C $\\to$ (A $\\land$ B)), ($\\lnot$P $\\to \\lnot$Q) $\\to$ ((R $\\lor$ S) $\\to (\\lnot$P $\\to \\lnot$Q)), and every other possible substitution. A proof of the schema is a proof of the <b>logical principle itself</b>, not merely one example of it. This is why axiomatic systems state their axioms as schemas: they need to assert the principle in full generality.",

      "<b>The approach of this site.</b> In this application, you work entirely with formula schemas. When you write $\\varphi \\to (\\psi \\to \\varphi)$ on the proof canvas, $\\varphi$ and $\\psi$ are metavariables that can be instantiated to any formula. This means:\n• Every proof you construct is maximally general.\n• You prove logical <b>laws</b>, not particular instances.\n• Your proofs directly correspond to the way axiom systems are formally defined.\n• A single completed proof serves as a template for infinitely many concrete proofs.",

      "<b>Schemas in predicate logic.</b> The concept extends naturally to predicate logic. A schema like $\\forall x. \\varphi \\to \\varphi$[x := t] contains the metavariable $\\varphi$ and the meta-term t. Here $\\varphi$ can be any formula, and t can be any term free for x in $\\varphi$. The substitution notation [x := t] is itself part of the schema mechanism, specifying how the instantiation should be performed. This schema-level reasoning is what makes predicate logic axioms (like A4 and A5) applicable to every formula and every term.",

      "<b>Schema-level proof and rigor.</b> Working with schemas makes the logical structure of proofs transparent. Every application of Modus Ponens, every axiom instantiation, and every generalization step operates at the schema level. There are no hidden assumptions about specific formulas — the proof works for <b>all</b> formulas uniformly. This is not just a pedagogical convenience but reflects how formal proof theory actually works: metatheorems about deductive systems are proved at the schema level, establishing results that hold for the entire system at once.",
    ],
    ja: [
      "<b>論理式スキーマとは？</b> <b>論理式スキーマ</b>（公理として用いる場合は<b>公理スキーマ</b>とも呼ぶ）は、無限個の論理式の族を表すパターンです。例えばスキーマ $\\varphi \\to (\\psi \\to \\varphi)$ にはメタ変数 $\\varphi$ と $\\psi$ が含まれ、それぞれ任意の整形式論理式に置き換えることができます。$\\varphi$ を (P $\\to$ Q) に、$\\psi$ を R に代入すると具体的な論理式 (P $\\to$ Q) $\\to$ (R $\\to$ (P $\\to$ Q)) が得られますが、他のどのような代入も同様に有効です。一つのスキーマが無限個の具体的な論理式を捉えているのです。",

      "<b>論理式とスキーマの違い。</b> 命題論理における<b>論理式</b>は、命題変数（P, Q, R, ...）と論理結合子（$\\to , \\lnot , \\land , \\lor$）から構成されます。各命題変数は固定された（ただし未指定の）真理値を指します。一方<b>スキーマ</b>は<b>メタ変数</b> — ギリシャ文字の $\\varphi , \\psi , \\chi$ など — を使い、これらは命題変数だけでなく任意の論理式を表します。この区別は微妙ですが決定的に重要です：命題変数 P は対象言語の一部であるのに対し、メタ変数 $\\varphi$ はメタ言語に属し、どれほど複雑な論理式にも置き換えることができます。",

      "<b>なぜスキーマを証明するのか？</b> スキーマの証明は、そのいかなる具体例の証明よりも厳密に強力です。$\\varphi \\to (\\psi \\to \\varphi)$ を証明すれば、P $\\to$ (Q $\\to$ P) も (A $\\land$ B) $\\to$ (C $\\to$ (A $\\land$ B)) も ($\\lnot$P $\\to \\lnot$Q) $\\to$ ((R $\\lor$ S) $\\to (\\lnot$P $\\to \\lnot$Q)) も、その他すべての可能な代入結果も同時に証明したことになります。スキーマの証明は単なる一例の証明ではなく、<b>論理法則そのもの</b>の証明です。公理系が公理をスキーマとして述べるのはこのためです：原理を完全な一般性で主張する必要があるからです。",

      "<b>このサイトのアプローチ。</b> 本アプリケーションでは、すべての作業を論理式スキーマで行います。証明キャンバスに $\\varphi \\to (\\psi \\to \\varphi)$ と書くとき、$\\varphi$ と $\\psi$ は任意の論理式にインスタンス化できるメタ変数です。これは以下を意味します：\n• 構築するすべての証明が最大限に一般的である。\n• 個別の事例ではなく、論理<b>法則</b>を証明する。\n• 証明が公理系の形式的定義に直接対応する。\n• 完成した一つの証明が、無限個の具体的な証明のテンプレートとなる。",

      "<b>述語論理におけるスキーマ。</b> この概念は述語論理にも自然に拡張されます。$\\forall x. \\varphi \\to \\varphi$[x := t] というスキーマにはメタ変数 $\\varphi$ とメタ項 t が含まれます。ここで $\\varphi$ は任意の論理式、t は $\\varphi$ において x に対して自由な任意の項です。代入記法 [x := t] 自体がスキーマ機構の一部であり、インスタンス化の方法を指定しています。このスキーマレベルの推論こそが、述語論理の公理（A4やA5など）をあらゆる論理式とあらゆる項に適用可能にしているのです。",

      "<b>スキーマレベルの証明と厳密さ。</b> スキーマで作業することで、証明の論理構造が透明になります。Modus Ponensの適用も、公理のインスタンス化も、一般化のステップも、すべてスキーマレベルで行われます。特定の論理式についての暗黙の仮定は存在しません — 証明は<b>すべての</b>論理式に一様に機能します。これは単なる教育的便宜ではなく、形式的証明論が実際にどう機能するかを反映しています：演繹体系に関するメタ定理はスキーマレベルで証明され、体系全体に一度に成り立つ結果を確立するのです。",
    ],
  },
  relatedEntryIds: [
    "notation-metavariables",
    "axiom-a1",
    "axiom-a2",
    "axiom-a3",
    "axiom-a4",
    "axiom-a5",
    "guide-what-is-formal-proof",
    "concept-substitution",
  ],
  relatedQuestIds: ["prop-01", "prop-02", "prop-03"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Axiom_schema",
      label: {
        en: "Axiom schema (Wikipedia)",
        ja: "公理スキーマ (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E5%85%AC%E7%90%86%E5%9E%8B",
      label: {
        en: "Axiom schema (Wikipedia, ja)",
        ja: "公理型 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/axiom+scheme",
      label: {
        en: "Axiom scheme (nLab)",
        ja: "公理スキーム (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "formula schema",
    "論理式スキーマ",
    "axiom schema",
    "公理スキーマ",
    "metavariable",
    "メタ変数",
    "schema",
    "スキーマ",
    "generality",
    "一般性",
    "instantiation",
    "インスタンス化",
    "object language",
    "対象言語",
    "metalanguage",
    "メタ言語",
  ],
  order: 24,
};

const conceptTautology: ReferenceEntry = {
  id: "concept-tautology",
  category: "concept",
  title: {
    en: "Tautology and Valid Formula",
    ja: "トートロジーと恒真式",
  },
  summary: {
    en: "A tautology is a propositional formula that evaluates to true under every truth-value assignment. Tautologies are the semantic counterpart of provable formulas in sound and complete proof systems.",
    ja: "トートロジー（恒真式）とは、すべての真理値割当のもとで真となる命題論理の論理式である。健全かつ完全な証明体系において、恒真式は証明可能な論理式の意味論的対応物である。",
  },
  body: {
    en: [
      `<b>Definition.</b> A propositional formula $\\varphi$ is a <b>tautology</b> (also called a <b>valid formula</b> or <b>logically valid formula</b>) if $\\varphi$ evaluates to true under every possible truth-value assignment to its propositional variables. Formally, for every assignment v: {P₁, …, Pₙ} $\\to$ {T, F}, we have ⟦$\\varphi$⟧_v = T. Equivalently, the truth table of $\\varphi$ has T in every row of its output column. The notation $\\models \\varphi$ (read "$\\varphi$ is valid") expresses this property.`,

      `<b>Examples.</b> The formula $\\varphi \\to \\varphi$ is a tautology: regardless of whether $\\varphi$ is true or false, the implication $\\varphi \\to \\varphi$ is always true. Similarly, $\\varphi \\lor \\lnot \\varphi$ (the law of excluded middle) and $\\lnot (\\varphi \\land \\lnot \\varphi)$ (the law of non-contradiction) are tautologies. In contrast, $\\varphi \\to \\psi$ is not a tautology because it is false when $\\varphi$ is true and $\\psi$ is false. A formula like $\\varphi \\land \\lnot \\varphi$ is a <b>contradiction</b> — false under every assignment — the dual notion of a tautology.`,

      `<b>Truth table method.</b> For propositional logic, tautologyhood is <b>decidable</b>: given a formula with n distinct propositional variables, one can enumerate all 2ⁿ truth-value assignments and verify that the formula evaluates to true in each case. This brute-force method is conceptually simple but exponential in the number of variables. More efficient methods exist (e.g., BDDs, DPLL-based SAT solvers applied to $\\lnot \\varphi$), but the truth table remains the standard introductory approach.`,

      `<b>Tautological implication and equivalence.</b> A formula $\\varphi$ <b>tautologically implies</b> $\\psi$ (written $\\varphi \\models \\psi$) if every assignment making $\\varphi$ true also makes $\\psi$ true. Two formulas $\\varphi$ and $\\psi$ are <b>tautologically equivalent</b> (written $\\varphi \\models \\models \\psi$ or $\\varphi \\equiv \\psi$) if they have the same truth value under every assignment, i.e., $\\varphi \\models \\psi$ and $\\psi \\models \\varphi$. Tautological equivalence preserves intersubstitutability in any context: replacing a subformula by a tautologically equivalent one yields a tautologically equivalent result.`,

      `<b>Soundness and completeness.</b> The relationship between tautologies (semantic notion) and provable formulas (syntactic notion) is governed by two fundamental metatheorems. <b>Soundness</b>: if $\\vdash \\varphi (\\varphi$ is provable in the proof system), then $\\models \\varphi (\\varphi$ is a tautology). This ensures the proof system never proves a non-tautology. <b>Completeness</b> (Gödel, 1930 for first-order logic; straightforward for propositional logic): if $\\models \\varphi$, then $\\vdash \\varphi$. This ensures every tautology has a proof. For the Łukasiewicz system used in this application, both properties hold: the set of provable formulas coincides exactly with the set of tautologies.`,

      `<b>Tautology in predicate logic.</b> The concept of tautology extends to predicate logic in two ways. (1) A <b>propositional tautology instance</b> is a first-order formula obtained from a propositional tautology by uniformly substituting first-order formulas for propositional variables — such a formula is valid in predicate logic as well. (2) A first-order formula is <b>valid</b> ($\\models \\varphi$) if it is true in every interpretation (every domain with every interpretation of predicates, functions, and constants). Unlike propositional tautologies, first-order validity is not decidable (Church's theorem, 1936) but is semi-decidable by completeness.`,
    ],
    ja: [
      `<b>定義。</b> 命題論理の論理式 $\\varphi$ が<b>トートロジー</b>（<b>恒真式</b>、<b>論理的妥当式</b>とも呼ぶ）であるとは、命題変数へのすべての可能な真理値割当のもとで $\\varphi$ が真と評価されることです。形式的には、すべての割当 v: {P₁, …, Pₙ} $\\to$ {T, F} について ⟦$\\varphi$⟧_v = T です。同値的に、$\\varphi$ の真理値表の出力列がすべての行で T です。$\\models \\varphi$（「$\\varphi$ は妥当である」と読む）という記法でこの性質を表します。`,

      `<b>例。</b> 論理式 $\\varphi \\to \\varphi$ はトートロジーです: $\\varphi$ が真でも偽でも、含意 $\\varphi \\to \\varphi$ は常に真です。同様に、$\\varphi \\lor \\lnot \\varphi$（排中律）や $\\lnot (\\varphi \\land \\lnot \\varphi)$（矛盾律）もトートロジーです。一方、$\\varphi \\to \\psi$ はトートロジーではありません。$\\varphi$ が真で $\\psi$ が偽のとき偽となるからです。$\\varphi \\land \\lnot \\varphi$ のような論理式は<b>矛盾</b> — すべての割当のもとで偽 — であり、トートロジーの双対概念です。`,

      `<b>真理値表法。</b> 命題論理において、恒真性は<b>決定可能</b>です: n 個の異なる命題変数を持つ論理式に対し、2ⁿ 通りの真理値割当をすべて列挙し、各場合に論理式が真と評価されることを検証できます。この総当たり法は概念的に単純ですが、変数の数に対して指数的です。より効率的な方法（BDD、$\\lnot \\varphi$ に対する DPLL ベースの SAT ソルバーなど）が存在しますが、真理値表は標準的な入門的アプローチのままです。`,

      `<b>恒真含意と恒真同値。</b> 論理式 $\\varphi$ が $\\psi$ を<b>恒真含意</b>する（$\\varphi \\models \\psi$ と書く）とは、$\\varphi$ を真にするすべての割当が $\\psi$ も真にすることです。2つの論理式 $\\varphi$ と $\\psi$ が<b>恒真同値</b>（$\\varphi \\models \\models \\psi$ または $\\varphi \\equiv \\psi$ と書く）であるとは、すべての割当のもとで同じ真理値を持つこと、すなわち $\\varphi \\models \\psi$ かつ $\\psi \\models \\varphi$ です。恒真同値は任意の文脈での置換可能性を保存します: 部分式を恒真同値なものに置き換えると、恒真同値な結果が得られます。`,

      `<b>健全性と完全性。</b> トートロジー（意味論的概念）と証明可能な論理式（構文論的概念）の関係は、2つの基本的なメタ定理によって支配されます。<b>健全性</b>: $\\vdash \\varphi$（$\\varphi$ が証明体系で証明可能）ならば $\\models \\varphi$（$\\varphi$ はトートロジー）。これは証明体系がトートロジーでないものを証明しないことを保証します。<b>完全性</b>（一階述語論理ではゲーデル, 1930年; 命題論理では直接的）: $\\models \\varphi$ ならば $\\vdash \\varphi$。これはすべてのトートロジーが証明を持つことを保証します。本アプリケーションで使用するŁukasiewicz体系について、両方の性質が成立します: 証明可能な論理式の集合とトートロジーの集合は完全に一致します。`,

      `<b>述語論理におけるトートロジー。</b> トートロジーの概念は述語論理に2つの方法で拡張されます。(1) <b>命題論理的トートロジーのインスタンス</b>は、命題論理のトートロジーの命題変数を一階論理式で一様に代入して得られる一階論理式で、述語論理でも妥当です。(2) 一階論理式が<b>妥当</b>（$\\models \\varphi$）であるとは、すべての解釈（述語・関数・定数のすべての解釈を持つすべての領域）で真であることです。命題論理のトートロジーとは異なり、一階論理の妥当性は決定可能ではなく（チャーチの定理, 1936年）、完全性により半決定可能にとどまります。`,
    ],
  },
  formalNotation: `\\vDash \\varphi \\;\\overset{\\text{def}}{\\iff}\\; \\forall v\\!:\\!\\{P_1,\\ldots,P_n\\}\\to\\{\\top,\\bot\\},\\; \\llbracket\\varphi\\rrbracket_v = \\top`,
  relatedEntryIds: [
    "concept-soundness",
    "concept-completeness",
    "concept-semantic-validity",
    "notation-connectives",
    "system-lukasiewicz",
    "concept-deduction-theorem",
  ],
  relatedQuestIds: [
    "prop-01",
    "prop-02",
    "prop-03",
    "prop-04",
    "prop-05",
    "prop-06",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Tautology_(logic)",
      label: {
        en: "Tautology (Wikipedia)",
        ja: "トートロジー (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E6%81%92%E7%9C%9F%E5%BC%8F",
      label: {
        en: "Tautology (Wikipedia JA)",
        ja: "恒真式 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/tautology",
      label: {
        en: "Tautology (nLab)",
        ja: "トートロジー (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "tautology",
    "トートロジー",
    "valid formula",
    "恒真式",
    "truth table",
    "真理値表",
    "logically valid",
    "論理的妥当",
    "truth-value assignment",
    "真理値割当",
    "soundness",
    "健全性",
    "completeness",
    "完全性",
    "decidable",
    "決定可能",
    "contradiction",
    "矛盾",
  ],
  order: 25,
};

// ============================================================
// 理論 (Theories)
// ============================================================

const theoryPeanoArithmetic: ReferenceEntry = {
  id: "theory-peano",
  category: "theory",
  title: { en: "Peano Arithmetic (PA)", ja: "ペアノ算術 (PA)" },
  summary: {
    en: "First-order theory of natural numbers with successor, addition, and multiplication.",
    ja: "後者関数、加法、乗法を持つ自然数の一階理論。",
  },
  body: {
    en: [
      "<b>Peano Arithmetic</b> (PA) is a first-order theory that axiomatizes the natural numbers.",
      "Non-logical axioms include: PA1 (0 is not a successor), PA2 (successor is injective), PA3-PA6 (recursion for + and ×), and the induction schema PA7.",
      "In this application, PA is built on top of the predicate logic axioms (A1-A5) and equality axioms (E1-E3).",
    ],
    ja: [
      "<b>ペアノ算術</b> (PA) は自然数を公理化する一階理論です。",
      "非論理的公理として、PA1（0は後者ではない）、PA2（後者関数は単射）、PA3-PA6（+と×の再帰的定義）、帰納法スキーマPA7を含みます。",
      "本アプリケーションでは、PAは述語論理公理(A1-A5)と等号公理(E1-E3)の上に構築されます。",
    ],
  },
  relatedEntryIds: ["theory-group", "axiom-e1", "axiom-a4"],
  relatedQuestIds: ["pa-01", "pa-02", "pa-03"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Peano_axioms",
      label: {
        en: "Peano axioms (Wikipedia)",
        ja: "ペアノ公理 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E3%83%9A%E3%82%A2%E3%83%8E%E3%81%AE%E5%85%AC%E7%90%86",
      label: {
        en: "Peano axioms (Wikipedia JA)",
        ja: "ペアノの公理 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/PeanosAxioms.html",
      label: {
        en: "Peano's Axioms (MathWorld)",
        ja: "ペアノの公理 (MathWorld)",
      },
      documentLanguage: "en",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/Peano+arithmetic",
      label: {
        en: "Peano arithmetic (nLab)",
        ja: "ペアノ算術 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "Peano",
    "PA",
    "arithmetic",
    "natural numbers",
    "ペアノ",
    "算術",
    "自然数",
  ],
  order: 1,
};

const theoryGroupTheory: ReferenceEntry = {
  id: "theory-group",
  category: "theory",
  title: { en: "Group Theory", ja: "群論" },
  summary: {
    en: "First-order theory of groups with associativity, identity, and inverse axioms.",
    ja: "結合律、単位元、逆元の公理を持つ群の一階理論。",
  },
  body: {
    en: [
      "<b>Group theory</b> axiomatizes algebraic structures with a binary operation (·), identity element (e), and inverse function (i).",
      "Core axioms: G1 (associativity), G2 (identity), G3 (inverse). An abelian group adds G4 (commutativity).",
      "In this application, group theory is built on top of predicate logic and equality axioms, with the group axioms as theory-specific non-logical axioms.",
    ],
    ja: [
      "<b>群論</b>は二項演算(·)、単位元(e)、逆元関数(i)を持つ代数構造を公理化します。",
      "核となる公理: G1（結合律）、G2（単位元）、G3（逆元）。アーベル群はG4（交換律）を追加します。",
      "本アプリケーションでは、群論は述語論理と等号公理の上に構築され、群公理が理論固有の非論理的公理として追加されます。",
    ],
  },
  relatedEntryIds: ["theory-peano", "axiom-e1"],
  relatedQuestIds: ["grp-01", "grp-02", "grp-03"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Group_theory",
      label: {
        en: "Group theory (Wikipedia)",
        ja: "群論 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E7%BE%A4%E8%AB%96",
      label: {
        en: "Group theory (Wikipedia JA)",
        ja: "群論 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/Group.html",
      label: {
        en: "Group (MathWorld)",
        ja: "群 (MathWorld)",
      },
      documentLanguage: "en",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/group",
      label: {
        en: "Group (nLab)",
        ja: "群 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "group",
    "群",
    "associativity",
    "identity",
    "inverse",
    "結合律",
    "単位元",
    "逆元",
  ],
  order: 2,
};

// ============================================================
// 記法・記号 (Notation)
// ============================================================

const notationConnectives: ReferenceEntry = {
  id: "notation-connectives",
  category: "notation",
  title: {
    en: "Logical Connectives",
    ja: "論理結合子",
  },
  summary: {
    en: "$\\to$ (implication), $\\land$ (conjunction), $\\lor$ (disjunction), $\\lnot$ (negation), $\\leftrightarrow$ (biconditional).",
    ja: "$\\to$（含意）、$\\land$（連言）、$\\lor$（選言）、$\\lnot$（否定）、$\\leftrightarrow$（双条件）。",
  },
  body: {
    en: [
      "<b>Logical connectives</b> combine formulas to form compound statements. This application supports five connectives, listed from highest to lowest precedence:",
      "<b>$\\lnot$ (Negation):</b> A unary prefix operator. $\\lnot \\varphi$ is true when $\\varphi$ is false. Written <code>~</code> or <code>not</code> in ASCII input. LaTeX: <code>\\lnot</code>.",
      "<b>$\\land$ (Conjunction):</b> A binary infix operator, left-associative. $\\varphi \\land \\psi$ is true when both $\\varphi$ and $\\psi$ are true. Written <code>/\\</code> or <code>and</code> in ASCII input. LaTeX: <code>\\land</code>.",
      "<b>$\\lor$ (Disjunction):</b> A binary infix operator, left-associative. $\\varphi \\lor \\psi$ is true when at least one of $\\varphi$ or $\\psi$ is true. Written <code>\\/</code> or <code>or</code> in ASCII input. LaTeX: <code>\\lor</code>.",
      "<b>$\\to$ (Implication):</b> A binary infix operator, right-associative. $\\varphi \\to \\psi$ is false only when $\\varphi$ is true and $\\psi$ is false. Written <code>-></code> or <code>implies</code> in ASCII input. LaTeX: <code>\\to</code>.",
      "<b>$\\leftrightarrow$ (Biconditional):</b> A binary infix operator, right-associative. $\\varphi \\leftrightarrow \\psi$ is true when $\\varphi$ and $\\psi$ have the same truth value. Written <code><-></code> or <code>iff</code> in ASCII input. LaTeX: <code>\\leftrightarrow</code>.",
    ],
    ja: [
      "<b>論理結合子</b>は論理式を組み合わせて複合命題を形成します。本アプリケーションでは5つの結合子をサポートしており、優先順位の高い順に列挙します：",
      "<b>$\\lnot$（否定）：</b> 単項前置演算子です。$\\lnot \\varphi$は$\\varphi$が偽のとき真になります。ASCII入力では <code>~</code> または <code>not</code> と書きます。LaTeX: <code>\\lnot</code>。",
      "<b>$\\land$（連言）：</b> 二項中置演算子で、左結合です。$\\varphi \\land \\psi$は$\\varphi$と$\\psi$の両方が真のとき真になります。ASCII入力では <code>/\\</code> または <code>and</code> と書きます。LaTeX: <code>\\land</code>。",
      "<b>$\\lor$（選言）：</b> 二項中置演算子で、左結合です。$\\varphi \\lor \\psi$は$\\varphi$と$\\psi$の少なくとも一方が真のとき真になります。ASCII入力では <code>\\/</code> または <code>or</code> と書きます。LaTeX: <code>\\lor</code>。",
      "<b>$\\to$（含意）：</b> 二項中置演算子で、右結合です。$\\varphi \\to \\psi$は$\\varphi$が真で$\\psi$が偽のときのみ偽になります。ASCII入力では <code>-></code> または <code>implies</code> と書きます。LaTeX: <code>\\to</code>。",
      "<b>$\\leftrightarrow$（双条件）：</b> 二項中置演算子で、右結合です。$\\varphi \\leftrightarrow \\psi$は$\\varphi$と$\\psi$の真偽値が同じとき真になります。ASCII入力では <code><-></code> または <code>iff</code> と書きます。LaTeX: <code>\\leftrightarrow</code>。",
    ],
  },
  formalNotation: "\\lnot, \\land, \\lor, \\to, \\leftrightarrow",
  relatedEntryIds: [
    "notation-precedence",
    "notation-input-methods",
    "axiom-a1",
    "axiom-a2",
    "axiom-a3",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Logical_connective",
      label: {
        en: "Logical connective (Wikipedia)",
        ja: "論理結合子 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E8%AB%96%E7%90%86%E7%B5%90%E5%90%88%E5%AD%90",
      label: {
        en: "Logical connective (Wikipedia JA)",
        ja: "論理結合子 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/Connective.html",
      label: {
        en: "Connective (MathWorld)",
        ja: "結合子 (MathWorld)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "connective",
    "結合子",
    "negation",
    "否定",
    "conjunction",
    "連言",
    "disjunction",
    "選言",
    "implication",
    "含意",
    "biconditional",
    "双条件",
    "→",
    "∧",
    "∨",
    "¬",
    "↔",
  ],
  order: 1,
};

const notationQuantifiers: ReferenceEntry = {
  id: "notation-quantifiers",
  category: "notation",
  title: {
    en: "Quantifiers",
    ja: "量化子",
  },
  summary: {
    en: "$\\forall$ (universal quantifier) and $\\exists$ (existential quantifier) for predicate logic.",
    ja: "$\\forall$（全称量化子）と$\\exists$（存在量化子）、述語論理における量化。",
  },
  body: {
    en: [
      "<b>Quantifiers</b> bind variables and specify the scope over which a formula holds. They are essential for predicate logic (first-order logic).",
      "<b>$\\forall$ (Universal quantifier):</b> $\\forall x. \\varphi$ asserts that $\\varphi$ holds for all values of x. Written <code>all x.</code> or <code>forall x.</code> in ASCII input. The dot (<code>.</code>) separates the bound variable from the formula scope. LaTeX: <code>\\forall</code>.",
      "<b>$\\exists$ (Existential quantifier):</b> $\\exists x. \\varphi$ asserts that there exists at least one value of x for which $\\varphi$ holds. Written <code>ex x.</code> or <code>exists x.</code> in ASCII input. LaTeX: <code>\\exists</code>.",
      "Quantifiers bind tighter than all connectives: $\\forall x. \\varphi \\to \\psi$ is parsed as $(\\forall x. \\varphi) \\to \\psi$, not $\\forall x.(\\varphi \\to \\psi)$. Use parentheses to change grouping when needed.",
    ],
    ja: [
      "<b>量化子</b>は変数を束縛し、論理式が成り立つ範囲を指定します。述語論理（一階論理）において不可欠です。",
      "<b>$\\forall$（全称量化子）：</b> $\\forall x. \\varphi$はxのすべての値に対して$\\varphi$が成り立つことを主張します。ASCII入力では <code>all x.</code> または <code>forall x.</code> と書きます。ドット（<code>.</code>）が束縛変数と論理式のスコープを分離します。LaTeX: <code>\\forall</code>。",
      "<b>$\\exists$（存在量化子）：</b> $\\exists x. \\varphi$は$\\varphi$が成り立つようなxの値が少なくとも1つ存在することを主張します。ASCII入力では <code>ex x.</code> または <code>exists x.</code> と書きます。LaTeX: <code>\\exists</code>。",
      "量化子はすべての結合子よりも強く束縛します：$\\forall x. \\varphi \\to \\psi$は$(\\forall x. \\varphi) \\to \\psi$と解析され、$\\forall x.(\\varphi \\to \\psi)$ではありません。グルーピングを変更するには括弧を使用してください。",
    ],
  },
  formalNotation: "\\forall x.\\varphi, \\quad \\exists x.\\varphi",
  relatedEntryIds: ["notation-connectives", "axiom-a4", "axiom-a5", "rule-gen"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Quantifier_(logic)",
      label: {
        en: "Quantifier (Wikipedia)",
        ja: "量化子 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E9%87%8F%E5%8C%96%E5%AD%90",
      label: {
        en: "Quantifier (Wikipedia JA)",
        ja: "量化子 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/quantifier",
      label: {
        en: "Quantifier (nLab)",
        ja: "量化子 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "quantifier",
    "量化子",
    "universal",
    "全称",
    "existential",
    "存在",
    "∀",
    "∃",
    "forall",
    "exists",
    "bound variable",
    "束縛変数",
  ],
  order: 2,
};

const notationEquality: ReferenceEntry = {
  id: "notation-equality",
  category: "notation",
  title: {
    en: "Equality",
    ja: "等号",
  },
  summary: {
    en: "t₁ = t₂ — equality between terms, governed by equality axioms E1–E5.",
    ja: "t₁ = t₂ — 項間の等号、等号公理E1–E5により規定。",
  },
  body: {
    en: [
      "<b>Equality</b> (=) is a binary predicate on terms that forms an atomic formula. The expression t₁ = t₂ states that the terms t₁ and t₂ denote the same object.",
      "Equality is governed by the equality axioms: E1 (reflexivity: x = x), E2 (symmetry), E3 (transitivity), E4 (function congruence), and E5 (predicate congruence). These axioms ensure that = behaves as a proper equivalence relation compatible with all operations.",
      "In this application, equality formulas are written as <code>t1 = t2</code> where t1 and t2 are terms. Equality is available when the logic system includes equality axioms (e.g., predicate logic with equality).",
    ],
    ja: [
      "<b>等号</b>（=）は項に対する二項述語で、原子論理式を形成します。式 t₁ = t₂ は項t₁とt₂が同じ対象を表すことを述べます。",
      "等号は等号公理により規定されます：E1（反射律: x = x）、E2（対称律）、E3（推移律）、E4（関数合同律）、E5（述語合同律）。これらの公理により、=はすべての演算と互換な適切な同値関係として振る舞います。",
      "本アプリケーションでは、等号論理式は <code>t1 = t2</code> のように書きます（t1, t2は項）。論理体系に等号公理が含まれている場合（述語論理+等号など）に利用可能です。",
    ],
  },
  formalNotation: "t_1 = t_2",
  relatedEntryIds: ["axiom-e1", "axiom-e2", "axiom-e3", "axiom-e4", "axiom-e5"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/First-order_logic#Equality_and_its_axioms",
      label: {
        en: "Equality in first-order logic (Wikipedia)",
        ja: "一階論理における等号 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E7%AD%89%E5%8F%B7",
      label: {
        en: "Equality sign (Wikipedia JA)",
        ja: "等号 (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/equality",
      label: {
        en: "Equality (nLab)",
        ja: "等号 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "equality",
    "等号",
    "=",
    "reflexivity",
    "反射律",
    "symmetry",
    "対称律",
    "transitivity",
    "推移律",
  ],
  order: 3,
};

const notationMetavariables: ReferenceEntry = {
  id: "notation-metavariables",
  category: "notation",
  title: {
    en: "Metavariables",
    ja: "メタ変数",
  },
  summary: {
    en: "Greek letters ($\\varphi , \\psi , \\chi$, ...) as placeholders for arbitrary formulas in axiom schemas.",
    ja: "ギリシャ文字（$\\varphi , \\psi , \\chi$, ...）を公理スキーマ内の任意の論理式のプレースホルダーとして使用。",
  },
  body: {
    en: [
      "<b>Metavariables</b> are placeholders that stand for arbitrary formulas. In axiom schemas like A1: $\\varphi \\to (\\psi \\to \\varphi)$, the symbols $\\varphi$ and $\\psi$ are metavariables that can be replaced with any well-formed formula.",
      "This application uses 22 Greek letters as metavariables: α, β, γ, δ, ε, ζ, η, θ, ι, κ, λ, μ, ν, ξ, π, ρ, σ, τ, υ, $\\varphi , \\chi , \\psi$, ω. The letter omicron (ο) is excluded to avoid confusion with the Latin letter 'o'.",
      "Metavariables support optional subscript digits for disambiguation. For example, $\\varphi$₁, $\\varphi$₂, $\\varphi$₀₁ are all distinct metavariables. Subscripts are treated as strings, so $\\varphi$₁, $\\varphi$₀₁, and $\\varphi$₀₀₁ are three different variables.",
      "In ASCII input, Greek letters are typed by name (e.g., <code>phi</code>, <code>psi</code>, <code>chi</code>). Subscripts are appended directly: <code>phi1</code>, <code>phi01</code>, or with underscore: <code>phi_1</code>, <code>phi_01</code>. In Unicode output, subscripts use dedicated Unicode subscript digits (₀–₉).",
    ],
    ja: [
      "<b>メタ変数</b>は任意の論理式を表すプレースホルダーです。公理スキーマ A1: $\\varphi \\to (\\psi \\to \\varphi)$ において、$\\varphi$や$\\psi$は任意の整形式論理式に置き換えることができるメタ変数です。",
      "本アプリケーションでは22のギリシャ文字をメタ変数として使用します：α, β, γ, δ, ε, ζ, η, θ, ι, κ, λ, μ, ν, ξ, π, ρ, σ, τ, υ, $\\varphi , \\chi , \\psi$, ω。オミクロン(ο)はラテン文字の'o'との混同を避けるため除外されています。",
      "メタ変数は曖昧さ回避のためにオプションの添字数字をサポートします。例えば、$\\varphi$₁, $\\varphi$₂, $\\varphi$₀₁はすべて異なるメタ変数です。添字は文字列として扱われるため、$\\varphi$₁, $\\varphi$₀₁, $\\varphi$₀₀₁は3つの異なる変数です。",
      "ASCII入力ではギリシャ文字は名前で入力します（例：<code>phi</code>, <code>psi</code>, <code>chi</code>）。添字は直接追加：<code>phi1</code>, <code>phi01</code>、またはアンダースコア付き：<code>phi_1</code>, <code>phi_01</code>。Unicode出力では添字に専用のUnicode下付き数字（₀–₉）を使用します。",
    ],
  },
  relatedEntryIds: [
    "notation-connectives",
    "notation-input-methods",
    "axiom-a1",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Metavariable",
      label: {
        en: "Metavariable (Wikipedia)",
        ja: "メタ変数 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Axiom_schema",
      label: {
        en: "Axiom schema (Wikipedia)",
        ja: "公理スキーマ (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "nlab",
      url: "https://ncatlab.org/nlab/show/metavariable",
      label: {
        en: "Metavariable (nLab)",
        ja: "メタ変数 (nLab)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "metavariable",
    "メタ変数",
    "Greek letter",
    "ギリシャ文字",
    "φ",
    "ψ",
    "χ",
    "phi",
    "psi",
    "chi",
    "subscript",
    "添字",
    "placeholder",
    "プレースホルダー",
  ],
  order: 4,
};

const notationTermOperations: ReferenceEntry = {
  id: "notation-term-operations",
  category: "notation",
  title: {
    en: "Term Operations",
    ja: "項演算",
  },
  summary: {
    en: "Binary operations on terms: + (addition), − (subtraction), × (multiplication), ÷ (division), ^ (power).",
    ja: "項に対する二項演算：+（加法）、−（減法）、×（乗法）、÷（除法）、^（冪乗）。",
  },
  body: {
    en: [
      "<b>Term operations</b> are binary infix operators on terms, used primarily in theories like Peano Arithmetic and Group Theory.",
      "Five operations are supported, listed from highest to lowest precedence: <b>^</b> (power, right-associative), <b>×</b> (multiplication, left-associative) and <b>÷</b> (division, left-associative) at the same level, <b>+</b> (addition, left-associative) and <b>−</b> (subtraction, left-associative) at the same level.",
      "In ASCII input: <code>+</code> for addition, <code>-</code> for subtraction, <code>*</code> for multiplication, <code>/</code> for division, <code>^</code> for power. In Unicode output: + is kept as-is, − uses U+2212 (minus sign), × uses U+00D7, ÷ uses U+00F7.",
      "Terms also include variables (lowercase identifiers like x, y, z), constants (digits like 0, 1), and function applications (like f(x), g(x, y)). Term metavariables use Greek letters (τ, σ, etc.) analogous to formula metavariables.",
    ],
    ja: [
      "<b>項演算</b>は項に対する二項中置演算子で、主にペアノ算術や群論などの理論で使用されます。",
      "5つの演算をサポートしており、優先順位の高い順に：<b>^</b>（冪乗、右結合）、<b>×</b>（乗法、左結合）と<b>÷</b>（除法、左結合）が同レベル、<b>+</b>（加法、左結合）と<b>−</b>（減法、左結合）が同レベルです。",
      "ASCII入力では：<code>+</code>で加法、<code>-</code>で減法、<code>*</code>で乗法、<code>/</code>で除法、<code>^</code>で冪乗。Unicode出力では：+はそのまま、−はU+2212（マイナス記号）、×はU+00D7、÷はU+00F7を使用します。",
      "項には変数（x, y, zなどの小文字識別子）、定数（0, 1などの数字）、関数適用（f(x), g(x, y)など）も含まれます。項メタ変数は論理式メタ変数と同様にギリシャ文字（τ, σなど）を使用します。",
    ],
  },
  formalNotation: "+, -, \\times, \\div, \\hat{}",
  relatedEntryIds: [
    "notation-precedence",
    "notation-equality",
    "theory-peano",
    "theory-group",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Term_(logic)",
      label: {
        en: "Term (logic) (Wikipedia)",
        ja: "項 (論理学) (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-ja",
      url: "https://ja.wikipedia.org/wiki/%E9%A0%85_(%E6%95%B0%E7%90%86%E8%AB%96%E7%90%86%E5%AD%A6)",
      label: {
        en: "Term (mathematical logic) (Wikipedia JA)",
        ja: "項 (数理論理学) (Wikipedia)",
      },
      documentLanguage: "ja",
    },
    {
      type: "mathworld",
      url: "https://mathworld.wolfram.com/Term.html",
      label: {
        en: "Term (MathWorld)",
        ja: "項 (MathWorld)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "term",
    "項",
    "operation",
    "演算",
    "addition",
    "加法",
    "+",
    "multiplication",
    "乗法",
    "×",
    "power",
    "冪乗",
    "^",
    "function",
    "関数",
    "variable",
    "変数",
    "constant",
    "定数",
  ],
  order: 5,
};

const notationPrecedence: ReferenceEntry = {
  id: "notation-precedence",
  category: "notation",
  title: {
    en: "Operator Precedence and Associativity",
    ja: "演算子の優先順位と結合性",
  },
  summary: {
    en: "Binding strength and associativity rules that determine how expressions are parsed.",
    ja: "式の解析方法を決定する束縛の強さと結合性の規則。",
  },
  body: {
    en: [
      "<b>Operator precedence</b> determines the order in which operators bind their operands when parentheses are omitted. Higher precedence means tighter binding. The associativity of an operator determines grouping when operators of equal precedence are chained.",
      "<b>Formula connective precedence</b> (highest to lowest): $\\lnot$ (prefix, strongest) > $\\land$ (left-associative) > $\\lor$ (left-associative) > $\\to$ (right-associative) > $\\leftrightarrow$ (right-associative, weakest). Example: $\\lnot \\varphi \\land \\psi \\to \\chi$ is parsed as ($((\\lnot \\varphi) \\land \\psi) \\to \\chi$).",
      "<b>Term operation precedence</b> (highest to lowest): ^ (right-associative, strongest) > ×, ÷ (left-associative) > +, − (left-associative, weakest). Example: a + b × c ^ d is parsed as (a + (b × (c ^ d))).",
      "<b>Quantifiers</b> bind tighter than connectives: $\\forall x. \\varphi \\to \\psi$ is $(\\forall x. \\varphi) \\to \\psi$. Use explicit parentheses for $\\forall x.(\\varphi \\to \\psi)$. The Pratt parsing algorithm used internally assigns binding powers to achieve minimal parenthesization in output.",
    ],
    ja: [
      "<b>演算子の優先順位</b>は、括弧が省略された場合に演算子がオペランドを束縛する順序を決定します。優先順位が高いほど強く束縛します。<b>結合性</b>は、同じ優先順位の演算子が連鎖した場合のグルーピングを決定します。",
      "<b>論理式の結合子の優先順位</b>（高$\\to$低）：$\\lnot$（前置、最強）> $\\land$（左結合）> $\\lor$（左結合）> $\\to$（右結合）> $\\leftrightarrow$（右結合、最弱）。例：$\\lnot \\varphi \\land \\psi \\to \\chi$ は ($((\\lnot \\varphi) \\land \\psi) \\to \\chi$) と解析されます。",
      "<b>項演算の優先順位</b>（高$\\to$低）：^（右結合、最強）> ×, ÷（左結合）> +, −（左結合、最弱）。例：a + b × c ^ d は (a + (b × (c ^ d))) と解析されます。",
      "<b>量化子</b>は結合子より強く束縛します：$\\forall x. \\varphi \\to \\psi$ は $(\\forall x. \\varphi) \\to \\psi$ です。$\\forall x.(\\varphi \\to \\psi)$ とするには明示的な括弧を使用します。内部で使用されるPratt解析アルゴリズムは出力における最小括弧化を実現するために束縛力を割り当てます。",
    ],
  },
  relatedEntryIds: [
    "notation-connectives",
    "notation-quantifiers",
    "notation-term-operations",
  ],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Order_of_operations",
      label: {
        en: "Order of operations (Wikipedia)",
        ja: "演算の順序 (Wikipedia)",
      },
      documentLanguage: "en",
    },
    {
      type: "wikipedia-en",
      url: "https://en.wikipedia.org/wiki/Pratt_parser",
      label: {
        en: "Pratt parser (Wikipedia)",
        ja: "Prattパーサー (Wikipedia)",
      },
      documentLanguage: "en",
    },
  ],
  keywords: [
    "precedence",
    "優先順位",
    "associativity",
    "結合性",
    "binding power",
    "束縛力",
    "Pratt parser",
    "parentheses",
    "括弧",
    "order of operations",
    "演算の順序",
  ],
  order: 6,
};

const notationInputMethods: ReferenceEntry = {
  id: "notation-input-methods",
  category: "notation",
  title: {
    en: "Input Methods",
    ja: "入力方法",
  },
  summary: {
    en: "How to type logical symbols using ASCII shortcuts that are converted to Unicode.",
    ja: "ASCII短縮表記からUnicodeへの変換による論理記号の入力方法。",
  },
  body: {
    en: [
      "<b>Input methods</b> allow typing logical symbols using standard ASCII characters. The application converts ASCII input to proper Unicode symbols for display.",
      "<b>Connective input:</b> <code>-></code> or <code>implies</code> $\\to \\to$, <code>/\\</code> or <code>and</code> $\\to \\land$, <code>\\/</code> or <code>or</code> $\\to \\lor$, <code>~</code> or <code>not</code> $\\to \\lnot$, <code><-></code> or <code>iff</code> $\\to \\leftrightarrow$. The completion system also suggests symbols as you type.",
      "<b>Quantifier input:</b> <code>all x.</code> or <code>forall x.</code> $\\to \\forall$x., <code>ex x.</code> or <code>exists x.</code> $\\to \\exists$x. The dot (<code>.</code>) is required to delimit the quantifier scope.",
      "<b>Greek letter input:</b> Type the letter name to input a Greek letter: <code>phi</code> $\\to \\varphi$, <code>psi</code> $\\to \\psi$, <code>chi</code> $\\to \\chi$, <code>alpha</code> $\\to$ α, etc. Subscripts are appended: <code>phi1</code> $\\to \\varphi$₁, <code>phi_01</code> $\\to \\varphi$₀₁. The tab-completion popup shows available completions.",
      "<b>Term input:</b> Variables are lowercase identifiers (x, y, z), predicates start with uppercase (P, Q), constants are digits (0, 1). Functions use parenthesized arguments: f(x), g(x, y).",
    ],
    ja: [
      "<b>入力方法</b>により、標準的なASCII文字を使って論理記号を入力できます。アプリケーションはASCII入力を適切なUnicode記号に変換して表示します。",
      "<b>結合子の入力：</b> <code>-></code> または <code>implies</code> $\\to \\to$、<code>/\\</code> または <code>and</code> $\\to \\land$、<code>\\/</code> または <code>or</code> $\\to \\lor$、<code>~</code> または <code>not</code> $\\to \\lnot$、<code><-></code> または <code>iff</code> $\\to \\leftrightarrow$。補完システムが入力中に記号を提案します。",
      "<b>量化子の入力：</b> <code>all x.</code> または <code>forall x.</code> $\\to \\forall$x.、<code>ex x.</code> または <code>exists x.</code> $\\to \\exists$x.。ドット（<code>.</code>）は量化子のスコープを区切るために必須です。",
      "<b>ギリシャ文字の入力：</b> 文字名を入力してギリシャ文字を入力します：<code>phi</code> $\\to \\varphi$、<code>psi</code> $\\to \\psi$、<code>chi</code> $\\to \\chi$、<code>alpha</code> $\\to$ α、など。添字は追加します：<code>phi1</code> $\\to \\varphi$₁、<code>phi_01</code> $\\to \\varphi$₀₁。タブ補完ポップアップが利用可能な補完を表示します。",
      "<b>項の入力：</b> 変数は小文字識別子（x, y, z）、述語は大文字開始（P, Q）、定数は数字（0, 1）です。関数は括弧付き引数を使用します：f(x), g(x, y)。",
    ],
  },
  relatedEntryIds: [
    "notation-connectives",
    "notation-quantifiers",
    "notation-metavariables",
  ],
  externalLinks: [],
  keywords: [
    "input",
    "入力",
    "ASCII",
    "Unicode",
    "completion",
    "補完",
    "shortcut",
    "ショートカット",
    "input method",
    "入力方法",
    "tab completion",
    "タブ補完",
  ],
  order: 7,
};

// ============================================================
// エクスポート
// ============================================================

/**
 * 全リファレンスエントリの一覧。
 *
 * 新しいエントリを追加する場合はここに追加し、
 * referenceContent.test.ts にもテストを追加すること。
 */
export const allReferenceEntries: readonly ReferenceEntry[] = [
  // Guides
  guideWhatIsFormalProof,
  guideBasicOperations,
  guideFirstQuestWalkthrough,
  guideIntroToPropositionalLogic,
  guideHilbertProofMethod,
  // Axioms
  axiomA1,
  axiomA2,
  axiomA3,
  axiomM3,
  axiomEfq,
  axiomDne,
  axiomA4,
  axiomA5,
  axiomExDef,
  axiomE1,
  axiomE2,
  axiomE3,
  axiomE4,
  axiomE5,
  // Inference Rules
  ruleMP,
  ruleGen,
  ruleNdOverview,
  ruleNdImplication,
  ruleNdConjunction,
  ruleNdDisjunction,
  ruleScOverview,
  ruleScStructural,
  ruleScLogical,
  // Logic Systems
  systemLukasiewicz,
  systemMendelson,
  systemMinimal,
  systemIntuitionistic,
  systemClassical,
  systemPredicateLogic,
  // Notation
  notationConnectives,
  notationQuantifiers,
  notationEquality,
  notationMetavariables,
  notationTermOperations,
  notationPrecedence,
  notationInputMethods,
  // Concepts
  conceptSubstitution,
  conceptFreeVariable,
  conceptUnification,
  conceptDeductionTheorem,
  conceptGlivenko,
  conceptKurodaTranslation,
  conceptSystemEquivalence,
  conceptSoundness,
  conceptCompleteness,
  conceptLowenheimSkolem,
  conceptCompactness,
  conceptProofTheoreticSemantics,
  conceptCutElimination,
  conceptCurryHoward,
  conceptAdmissibleDerivable,
  conceptContextSharingIndependence,
  conceptPredicateSemantics,
  conceptSemanticValidity,
  conceptTabLkEquivalence,
  conceptConsistencyFromCutElimination,
  conceptAxiomIndependence,
  conceptAnalyticTableau,
  conceptSpeedUpTheorem,
  conceptFormulaSchema,
  conceptTautology,
  // Theories
  theoryPeanoArithmetic,
  theoryGroupTheory,
] as const;
