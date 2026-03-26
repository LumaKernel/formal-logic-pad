/**
 * English translations for quests.
 *
 * This file contains all English translations for quest titles, descriptions,
 * hints, and learning points, as well as category translations.
 */
import type {
  CategoryTranslation,
  QuestTranslation,
} from "./questLocalization";

export const questTranslationsEn: Readonly<
  Record<string, QuestTranslation | undefined>
> = {
  "prop-01": {
    title: "Identity",
    description: "Prove φ → φ. Experience the correspondence SKK = I.",
    hints: [
      "Combine specific instances of A1 and A2.",
      "Try making the instance A1: φ → ((φ → φ) → φ).",
      "Combine with A2 to derive (φ → (φ → φ)) → (φ → φ).",
    ],
    learningPoint:
      "A2 (S axiom) corresponds to 'distribution of function application'. This proof corresponds to SKK = I.",
  },
  "prop-02": {
    title: "Composition of Constant Functions",
    description: "Prove ψ → (φ → φ). Use A1 to 'lift' a known theorem.",
    hints: [
      "First derive φ → φ using the same procedure as Q-01.",
      "Make the instance A1: (φ → φ) → (ψ → (φ → φ)).",
      "Combine with MP to finish.",
    ],
    learningPoint:
      "A1 (K axiom) means 'lift a conclusion under a premise'. Already proved theorems can be reused.",
  },
  "prop-03": {
    title: "Preparation for Transitivity",
    description:
      "Prove (φ → ψ) → ((ψ → χ) → (φ → ψ)). A direct instance of A1.",
    hints: [
      "This formula is an instance of A1.",
      "Substitute φ with 'φ → ψ' and ψ with 'ψ → χ' in A1.",
    ],
    learningPoint:
      "Any formula can be substituted into axiom metavariables. Not just simple formulas, but also implication formulas.",
  },
  "prop-04": {
    title: "Hypothetical Syllogism",
    description:
      "Prove (φ → ψ) → ((ψ → χ) → (φ → χ)). The most fundamental and frequently used lemma in Hilbert systems.",
    hints: [
      "Use A2 to create a form φ→(ψ→χ), and lift premises with A1.",
      "Use A2: (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ)) directly.",
      "Lift ψ→χ under the premise φ with A1, then distribute with the S axiom.",
    ],
    learningPoint:
      "Hypothetical syllogism is the most fundamental and frequently used lemma in Hilbert systems. It is used extensively in subsequent proofs.",
  },
  "prop-05": {
    title: "Implication Weakening",
    description: "Prove φ → (ψ → (χ → ψ)). Double application of the K axiom.",
    hints: [
      "Lift an instance of A1 with another A1.",
      "First create A1: ψ → (χ → ψ).",
      "Lift with A1: (ψ → (χ → ψ)) → (φ → (ψ → (χ → ψ))).",
    ],
    learningPoint:
      "Double application of K axiom. The operation of 'adding unnecessary premises'.",
  },
  "prop-06": {
    title: "Special Case of S Axiom",
    description:
      "Prove (φ → (φ → ψ)) → (φ → ψ). Compress an 'implication requiring φ twice' into one.",
    hints: [
      "Try substituting ψ with φ in A2.",
      "Use A2: (φ → (φ → ψ)) → ((φ → φ) → (φ → ψ)).",
      "Derive φ → φ using Q-01's procedure, then combine transitively.",
    ],
    learningPoint:
      "'φ → (φ → ψ)' is an 'implication requiring φ twice'. The S axiom can compress it to require φ only once.",
  },
  "prop-07": {
    title: "C Combinator (Permutation)",
    description:
      "Prove (φ → (ψ → χ)) → (ψ → (φ → χ)). Swap the order of premises.",
    hints: [
      "Lift ψ into φ → ... with A1, then distribute with A2.",
      "First use A1: ψ → (φ → ψ).",
      "Connect with transitivity to complete.",
    ],
    learningPoint:
      "Corresponds to the C combinator. The order of premises can be freely swapped (though it requires effort).",
  },
  "prop-08": {
    title: "Three-Step Transitivity Chain",
    description:
      "Prove (φ → ψ) → ((ψ → χ) → ((χ → θ) → (φ → θ))). Apply transitivity twice.",
    hints: [
      "Apply transitivity (Q-04) twice.",
      "First derive (φ → ψ) → ((ψ → χ) → (φ → χ)) using transitivity.",
      "Then derive (φ → χ) → ((χ → θ) → (φ → θ)) using transitivity, and combine.",
    ],
    learningPoint:
      "Transitivity can be extended to chains of arbitrary length.",
  },
  "prop-10": {
    title: "B Combinator (Composition)",
    description:
      "Prove (ψ → χ) → ((φ → ψ) → (φ → χ)). Transitivity with swapped premises.",
    hints: [
      "Start from transitivity (Q-04).",
      "Transitivity: (φ → ψ) → ((ψ → χ) → (φ → χ))",
      "Apply permutation (Q-07) to transitivity to swap the premises.",
    ],
    learningPoint:
      "B combinator: Bxyz = x(yz). Corresponds to function composition.",
  },
  "prop-11": {
    title: "Premise Confluence",
    description: "Prove (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ)). A2 itself.",
    hints: [
      "This formula is an instance of a certain axiom.",
      "Look closely at A2.",
    ],
    learningPoint:
      "Even seemingly difficult formulas can be axiom instances. The ability to recognize metavariable substitution patterns is crucial.",
  },
  "prop-12": {
    title: "Left Association of Implication",
    description:
      "Prove ((φ → ψ) → (φ → χ)) → (φ → (ψ → χ)). The reverse direction of the deduction theorem.",
    hints: [
      "Lift ψ into φ → ... using A1.",
      "Start from A1: ψ → (φ → ψ).",
      "Transform the premise side of (φ → ψ) → (φ → χ) using transitivity, and organize with permutation (Q-07).",
    ],
    learningPoint:
      "Technique for converting between 'right association' and 'left association' of implications. The reverse direction of the deduction theorem.",
  },
  "prop-13": {
    title: "Frege's Theorem",
    description:
      "Prove (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ)). A historically important law.",
    hints: [
      "This is also an instance of a certain axiom.",
      "The same goal as Q-11, but historically called 'Frege's theorem'.",
    ],
    learningPoint:
      "Frege was the first to explicitly adopt this law as an axiom. The same theorem can have different names in different contexts.",
  },
  "prop-14": {
    title: "Double Implication Distribution",
    description:
      "Prove (φ → ψ) → ((φ → (ψ → χ)) → (φ → χ)). Rearranging premises.",
    hints: [
      "This has the form of applying transitivity to A2's conclusion.",
      "A2: (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))",
      "Swap the order of premises using permutation (Q-07).",
    ],
    learningPoint:
      "Rearranging premises is a frequent operation in Hilbert systems. It requires practice.",
  },
  "prop-15": {
    title: "Double Negation Introduction (DNI)",
    description:
      "Prove φ → ¬¬φ. The first problem that seriously uses negation axiom A3.",
    hints: [
      "Use A3: (¬φ → ¬ψ) → (ψ → φ).",
      "Substitute φ=¬¬φ, ψ=φ in A3: (¬¬¬φ → ¬φ) → (φ → ¬¬φ).",
      "It helps to first prove the intermediate lemma Clavius' Law '(¬α → α) → α'.",
    ],
    learningPoint:
      "Double negation introduction is fundamental in classical logic. A typical use of A3, and the starting point for subsequent negation-related proofs.",
  },
  "prop-16": {
    title: "Modus Tollens",
    description:
      "Prove (φ → ψ) → (¬ψ → ¬φ). Contraposition (negative reasoning).",
    hints: [
      "Start from DNI (Q-15): ψ → ¬¬ψ.",
      "Substitute φ=¬φ, ψ=¬ψ in A3: (¬¬φ → ¬¬ψ) → (¬ψ → ¬φ).",
      "Use B combinator (Q-10) and DNE (Q-17) to transform φ → ψ into ¬¬φ → ¬¬ψ.",
    ],
    learningPoint:
      "Modus Tollens is a direct consequence of contraposition. Derived using the combination of DNI and A3.",
  },
  "prop-17": {
    title: "Double Negation Elimination (DNE)",
    description:
      "Prove ¬¬φ → φ. The watershed between classical and intuitionistic logic.",
    hints: [
      "Apply DNI (Q-15) to ¬φ: ¬φ → ¬¬¬φ.",
      "Substitute φ=φ, ψ=¬¬φ in A3: (¬φ → ¬¬¬φ) → (¬¬φ → φ).",
      "Combine with MP for a 3-step completion (when using DNI as a lemma).",
    ],
    learningPoint:
      "DNE is the watershed between classical and intuitionistic logic. In the Lukasiewicz system, it is derivable from A3 via DNI.",
  },
  "prop-18": {
    title: "Ex Falso Quodlibet",
    description: "Prove ¬φ → (φ → ψ). From a contradiction, anything follows.",
    hints: [
      "Create A1: ¬φ → (¬ψ → ¬φ).",
      "Substitute φ=ψ, ψ=φ in A3: (¬ψ → ¬φ) → (φ → ψ).",
      "Connect with transitivity (HS) for a 3-step completion.",
    ],
    learningPoint:
      "In classical logic, any proposition can be derived from a contradiction (ex falso quodlibet). Concisely provable using the A1+A3 combination.",
  },
  "prop-19": {
    title: "Converse Contraposition",
    description: "Prove (¬ψ → ¬φ) → (φ → ψ). A3 itself.",
    hints: [
      "This is an instance of a certain axiom.",
      "Look closely at A3: (¬φ → ¬ψ) → (ψ → φ).",
    ],
    learningPoint:
      "Reconfirm that A3 is exactly this form. The ability to recognize metavariable substitution patterns is crucial.",
  },
  "prop-20": {
    title: "Law of Excluded Middle",
    description:
      "Prove ¬φ ∨ φ. Using the definition α ∨ β ≡ ¬α → β, this is equivalent to DNE.",
    hints: [
      "Disjunction α ∨ β is defined as ¬α → β.",
      "So the goal is equivalent to ¬¬φ → φ (double negation elimination).",
      "Reuse the proof of Q-17 (DNE).",
    ],
    learningPoint:
      "Using the definition α ∨ β ≡ ¬α → β, the law of excluded middle is equivalent to double negation elimination (DNE).",
  },
  "prop-21": {
    title: "Peirce's Law",
    description:
      "Prove ((φ → ψ) → φ) → φ. A law specific to classical logic. Equivalent to LEM and DNE.",
    hints: [
      "A complex proof requiring multiple uses of A3 (contraposition).",
      "Use ex falso (Q-18) and transitivity.",
      "Combining with DNE (Q-17) provides better clarity.",
    ],
    learningPoint:
      "Peirce's law is one of the equivalent conditions distinguishing classical from intuitionistic logic. Equivalent to LEM and DNE.",
  },
  "prop-22": {
    title: "Conjunction Introduction",
    description:
      "Prove φ → (ψ → (φ ∧ ψ)). Uses the definition α ∧ β ≡ ¬(α → ¬β).",
    hints: [
      "Conjunction α ∧ β is defined as ¬(α → ¬β).",
      "Expanding the goal: φ → (ψ → ¬(φ → ¬ψ)).",
      "A very long proof combining A1, A2, A3, and double negation handling.",
    ],
    learningPoint:
      "Handling conjunction directly in a Hilbert system is very laborious. Natural deduction is far more concise.",
  },
  "prop-23": {
    title: "Conjunction Elimination",
    description:
      "Prove (φ ∧ ψ) → φ. Expand the definition α ∧ β ≡ ¬(α → ¬β) and use double negation elimination.",
    hints: [
      "Expand conjunction by definition: ¬(φ → ¬ψ) → φ.",
      "Transform by taking the contrapositive.",
      "Combine A1, A3, and transitivity.",
    ],
    learningPoint:
      "Conjunction elimination also requires definition expansion. Left projection (φ∧ψ→φ) and right projection (φ∧ψ→ψ) are proved separately.",
  },
  "prop-24": {
    title: "De Morgan's Law",
    description:
      "Prove ¬(φ ∨ ψ) → (¬φ ∧ ¬ψ). Expand the definitions of disjunction and conjunction, and use properties of negation.",
    hints: [
      "Disjunction definition: φ ∨ ψ ≡ ¬φ → ψ. Conjunction definition: α ∧ β ≡ ¬(α → ¬β).",
      "Expanding: ¬(¬φ → ψ) → ¬(¬φ → ¬¬ψ).",
      "Use double negation introduction ψ → ¬¬ψ to transform the interior.",
    ],
    learningPoint:
      "De Morgan's law is an important equivalence in propositional logic. A typical example of proofs becoming very long in Hilbert systems.",
  },
  "prop-25": {
    title: "Triple Negation Elimination",
    description: "Prove ¬¬¬φ → ¬φ. Reduce triple negation to single negation.",
    hints: [
      "Consider applying DNE (¬¬φ → φ) to ¬φ to directly get ¬¬¬φ → ¬φ.",
      "Substitute α with ¬φ in DNE: ¬¬α → α.",
      "If DNE is available as a lemma, it completes in 1 step.",
    ],
    learningPoint:
      "Triple negation elimination is a direct consequence of DNE. ¬¬(¬φ) → ¬φ is an instance of DNE. However, the proof is long when including DNE itself.",
  },
  "prop-26": {
    title: "Consequentia Mirabilis (CM)",
    description:
      "Prove (φ → ¬φ) → ¬φ. Derive negation from a self-contradictory hypothesis.",
    hints: [
      "Combine the special case of S axiom (Q-06) and identity (Q-01).",
      "Consider A2: (φ → (φ → ¬φ)) → ((φ → φ) → (φ → ¬φ)), the φ→¬φ version.",
      "(φ → ¬φ) has the form of 'implication requiring φ twice'. Q-06's pattern applies.",
    ],
    learningPoint:
      "Consequentia mirabilis is a classical theorem of Latin origin. A reasoning pattern that eliminates self-contradictory hypotheses.",
  },
  "prop-27": {
    title: "Contraposition Law (CON2)",
    description:
      "Prove (φ → ¬ψ) → (ψ → ¬φ). The second form of contraposition involving negation.",
    hints: [
      "Create the form ψ → ¬¬ψ → ... using DNI (ψ → ¬¬ψ) and transitivity.",
      "Use A3: (¬α → ¬β) → (β → α).",
      "Take the contrapositive of φ → ¬ψ to get ¬¬ψ → ¬φ, then combine with DNI and transitivity.",
    ],
    learningPoint:
      "There are 4 forms of contraposition (CON1-CON4). CON1 (Modus Tollens) and CON2 are provable even in the SK system.",
  },
  "prop-28": {
    title: "Clavius' Law (CM*)",
    description:
      "Prove (¬φ → φ) → φ. The dual of CM. An important theorem of classical logic.",
    hints: [
      "A strategy using DNE (¬¬φ → φ) is effective.",
      "Create the form (¬φ → φ) → (¬φ → ¬¬φ) → ... using transitivity.",
      "Apply CM (Q-26): (α → ¬α) → ¬α to ¬φ and bring it to the form ¬φ → ¬¬φ → φ.",
    ],
    learningPoint:
      "Clavius' law is specific to classical logic. It cannot be proved in intuitionistic logic. An important theorem paired with CM.",
  },
  "prop-29": {
    title: "Tertium Non Datur (TND)",
    description:
      "Prove (φ → ψ) → ((¬φ → ψ) → ψ). The foundation of case-splitting reasoning.",
    hints: [
      "Start from CM* (Q-28): (¬α → α) → α.",
      "From the two premises φ → ψ and ¬φ → ψ, derive ψ.",
      "Connect (¬ψ → ¬φ) and (¬φ → ψ) using transitivity, and bring it to the CM* pattern.",
    ],
    learningPoint:
      "TND (tertium non datur) is the formalization of case-splitting reasoning. Closely related to LEM, it is a fundamental law of classical logic.",
  },
  "prop-30": {
    title: "Law of Non-Contradiction (LNC)",
    description:
      "Prove ¬(φ ∧ ¬φ). The fundamental law that contradiction cannot occur.",
    hints: [
      "Expand the conjunction definition: α ∧ β ≡ ¬(α → ¬β).",
      "φ ∧ ¬φ = ¬(φ → ¬¬φ), so the goal is ¬¬(φ → ¬¬φ).",
      "Apply DNI (α → ¬¬α) to φ → ¬¬φ: derive (φ → ¬¬φ), then apply DNI to double-negate it.",
    ],
    learningPoint:
      "The law of non-contradiction (LNC) is a fundamental law provable even in minimal logic HM. Expanding the conjunction definition reveals it is provable via DNI.",
  },
  "prop-31": {
    title: "Right Conjunction Elimination",
    description:
      "Prove (φ ∧ ψ) → ψ. Right projection of conjunction (extracting the right element).",
    hints: [
      "Expand conjunction by definition: ¬(φ → ¬ψ) → ψ.",
      "Combine ex falso (Q-18) and A3 (contraposition).",
      "Similar technique to Q-23's left projection, but the extraction side differs, requiring a slightly different approach.",
    ],
    learningPoint:
      "Conjunction elimination requires both left projection (φ∧ψ→φ) and right projection (φ∧ψ→ψ). In Hilbert systems, each is proved independently.",
  },
  "prop-32": {
    title: "Disjunction Elimination",
    description:
      "Prove (φ ∨ ψ) → ((φ → χ) → ((ψ → χ) → χ)). The formalization of case-splitting reasoning.",
    hints: [
      "Expand the disjunction definition: φ ∨ ψ ≡ ¬φ → ψ.",
      "TND (Q-29)'s idea works: derive χ from φ → χ and ¬φ → ψ → χ.",
      "A long proof with heavy use of permutation (Q-07) and transitivity.",
    ],
    learningPoint:
      "Disjunction elimination is the formalization of case-splitting reasoning. One rule in natural deduction, but a very long proof in Hilbert systems.",
  },
  "prop-33": {
    title: "Implication Form of MP",
    description:
      "Prove φ → ((φ → ψ) → ψ). Express Modus Ponens in implication form. The formalization of 'assuming φ and φ→ψ yields ψ' via the deduction theorem.",
    hints: [
      "By the deduction theorem: assuming φ and then φ→ψ, MP gives ψ.",
      "Make the instance A1: φ → ((φ → ψ) → φ).",
      "Distribute with A2 and combine with the identity law.",
    ],
    learningPoint:
      "The implication form of MP expresses the MP rule itself within the object language. A basic application of the deduction theorem, formalizing that assuming φ lets you derive ψ from φ→ψ.",
  },
  "prop-34": {
    title: "Implication Weakening Elimination",
    description:
      "Prove ((φ → ψ) → χ) → (ψ → χ). 'ψ alone suffices to prove φ→ψ'. A typical application pattern of the deduction theorem.",
    hints: [
      "A1: ψ → (φ → ψ) lets you derive φ → ψ from ψ.",
      "Connect A1 and the hypothesis (φ→ψ)→χ using transitivity (Q-04).",
      "Using B combinator (Q-10) allows a more concise construction.",
    ],
    learningPoint:
      "By the deduction theorem: 'assume ψ → A1 gives φ→ψ → hypothesis (φ→ψ)→χ gives χ'. A combination of A1's 'lifting' and transitivity.",
  },
  "prop-35": {
    title: "Identity in Mendelson's System",
    description:
      "Prove φ → φ in the Mendelson system (A1, A2, M3). The same proof as in the Lukasiewicz system works. The deduction theorem's proof structure is common across systems.",
    hints: [
      "The exact same proof as Q-01 (Lukasiewicz system) works.",
      "The identity proof uses only A1 and A2, so the difference between A3/M3 doesn't matter.",
      "This is a concrete example that the deduction theorem proof depends only on A1 and A2.",
    ],
    learningPoint:
      "The identity law is provable with A1+A2 alone. The same proof works in Lukasiewicz/Mendelson/Classical(HK)/Intuitionistic(HJ). The core of the deduction theorem lies in A1(K) and A2(S).",
  },
  "prop-36": {
    title: "Self-Weakening",
    description:
      "Prove φ → (φ → φ). The simplest example of substituting the same formula into A1's metavariables.",
    hints: [
      "Try substituting ψ with φ in A1: φ → (ψ → φ).",
      "A1[φ/φ, ψ/φ] = φ → (φ → φ). One axiom is enough.",
    ],
    learningPoint:
      "The same formula can be substituted into A1's metavariables. The simplest instance of A1.",
  },
  "prop-37": {
    title: "Weakening of Implication Formula",
    description:
      "Prove (φ → ψ) → (χ → (φ → ψ)). Practice substituting an implication formula into A1's metavariables.",
    hints: [
      "Try substituting an implication formula into φ of A1: φ → (ψ → φ).",
      "A1[φ/(φ→ψ), ψ/χ] = (φ→ψ) → (χ → (φ→ψ)).",
    ],
    learningPoint:
      "Any formula can be substituted into A1's metavariables. An example of substituting an entire implication formula for φ.",
  },
  "prop-38": {
    title: "A2 Self-Variable Application",
    description:
      "Prove (φ → (φ → ψ)) → ((φ → φ) → (φ → ψ)). Substitute the same formula into A2's metavariables.",
    hints: [
      "Try substituting ψ with φ in A2: (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ)).",
      "A2[φ/φ, ψ/φ, χ/ψ] completes it.",
    ],
    learningPoint:
      "A2's metavariables can also be freely substituted. Substituting φ for ψ reveals the pattern for handling 'duplicate premises'.",
  },
  "prop-39": {
    title: "Conclusion Weakening",
    description:
      "Prove (φ → ψ) → (φ → (χ → ψ)). The operation of 'adding an unnecessary premise to the conclusion'.",
    hints: [
      "A1: ψ → (χ → ψ) can weaken the conclusion.",
      "Lift A1 to create φ → (ψ → (χ → ψ)).",
      "Distribute with A2 to get (φ→ψ) → (φ→(χ→ψ)).",
    ],
    learningPoint:
      "Weakening the conclusion is a common pattern. The A1+A2 combination lets you 'add extra premises'.",
  },
  "prop-40": {
    title: "Reverse Transitivity (B' Combinator)",
    description:
      "Prove (φ → ψ) → ((ψ → χ) → (φ → χ)). Transitivity (Q-04) with swapped premises. A variant of the B combinator.",
    hints: [
      "Start from B combinator (Q-10): (ψ→χ)→((φ→ψ)→(φ→χ)).",
      "Distribute with A2 to link (ψ→χ)→(φ→ψ) and (ψ→χ)→(φ→χ).",
      "Lift (φ→ψ) under the (ψ→χ) premise with A1 and compose.",
    ],
    learningPoint:
      "B' combinator is the premise-swapped version of transitivity. An application of the B combinator + A2 + A1 transitivity composition pattern.",
  },
  "prop-41": {
    title: "W Combinator (Self-Application)",
    description:
      "Prove (φ → (φ → ψ)) → (φ → ψ). 'Self-application' using the same premise twice. Combination of A2 and identity.",
    hints: [
      "A2[φ/φ, ψ/φ, χ/ψ] gives (φ→(φ→ψ))→((φ→φ)→(φ→ψ)).",
      "Derive the identity φ→φ (Q-01).",
      "Combine A2 + A1: from (φ→(φ→ψ)), get (φ→φ)→(φ→ψ) and φ→φ to obtain (φ→ψ).",
    ],
    learningPoint:
      "W combinator: Wxy = xyy. Formalizes 'reuse of premises'. Derived from A2(S axiom) + identity(I).",
  },
  "prop-42": {
    title: "Forward Application of A2",
    description:
      "Prove ((φ → (ψ → χ)) → (φ → ψ)) → ((φ → (ψ → χ)) → (φ → χ)). Apply A2 under a hypothesis.",
    hints: [
      "Place A2: (φ→(ψ→χ))→((φ→ψ)→(φ→χ)).",
      "Use another A2 to distribute under the common premise (φ→(ψ→χ)).",
      "A short proof of just applying A2 to A2.",
    ],
    learningPoint:
      "Pattern of applying A2(S axiom) to itself. Distribution under a hypothesis is achieved by repeated application of A2.",
  },
  "prop-43": {
    title: "Forward Composition of Implication",
    description:
      "Prove (φ → (ψ → χ)) → ((θ → φ) → (θ → (ψ → χ))). 4-variable version of B combinator. Composing through a forward hypothesis.",
    hints: [
      "Think of it as an instance of B combinator (Q-10).",
      "Lift (φ→(ψ→χ)) under the θ premise with A1.",
      "Distribute with A2 and perform transitivity composition.",
    ],
    learningPoint:
      "Variable substitution version of B combinator. Substituting complex formulas for ψ, χ in (ψ→χ)→((φ→ψ)→(φ→χ)) yields new theorems.",
  },
  "prop-44": {
    title: "Disjunction Introduction",
    description:
      "Prove φ → (φ ∨ ψ). Use the definition φ ∨ ψ ≡ ¬φ → ψ to show left introduction.",
    hints: [
      "Expand the disjunction definition: φ ∨ ψ ≡ ¬φ → ψ.",
      "The goal reduces to φ → (¬φ → ψ). This is a generalized form of EFQ.",
      "Can be proved by combining TND + A3.",
    ],
    learningPoint:
      "Disjunction introduction is trivial in natural deduction, but in Hilbert systems it requires EFQ and definition expansion, resulting in a long proof.",
  },
  "prop-45": {
    title: "Commutativity of Disjunction",
    description: "Prove (φ ∨ ψ) → (ψ ∨ φ). Swap the sides of a disjunction.",
    hints: [
      "Expand the disjunction definition: φ ∨ ψ ≡ ¬φ → ψ.",
      "The goal reduces to (¬φ → ψ) → (¬ψ → φ).",
      "Combine contraposition and double negation elimination.",
    ],
    learningPoint:
      "Commutativity of disjunction is intuitively obvious, but in Hilbert systems it requires the combination of contraposition and double negation elimination.",
  },
  "prop-46": {
    title: "Commutativity of Conjunction",
    description: "Prove (φ ∧ ψ) → (ψ ∧ φ). Swap the sides of a conjunction.",
    hints: [
      "Expand the conjunction definition: α ∧ β ≡ ¬(α → ¬β).",
      "The goal reduces to ¬(φ → ¬ψ) → ¬(ψ → ¬φ).",
      "Prove by combining conjunction elimination (left and right) + conjunction introduction.",
    ],
    learningPoint:
      "Commutativity of conjunction also requires a long proof in Hilbert systems. The pattern: definition expansion → elimination → re-introduction.",
  },
  "prop-47": {
    title: "De Morgan Converse",
    description:
      "Prove (¬φ ∧ ¬ψ) → ¬(φ ∨ ψ). The converse direction of De Morgan's law.",
    hints: [
      "Expand the definitions of disjunction and conjunction respectively.",
      "φ ∨ ψ ≡ ¬φ → ψ, α ∧ β ≡ ¬(α → ¬β).",
      "The approach: if both ¬φ and ¬ψ hold, then ¬φ → ψ (= φ ∨ ψ) leads to a contradiction.",
    ],
    learningPoint:
      "De Morgan's converse reduces the negation of a disjunction to the conjunction of negations. Definition expansion is complex in Hilbert systems, but the structure is clear.",
  },
  "prop-48": {
    title: "Contraposition Axiom (A3)",
    description:
      "Prove (¬φ → ¬ψ) → (ψ → φ). Practice applying A3 (contraposition) with its metavariables as-is.",
    hints: [
      "Use A3: (¬φ → ¬ψ) → (ψ → φ) directly.",
      "Substitute φ for φ and ψ for ψ in the metavariables to complete.",
    ],
    learningPoint:
      "A3 (contraposition axiom) is the foundation of the Lukasiewicz system. 'If ¬φ implies ¬ψ, then ψ implies φ'.",
  },
  "prop-49": {
    title: "A1 Lift of Contraposition Axiom",
    description:
      "Prove φ → ((¬ψ → ¬χ) → (χ → ψ)). Lift A3 (contraposition) under a premise using A1.",
    hints: [
      "First create A3[φ/ψ, ψ/χ]: (¬ψ → ¬χ) → (χ → ψ).",
      "Lift with A1 and apply MP to complete.",
    ],
    learningPoint:
      "Any theorem can be 'embedded' under a premise using A1. This also applies to A3 (contraposition axiom).",
  },
  "prop-50": {
    title: "A1 Lift of S Axiom",
    description:
      "Prove φ → ((ψ → (χ → θ)) → ((ψ → χ) → (ψ → θ))). Lift A2 using A1.",
    hints: [
      "First create A2[φ/ψ, ψ/χ, χ/θ]: (ψ→(χ→θ)) → ((ψ→χ) → (ψ→θ)).",
      "Lift with A1 and apply MP to complete.",
    ],
    learningPoint:
      "A2 (S axiom) can also be lifted with A1. This 'theorem lifting' pattern can be applied inductively.",
  },
  "prop-51": {
    title: "Double A1 Lift of Identity",
    description:
      "Prove φ → (ψ → (χ → χ)). Lift the identity law twice with A1.",
    hints: [
      "First derive the identity law χ → χ using Q-01's procedure (5 steps).",
      "Lift to ψ → (χ → χ) using A1.",
      "Further lift to φ → (ψ → (χ → χ)) using A1.",
    ],
    learningPoint:
      "Double lifting of the identity law. The basic operation of adding 'nested premises' by repeatedly applying A1.",
  },
  "eq-01": {
    title: "Reflexivity (E1)",
    description: "Prove ∀x. x = x. Place equality axiom E1.",
    hints: [
      "E1 is the reflexivity of equality. It can be placed directly from the axiom palette.",
      "E1: ∀x. x = x — anything is equal to itself.",
    ],
    learningPoint:
      "E1 (reflexivity) is the most fundamental property of equality. 'x = x' holds unconditionally.",
  },
  "eq-02": {
    title: "Symmetry (E2)",
    description: "Prove ∀x.∀y. x = y → y = x. Place equality axiom E2.",
    hints: [
      "E2 is the symmetry of equality. It can be placed directly from the axiom palette.",
      "E2: ∀x.∀y. x = y → y = x — equalities can be reversed.",
    ],
    learningPoint:
      "E2 (symmetry) guarantees 'if x = y then y = x'. The direction of an equation can be freely changed.",
  },
  "eq-03": {
    title: "Transitivity (E3)",
    description:
      "Prove ∀x.∀y.∀z. x = y → (y = z → x = z). Place equality axiom E3.",
    hints: [
      "E3 is the transitivity of equality. It can be placed directly from the axiom palette.",
      "E3: ∀x.∀y.∀z. x = y → (y = z → x = z) — equalities can be chained.",
    ],
    learningPoint:
      "E3 (transitivity) guarantees 'if x = y and y = z then x = z'. The foundation of chain reasoning with equalities.",
  },
  "eq-04": {
    title: "Concrete Reflexivity",
    description:
      "Prove a = a. Combine E1 (reflexivity) with A4 (universal elimination).",
    hints: [
      "Place E1: ∀x. x = x.",
      "Eliminate ∀x with A4 and substitute the concrete term a: (∀x. x=x) → a=a.",
      "Combine with MP to complete.",
    ],
    learningPoint:
      "Universally quantified axioms can be instantiated to concrete terms using A4 (universal elimination). The basic E1 + A4 + MP pattern.",
  },
  "eq-05": {
    title: "Concrete Symmetry",
    description: "Prove a = b → b = a. Instantiate E2 by applying A4 twice.",
    hints: [
      "Place E2: ∀x.∀y. x = y → y = x.",
      "Eliminate ∀x with A4 (x→a) to get ∀y. a = y → y = a.",
      "Eliminate ∀y with A4 again (y→b) to get a = b → b = a.",
    ],
    learningPoint:
      "Axioms with multiple universal quantifiers are eliminated one at a time by repeated A4 application. Two-stage instantiation of E2: x→a, y→b.",
  },
  "eq-06": {
    title: "Concrete Transitivity",
    description: "Prove a = b → (b = c → a = c). Apply A4 three times to E3.",
    hints: [
      "Place E3: ∀x.∀y.∀z. x = y → (y = z → x = z).",
      "Three stages: eliminate ∀x (x→a), ∀y (y→b), ∀z (z→c) with A4.",
      "After each A4, use MP to strip one universal quantifier. 7 steps total.",
    ],
    learningPoint:
      "Three-fold universal quantifier elimination pattern. A mechanical A4+MP procedure repeated 3 times, but it is important to be conscious of which variable to substitute at each step.",
  },
  "eq-07": {
    title: "Combining A1 and Gen",
    description:
      "Prove ∀x. x = x → (x = x → x = x). Universalize an instance of A1 with Gen.",
    hints: [
      "Place x = x → (x = x → x = x) as an instance of A1.",
      "Universalize with Gen[x] to complete.",
    ],
    learningPoint:
      "A1 can be applied to any formula. Equality formulas can be used in place of φ and ψ. The basic pattern of universalizing free variables with Gen.",
  },
  "eq-08": {
    title: "Identity (Equality Version)",
    description:
      "Prove a = b → a = b. An equality instance of the identity law φ → φ.",
    hints: [
      "Same structure as prop-01's identity. Apply the A2+A1+MP pattern with φ = (a = b).",
      "Use A2[φ/(a=b), ψ/((a=b)→(a=b)), χ/(a=b)].",
      "Combine two patterns of A1 for φ→(ψ→φ).",
    ],
    learningPoint:
      "The identity law φ → φ holds for any formula φ. The same A2+A1+MP pattern works for equality formulas too.",
  },
  "eq-09": {
    title: "Compound Identity",
    description:
      "Prove (a = a → b = b) → (a = a → b = b). Identity law for an equality formula joined by implication.",
    hints: [
      "An instance of the identity law φ → φ. Apply with φ = (a = a → b = b).",
      "The A2+A1+MP pattern does not depend on the form of φ. Same procedure as prop-01.",
    ],
    learningPoint:
      "The identity pattern can prove in the same 5 steps regardless of how complex φ is. Also applicable to equality formulas joined by implication.",
  },
  "eq-10": {
    title: "Universalized Identity",
    description:
      "Prove ∀x.∀y. x = y → x = y. Doubly universalize the identity law with Gen.",
    hints: [
      "First derive x = y → x = y using the identity pattern (5 steps).",
      "Universalize with Gen[y] to get ∀y. x = y → x = y.",
      "Universalize with Gen[x] to get ∀x.∀y. x = y → x = y.",
    ],
    learningPoint:
      "Combination of identity + Gen universalization. Gen the inner quantifier (y) first, then the outer (x). Checking free variables is important when applying Gen.",
  },
  "peano-01": {
    title: "Zero Is Not a Successor (PA1)",
    description:
      "Prove ∀x. ¬(S(x) = 0). Place Peano arithmetic axiom PA1 from the axiom palette.",
    hints: [
      "PA1 is a Peano arithmetic axiom. It can be placed directly from the axiom palette.",
      "PA1: ∀x. ¬(S(x) = 0) — 0 is not the successor of any natural number.",
    ],
    learningPoint:
      "PA1 states '0 is not in the range of the successor function'. A fundamental property of natural numbers. Axioms can be used directly as theorems.",
  },
  "peano-02": {
    title: "Addition Base Case (PA3)",
    description:
      "Prove ∀x. x + 0 = x. The base case of the recursive definition of addition.",
    hints: [
      "PA3 is the axiom defining the base of addition.",
      "Placing PA3 from the axiom palette matches the goal.",
    ],
    learningPoint:
      "PA3 states 'adding 0 to any natural number leaves it unchanged'. The starting point of the recursive definition of arithmetic.",
  },
  "peano-03": {
    title: "Multiplication Base Case (PA5)",
    description:
      "Prove ∀x. x * 0 = 0. The base case of the recursive definition of multiplication.",
    hints: [
      "PA5 is the axiom defining the base of multiplication.",
      "Placing PA5 from the axiom palette matches the goal.",
    ],
    learningPoint:
      "PA5 states 'the product of any natural number and 0 is 0'. Paired with PA3 (addition base).",
  },
  "peano-04": {
    title: "Reflexivity of Equality",
    description:
      "Prove ∀x. x = x. Use equality axiom E1, combined with universal quantification.",
    hints: [
      "The reflexivity axiom E1 is in the axiom palette.",
      "Simply place E1: ∀x. x = x to complete.",
    ],
    learningPoint:
      "E1 (reflexivity) is one of the equality axioms in the PA system. Equality becomes a fundamental tool in Peano arithmetic.",
  },
  "peano-05": {
    title: "Injectivity of Successor (PA2)",
    description:
      "Prove ∀x.∀y. S(x) = S(y) → x = y. Show that the successor function is injective.",
    hints: [
      "PA2 is the axiom guaranteeing injectivity of the successor function.",
      "Placing PA2 from the axiom palette matches the goal.",
    ],
    learningPoint:
      "PA2 guarantees 'if S(x) = S(y) then x = y'. Together with PA1 (0 ≠ successor), it defines the structure of natural numbers.",
  },
  "peano-06": {
    title: "Addition Recursion (PA4)",
    description:
      "Prove ∀x.∀y. x + S(y) = S(x + y). The recursive step of the addition definition.",
    hints: [
      "PA4 is the axiom defining the recursive step of addition.",
      "Placing PA4 from the axiom palette matches the goal.",
    ],
    learningPoint:
      "PA4 defines the recursive step of addition as 'x + S(y) = S(x + y)'. Paired with PA3 (base), it completely defines addition.",
  },
  "peano-07": {
    title: "0 + 0 = 0",
    description:
      "Prove 0 + 0 = 0. Eliminate universal quantification from PA3 with A5 and derive a concrete calculation result.",
    hints: [
      "Start from PA3: ∀x. x + 0 = x.",
      "Substitute 0 for x with A5 (∀x.φ(x) → φ(t)) to get 0 + 0 = 0.",
      "Instantiate PA3 with A5 and apply MP.",
    ],
    learningPoint:
      "The basic technique of applying PA axioms to concrete numbers via ∀ elimination (A5 + MP). In formal proofs, even 'calculation' requires this operation.",
  },
  "peano-08": {
    title: "S(0) + 0 = S(0)",
    description: "Prove S(0) + 0 = S(0). Derive 1+0=1 from PA3.",
    hints: [
      "Use PA3: ∀x. x + 0 = x.",
      "Substitute S(0) for x with A5 to get S(0) + 0 = S(0).",
    ],
    learningPoint:
      "S(0) represents the natural number 1. Instantiating PA3 with S(0) immediately proves 1+0=1.",
  },
  "peano-09": {
    title: "0 * 0 = 0",
    description:
      "Prove 0 * 0 = 0. Eliminate universal quantification from PA5 and compute concretely.",
    hints: [
      "Use PA5: ∀x. x * 0 = 0.",
      "Substitute 0 for x with A5 to get 0 * 0 = 0.",
    ],
    learningPoint:
      "The multiplication base case PA5 is also concretized using the same ∀ elimination pattern. The bases of addition and multiplication are symmetric.",
  },
  "peano-10": {
    title: "¬(S(0) = 0)",
    description: "Prove ¬(S(0) = 0). Derive '1 ≠ 0' from PA1.",
    hints: [
      "Use PA1: ∀x. ¬(S(x) = 0).",
      "Substitute 0 for x with A5 to get ¬(S(0) = 0).",
    ],
    learningPoint:
      "Instantiating PA1 derives '1 ≠ 0'. The most fundamental fact of number theory.",
  },
  "peano-11": {
    title: "S(0) + S(0) = S(S(0))",
    description:
      "Prove S(0) + S(0) = S(S(0)). A formal proof of 1+1=2. Combine PA3 and PA4.",
    hints: [
      "Instantiate PA4: ∀x.∀y. x + S(y) = S(x + y) with x=S(0), y=0.",
      "This gives S(0) + S(0) = S(S(0) + 0).",
      "Instantiate PA3: ∀x. x + 0 = x with x=S(0), and use equality reasoning for S(0) + 0 = S(0).",
    ],
    learningPoint:
      "The formal proof of '1+1=2' requires combining PA3, PA4, and equality axioms. Arithmetic 'calculation' is a chain of multiple axioms.",
  },
  "peano-12": {
    title: "Surjectivity of Successor (Q7)",
    description:
      "Prove ∀x.(x = 0 ∨ ∃y.(x = S(y))). Robinson arithmetic axiom Q7.",
    hints: [
      "Q7 is an axiom of Robinson arithmetic. It can be placed directly from the axiom palette.",
      "Q7: ∀x.(x = 0 ∨ ∃y.(x = S(y))) — every natural number is either 0 or the successor of something.",
    ],
    learningPoint:
      "Q7 is an axiom specific to Robinson arithmetic. It guarantees the structure of natural numbers in place of PA's induction schema.",
  },
  "peano-13": {
    title: "0 + S(0) = S(0)",
    description:
      "Prove 0 + S(0) = S(0). A formal proof of 0+1=1. Connect PA4 and PA3 using equality axioms.",
    hints: [
      "Instantiate PA4: ∀x.∀y. x + S(y) = S(x + y) with x=0, y=0.",
      "This gives 0 + S(0) = S(0 + 0).",
      "Instantiate PA3: ∀x. x + 0 = x with x=0, and use E4 (S-function congruence) to derive S(0+0)=S(0).",
      "Chain with E3 (transitivity): 0+S(0)=S(0+0) and S(0+0)=S(0).",
    ],
    learningPoint:
      "Addition with 0 on the left uses PA4. PA3 (x+0=x) and PA4 (x+S(y)=S(x+y)) handle different argument positions.",
  },
  "peano-14": {
    title: "0 * S(0) = 0",
    description:
      "Prove 0 * S(0) = 0. A formal proof of 0*1=0. First use of PA6 (multiplication recursion).",
    hints: [
      "Instantiate PA6: ∀x.∀y. x * S(y) = x * y + x with x=0, y=0.",
      "This gives 0 * S(0) = 0 * 0 + 0.",
      "Use PA3 to derive 0*0+0 = 0*0, and PA5 to derive 0*0 = 0.",
      "Chain with E3 (transitivity) to get 0 * S(0) = 0.",
    ],
    learningPoint:
      "PA6 is the recursive definition of multiplication. Expand x*S(y)=x*y+x and reduce to base cases using PA5 (x*0=0) and PA3 (x+0=x).",
  },
  "peano-15": {
    title: "S(S(0)) + S(0) = S(S(S(0)))",
    description:
      "Prove S(S(0)) + S(0) = S(S(S(0))). A formal proof of 2+1=3. Same technique as peano-11 (1+1=2).",
    hints: [
      "Instantiate PA4: ∀x.∀y. x + S(y) = S(x + y) with x=S(S(0)), y=0.",
      "This gives S(S(0)) + S(0) = S(S(S(0)) + 0).",
      "Instantiate PA3: ∀x. x + 0 = x with x=S(S(0)), and use E4 to derive S(S(S(0))+0)=S(S(S(0))).",
      "Chain with E3 (transitivity).",
    ],
    learningPoint:
      "Same PA4+PA3+E4+E3 pattern as peano-11. Even as terms get deeper, the procedure remains identical. The 'repetitive' structure of computation.",
  },
  "peano-16": {
    title: "S(S(0)) * 0 = 0",
    description:
      "Prove S(S(0)) * 0 = 0. A formal proof of 2*0=0. Derived by ∀ elimination from PA5.",
    hints: [
      "Use PA5: ∀x. x * 0 = 0.",
      "Substitute S(S(0)) for x with A4 to get S(S(0)) * 0 = 0.",
    ],
    learningPoint:
      "Instantiating PA5 derives n*0=0 for any natural number. The procedure is the same regardless of term complexity.",
  },
  "peano-17": {
    title: "Multiplication Recursion (PA6)",
    description:
      "Prove ∀x.∀y. x * S(y) = x * y + x. The recursive definition of multiplication. Paired with PA4 (addition recursion).",
    hints: [
      "PA6 is the axiom defining the recursive step of multiplication.",
      "Placing PA6 from the axiom palette matches the goal.",
    ],
    learningPoint:
      "PA6 defines the recursive step of multiplication as 'x * S(y) = x * y + x'. Paired with PA5 (base), it completely defines multiplication.",
  },
  "peano-18": {
    title: "Symmetry of Equality (E2)",
    description:
      "Prove ∀x.∀y. x = y → y = x. Symmetry of equality guarantees that equations can be reversed.",
    hints: [
      "E2 is the symmetry axiom of equality. It can be placed directly from the axiom palette.",
      "E2: ∀x.∀y. x = y → y = x — equations are symmetric.",
    ],
    learningPoint:
      "E2 (symmetry) is a basic equality axiom alongside E1 (reflexivity). E1+E2+E3 guarantee that equality is an equivalence relation.",
  },
  "peano-19": {
    title: "Transitivity of Equality (E3)",
    description:
      "Prove ∀x.∀y.∀z. x = y → (y = z → x = z). Transitivity of equality guarantees that equations can be chained.",
    hints: [
      "E3 is the transitivity axiom of equality. It can be placed directly from the axiom palette.",
      "E3: ∀x.∀y.∀z. x = y → (y = z → x = z) — chaining equations.",
    ],
    learningPoint:
      "E3 (transitivity) enables chain reasoning with equalities. In Peano arithmetic calculations, equations are chained using E3.",
  },
  "peano-20": {
    title: "Successor Congruence (E4(S))",
    description:
      "Prove ∀x.∀y. x = y → S(x) = S(y). The successor function version of equality congruence axiom E4. Shows that successors of equal numbers are equal.",
    hints: [
      "E4 is an equality axiom schema guaranteeing function congruence.",
      "Enter the S-function version E4(S): ∀x.∀y. x = y → S(x) = S(y) directly.",
      "Not in the axiom palette, but can be placed as a valid axiom instance.",
    ],
    learningPoint:
      "E4 (function congruence) is an axiom schema that exists for each function in the signature. There are E4 instances for S, +, and * respectively.",
  },
  "group-01": {
    title: "Associativity (G1)",
    description:
      "Prove ∀x.∀y.∀z. (x * y) * z = x * (y * z). The most fundamental axiom of groups.",
    hints: [
      "G1 is the associativity axiom of groups. It can be placed directly from the axiom palette.",
      "G1: ∀x.∀y.∀z. (x * y) * z = x * (y * z)",
    ],
    learningPoint:
      "Associativity is the most fundamental axiom in the definition of a group. It guarantees that the result is the same regardless of how parentheses are placed.",
  },
  "group-02": {
    title: "Left Identity (G2L)",
    description: "Prove ∀x. e * x = x. The left identity property of a group.",
    hints: [
      "G2L is the left identity axiom of groups. Place it from the axiom palette.",
      "G2L: ∀x. e * x = x — multiplying by e from the left leaves the element unchanged.",
    ],
    learningPoint:
      "The identity element e is the 'do nothing element' of the group operation. Multiplying from the left does not change the original element.",
  },
  "group-03": {
    title: "Left Inverse (G3L)",
    description:
      "Prove ∀x. i(x) * x = e. The left inverse of any element yields the identity.",
    hints: [
      "G3L is the left inverse axiom of groups. Place it from the axiom palette.",
      "G3L: ∀x. i(x) * x = e — multiplying by the inverse from the left gives the identity.",
    ],
    learningPoint:
      "The inverse i(x) is the element that 'cancels the effect of x'. Multiplying from the left returns the identity element e.",
  },
  "group-04": {
    title: "Right Identity (G2R)",
    description: "Prove ∀x. x * e = x. The right identity property of a group.",
    hints: [
      "G2R is the right identity axiom of groups. Place it from the axiom palette.",
      "G2R: ∀x. x * e = x — multiplying by e from the right leaves the element unchanged.",
    ],
    learningPoint:
      "In the two-sided axiom system, both left and right identity properties are given as axioms. In the left axiom system, right identity is a theorem.",
  },
  "group-05": {
    title: "Right Inverse (G3R)",
    description: "Prove ∀x. x * i(x) = e. The right inverse of any element.",
    hints: [
      "G3R is the right inverse axiom of groups. Place it from the axiom palette.",
      "G3R: ∀x. x * i(x) = e — multiplying by the inverse from the right gives the identity.",
    ],
    learningPoint:
      "In the two-sided axiom system, both left and right inverse properties are given as axioms. In the left axiom system, right inverse is a theorem.",
  },
  "group-06": {
    title: "Commutativity (G4)",
    description:
      "Prove ∀x.∀y. x * y = y * x. The additional axiom for abelian groups.",
    hints: [
      "G4 is the commutativity axiom of abelian groups. Place it from the axiom palette.",
      "G4: ∀x.∀y. x * y = y * x — the order of operations can be swapped.",
    ],
    learningPoint:
      "Commutativity does not hold in general groups. A group where commutativity holds is specifically called an abelian group (commutative group).",
  },
  "group-07": {
    title: "e * e = e",
    description:
      "Prove that the product of identity elements is the identity. Derived by ∀ elimination from G2L.",
    hints: [
      "Use G2L: ∀x. e * x = x. Substituting e for x gives e * e = e.",
      "Use A5 (∀ elimination) to derive φ(e) from ∀x.φ(x).",
      "Procedure: G2L (axiom) → A5 instance ((∀x. e*x=x) → e*e=e) → MP",
    ],
    learningPoint:
      "∀ elimination is the combination of 'A5: (∀x.φ) → φ[t/x]' instance and MP. The same pattern works in group theory.",
  },
  "group-08": {
    title: "i(e) * e = e",
    description:
      "Prove that the inverse of the identity times the identity equals the identity. Derived by ∀ elimination from G3L.",
    hints: [
      "Use G3L: ∀x. i(x) * x = e. Substituting e for x gives i(e) * e = e.",
      "Use A5 (∀ elimination) to derive φ(e) from ∀x.φ(x).",
      "Procedure: G3L (axiom) → A5 instance → MP",
    ],
    learningPoint:
      "The inverse function i can be applied to any element. In particular, i(e) is the inverse of the identity, which turns out to be the identity itself.",
  },
  "group-09": {
    title: "(a·b)·c = a·(b·c)",
    description:
      "Derive a concrete instance of associativity G1. Stepwise elimination of a 3-variable universal quantifier ∀x.∀y.∀z.",
    hints: [
      "Place G1: ∀x.∀y.∀z. (x*y)*z = x*(y*z).",
      "Use A4 three times to eliminate in order: x→a, y→b, z→c.",
      "Procedure: G1 → A4[x→a] → MP → A4[y→b] → MP → A4[z→c] → MP",
    ],
    learningPoint:
      "Multi-variable universal quantifiers are eliminated from outside in with A4+MP. The 3-stage ∀ elimination is the same pattern as equality transitivity (E3).",
  },
  "group-10": {
    title: "a·i(a) = e",
    description:
      "Derive a concrete instance of right inverse axiom G3R. Apply to a specific element a using ∀ elimination.",
    hints: [
      "Use G3R: ∀x. x * i(x) = e. Substitute a for x.",
      "Use A4 (∀ elimination) to derive φ(a) from ∀x.φ(x).",
      "Procedure: G3R (axiom) → A4 instance ((∀x. x*i(x)=e) → a*i(a)=e) → MP",
    ],
    learningPoint:
      "G3L (left inverse: i(x)*x=e) and G3R (right inverse: x*i(x)=e) are symmetric in the two-sided axiom system. The ∀ elimination pattern is identical to group-07/08.",
  },
  "group-11": {
    title: "a·b = b·a",
    description:
      "Derive a concrete instance of abelian group commutativity G4. Stepwise elimination of a 2-variable universal quantifier.",
    hints: [
      "Place G4: ∀x.∀y. x * y = y * x.",
      "Use A4 twice to eliminate in order: x→a, y→b.",
      "Procedure: G4 → A4[x→a] → MP → A4[y→b] → MP",
    ],
    learningPoint:
      "2-stage ∀ elimination is the same pattern as symmetry (E2). An abelian group is a system with commutativity G4 added to normal group axioms.",
  },
  "group-12": {
    title: "e·(a·b) = a·b",
    description:
      "Apply left identity G2L to the compound term a·b. Learn the pattern of substituting compound terms via ∀ elimination.",
    hints: [
      "Place G2L: ∀x. e * x = x.",
      "Substitute the compound term a*b for x with A4 (∀ elimination).",
      "Procedure: G2L (axiom) → A4 instance ((∀x. e*x=x) → e*(a*b)=a*b) → MP",
    ],
    learningPoint:
      "In ∀ elimination, variables can be substituted not only with single terms but also compound terms (like a*b). This is an important property regarding term structure.",
  },
  "group-13": {
    title: "(a·b)·e = a·b",
    description:
      "Apply right identity G2R to the compound term a·b. Pattern of substituting compound terms via ∀ elimination.",
    hints: [
      "Place G2R: ∀x. x * e = x.",
      "Substitute the compound term a*b for x with A4 (∀ elimination).",
      "Procedure: G2R (axiom) → A4 instance ((∀x. x*e=x) → (a*b)*e=a*b) → MP",
    ],
    learningPoint:
      "G2R (right identity) can also be applied to compound terms, just like G2L (left identity). In the two-sided axiom system, both are freely usable.",
  },
  "group-14": {
    title: "i(a·b)·(a·b) = e",
    description:
      "Apply the left inverse to compound term a·b. The inverse function i can be applied to compound terms, giving i(a·b)·(a·b) = e.",
    hints: [
      "Place G3L: ∀x. i(x) * x = e.",
      "Substitute the compound term a*b for x with A4 (∀ elimination).",
      "Procedure: G3L (axiom) → A4 instance ((∀x. i(x)*x=e) → i(a*b)*(a*b)=e) → MP",
    ],
    learningPoint:
      "The inverse function i can be applied to any term. i(a*b) represents 'the inverse of a*b', which is not necessarily i(b)*i(a) (the reversal rule is needed separately in general groups).",
  },
  "group-15": {
    title: "(a·b)·i(a·b) = e",
    description:
      "Apply the right inverse to compound term a·b. Pattern of applying G3R via ∀ elimination to a compound term.",
    hints: [
      "Place G3R: ∀x. x * i(x) = e.",
      "Substitute the compound term a*b for x with A4 (∀ elimination).",
      "Procedure: G3R (axiom) → A4 instance ((∀x. x*i(x)=e) → (a*b)*i(a*b)=e) → MP",
    ],
    learningPoint:
      "Left inverse G3L and right inverse G3R are symmetric. In the two-sided axiom system, both can be used freely, and both i(t)*t=e and t*i(t)=e are directly derivable from axioms.",
  },
  "group-16": {
    title: "a·e = e·a",
    description:
      "Chain right identity and left identity results using E2 (symmetry) and E3 (transitivity) to derive the identity exchange law.",
    hints: [
      "Derive G2R[x→a]: a*e=a and G2L[x→a]: e*a=a.",
      "Reverse e*a=a with E2 to get a=e*a.",
      "Chain a*e=a and a=e*a with E3 to derive a*e=e*a.",
      "E2's ∀ elimination takes 2 stages, E3's takes 3 stages.",
    ],
    learningPoint:
      "The pattern of reversing equations with E2 (symmetry) and chaining equations with E3 (transitivity). A fundamental technique in equality reasoning for group theory.",
  },
  "group-17": {
    title: "i(a)·a = a·i(a)",
    description:
      "Chain left and right inverse results using E2+E3 to derive the inverse exchange law. Same pattern as group-16.",
    hints: [
      "Derive G3L[x→a]: i(a)*a=e and G3R[x→a]: a*i(a)=e.",
      "Reverse a*i(a)=e with E2 to get e=a*i(a).",
      "Chain i(a)*a=e and e=a*i(a) with E3 to derive i(a)*a=a*i(a).",
    ],
    learningPoint:
      "Symmetric pattern with group-16. The technique of deriving x=y from two equations x=m and y=m using E2+E3.",
  },
  "group-18": {
    title: "(a·e)·e = a",
    description:
      "Apply G2R with two different instances and chain using E3 (transitivity). The basics of transitivity chains.",
    hints: [
      "Derive G2R[x→a*e]: (a*e)*e=a*e and G2R[x→a]: a*e=a.",
      "Chain (a*e)*e=a*e and a*e=a with E3 to derive (a*e)*e=a.",
      "E3's ∀ elimination takes 3 stages (x, y, z each with A4+MP).",
    ],
    learningPoint:
      "Pattern of using the same axiom (G2R) twice with different substitutions and linking results with transitivity E3. Efficient chaining of equality reasoning.",
  },
  "group-19": {
    title: "i(e) = e",
    description:
      "Prove that the inverse of the identity is the identity itself. Chain G3L and G2R results using E2+E3.",
    hints: [
      "Derive G3L[x→e]: i(e)*e=e and G2R[x→i(e)]: i(e)*e=i(e).",
      "Reverse i(e)*e=i(e) with E2 to get i(e)=i(e)*e.",
      "Chain i(e)=i(e)*e and i(e)*e=e with E3 to derive i(e)=e.",
    ],
    learningPoint:
      "'When two equations share a common middle term, reverse one with E2 and chain with E3' is a universal pattern in equality reasoning.",
  },
  "group-20": {
    title: "Inverse Congruence (E4(i))",
    description:
      "Prove ∀x.∀y. x = y → i(x) = i(y). The inverse function version of equality congruence axiom E4.",
    hints: [
      "E4 is an equality axiom schema guaranteeing function congruence.",
      "Enter the inverse function version E4(i): ∀x.∀y. x = y → i(x) = i(y) directly.",
      "Not in the axiom palette, but can be placed as a valid axiom instance.",
    ],
    learningPoint:
      "E4 (function congruence) is an axiom schema that exists for each function in the signature. In group theory, there are E4 instances for i and *.",
  },
  "group-21": {
    title: "e·a = a",
    description:
      "Derive a concrete instance of left identity axiom G2L. Apply to a specific element a using ∀ elimination (A4).",
    hints: [
      "Use G2L: ∀x. e * x = x. Substituting a for x gives e * a = a.",
      "Place the A4 (∀ elimination) instance: (∀x. e*x=x) → e*a=a and apply MP.",
      "Procedure: G2L (axiom) → A4 instance → MP",
    ],
    learningPoint:
      "∀ elimination is the combination of 'A4: (∀x.φ) → φ[t/x]' instance and MP. The same pattern applies axioms to specific elements in group theory.",
  },
  "group-22": {
    title: "a·e = a",
    description:
      "Derive a concrete instance of right identity axiom G2R. Apply to a specific element a using ∀ elimination (A4).",
    hints: [
      "Use G2R: ∀x. x * e = x. Substituting a for x gives a * e = a.",
      "Place the A4 (∀ elimination) instance: (∀x. x*e=x) → a*e=a and apply MP.",
      "Procedure: G2R (axiom) → A4 instance → MP",
    ],
    learningPoint:
      "Right identity G2R is also instantiated with the same A4+MP pattern. In group-full, both left and right are axioms.",
  },
  "group-23": {
    title: "i(a)·a = e",
    description:
      "Derive a concrete instance of left inverse axiom G3L. Apply to a specific element a using ∀ elimination (A4).",
    hints: [
      "Use G3L: ∀x. i(x) * x = e. Substituting a for x gives i(a) * a = e.",
      "Place the A4 (∀ elimination) instance: (∀x. i(x)*x=e) → i(a)*a=e and apply MP.",
      "Procedure: G3L (axiom) → A4 instance → MP",
    ],
    learningPoint:
      "Instantiation of left inverse G3L. Same A4+MP pattern as group-10 (right inverse).",
  },
  "pred-01": {
    title: "Universal Elimination (A4)",
    description:
      "Prove (∀x.P(x)) → P(x). The most basic instance of A4 (universal elimination axiom).",
    hints: [
      "Create an instance of A4: (∀ξ.φ) → φ[τ/ξ].",
      "With ξ=x, φ=P(x), τ=x: (∀x.P(x)) → P(x)[x/x] = (∀x.P(x)) → P(x).",
      "Just place A4 to complete.",
    ],
    learningPoint:
      "A4 (universal elimination) is the basic axiom for removing the quantifier ∀. (∀x.φ(x)) → φ(t) can substitute any term t.",
  },
  "pred-02": {
    title: "Universalized Identity",
    description:
      "Prove ∀x.(P(x) → P(x)). Apply Gen to the propositional logic identity law.",
    hints: [
      "First prove the propositional identity P(x) → P(x) (A1, A2, MP).",
      "Then use the Gen rule to get ∀x.(P(x) → P(x)).",
      "Gen: if φ is proved, then ∀x.φ is also proved.",
    ],
    learningPoint:
      "Gen (generalization rule) universally quantifies a proved formula. Note that it can only be applied to theorems.",
  },
  "pred-03": {
    title: "Universal Quantifier Swap",
    description:
      "Prove (∀x.∀y.P(x, y)) → (∀y.∀x.P(x, y)). Swapping the order of quantifiers.",
    hints: [
      "Aim to deduce ∀y.∀x.P(x,y) from ∀x.∀y.P(x,y).",
      "Eliminate outer ∀x with A4, then ∀y with A4 again to get P(x,y).",
      "First get ∀x.P(x,y) with Gen, then get ∀y.∀x.P(x,y) with Gen again.",
      "The A5 operation is needed to bring things back inside ∀.",
    ],
    learningPoint:
      "The order of ∀ quantifiers is interchangeable. Shown using the combination of A4 (elimination) and A5+Gen (introduction).",
  },
  "pred-04": {
    title: "Existential Introduction (EI)",
    description:
      "Prove P(x) → ∃x.P(x). The basic operation of deriving an existential proposition from a concrete term.",
    hints: [
      "∃x.P(x) is an abbreviation for ¬∀x.¬P(x).",
      "It can be used as an instance of A4.",
    ],
    learningPoint:
      "Introduction of the existential quantifier. If P(t) holds, then ∃x.P(x) holds.",
  },
  "pred-05": {
    title: "∃x.¬P(x) → ¬∀x.P(x)",
    description:
      "Prove that 'if there exists an x satisfying ¬P(x)' then 'not all x satisfy P(x)'.",
    hints: [
      "∃x.¬P(x) is an abbreviation for ¬∀x.¬¬P(x).",
      "Use A4 to get ∀x.P(x) → P(x), and combine with contraposition.",
      "A3 (contraposition) is the key: (¬ψ → ¬φ) → (φ → ψ).",
      "Use double negation introduction/elimination and transitivity.",
    ],
    learningPoint:
      "The relationship between ∃x and ∀x is mediated by negation. The basics of contrapositive reasoning in predicate logic.",
  },
  "pred-06": {
    title: "∀x.¬P(x) → ¬∃x.P(x)",
    description:
      "Prove that 'if all x satisfy ¬P(x)' then 'no x satisfying P(x) exists'.",
    hints: [
      "∃x.P(x) is an abbreviation for ¬∀x.¬P(x).",
      "¬∃x.P(x) is ¬¬∀x.¬P(x), i.e., a double negation form.",
      "Combine the identity from ∀x.¬P(x) to ∀x.¬P(x) with double negation introduction.",
      "Apply the DNI (φ → ¬¬φ) instance to ∀x.¬P(x).",
    ],
    learningPoint:
      "(∀x.¬P(x)) → ¬(∃x.P(x)) is a fundamental relationship between quantifiers and negation. Proved by expanding the ∃ definition (¬∀¬) and applying double negation introduction.",
  },
  "pred-07": {
    title: "Universal Elimination (Implication Version)",
    description:
      "Prove (∀x.(P(x)→Q(x))) → (P(x)→Q(x)). Instantiation of A4 to an implication formula.",
    hints: [
      "A4 has the form (∀x.φ(x)) → φ(t).",
      "Setting φ(x) = P(x) → Q(x) makes it a direct instance of A4.",
    ],
    learningPoint:
      "A4 (universal elimination) can be applied to any predicate formula. It works the same way even when φ(x) is a compound formula.",
  },
  "pred-08": {
    title: "Universalized A1",
    description:
      "Prove ∀x.(P(x) → (Q(x) → P(x))). Apply Gen to propositional logic axiom A1.",
    hints: [
      "A1 axiom has the form φ → (ψ → φ).",
      "Instantiate A1 with P(x) and Q(x), then universalize with Gen.",
    ],
    learningPoint:
      "Propositional logic axioms can be instantiated even with formulas containing free variables, and then universalized with Gen.",
  },
  "pred-09": {
    title: "Doubly Universalized A1",
    description: "Prove ∀x.∀y.(P(x) → (P(y) → P(x))). Apply Gen twice to A1.",
    hints: [
      "Instantiate A1 axiom with P(x) and P(y).",
      "Universalize over y with Gen[y], then over x with Gen[x].",
      "Note the order of Gen application: apply to the inner quantifier first.",
    ],
    learningPoint:
      "Gen can be applied repeatedly. By universalizing in order from inner variables, double universal quantification is obtained.",
  },
  "pred-10": {
    title: "Quantifier Variable Renaming",
    description:
      "Prove (∀x.P(x)) → (∀y.P(y)). A formal proof that renaming bound variables does not change meaning.",
    hints: [
      "Extract P(y) from ∀x.P(x) with A4 (substituting y for x).",
      "Universalize P(y) to ∀y.P(y) with Gen[y].",
      "Use A5 to construct the implication from the Gen result.",
    ],
    learningPoint:
      "Alpha-conversion (renaming of bound variables) can be formally proved using the combination of A4 + Gen + A5.",
  },
  "pred-adv-01": {
    title: "Distribution of Universal over Implication",
    description:
      "Prove (∀x.(P(x)→Q(x))) → ((∀x.P(x)) → (∀x.Q(x))). The fundamental interaction between universal quantifiers and implication.",
    hints: [
      "Eliminate ∀ with A4 and distribute implication with A2.",
      "Combine A4: (∀x.(P(x)→Q(x))) → (P(x)→Q(x)) and A4: (∀x.P(x)) → P(x).",
      "Build (∀x.(P(x)→Q(x))) → ((∀x.P(x)) → Q(x)) as an intermediate step, then universalize with Gen+A5.",
      "Use the 'HS expansion' pattern of lifting with A1 and distributing with A2.",
    ],
    learningPoint:
      "∀ distributes over implication. One of the most frequently occurring patterns in predicate logic.",
  },
  "pred-adv-02": {
    title: "Negation of Existence → Universal Negation",
    description:
      "Prove ¬(∃x.P(x)) → (∀x.¬P(x)). Show that the negation of an existential quantifier reduces to a universal negation.",
    hints: [
      "∃x.P(x) is an abbreviation for ¬∀x.¬P(x).",
      "¬(∃x.P(x)) = ¬¬(∀x.¬P(x)).",
      "Use the double negation elimination instance ¬¬φ→φ.",
      "The DNE proof uses A3 twice.",
    ],
    learningPoint:
      "¬∃x.P(x) ↔ ∀x.¬P(x) is a fundamental relationship between quantifiers and negation. Proved by expanding the ∃ definition (¬∀¬) and applying double negation elimination.",
  },
  "pred-adv-03": {
    title: "Negation of Universal → Existential Negation",
    description:
      "Prove ¬(∀x.P(x)) → (∃x.¬P(x)). Show that the negation of a universal quantifier reduces to an existential negation.",
    hints: [
      "∃x.¬P(x) is an abbreviation for ¬∀x.¬¬P(x).",
      "Expanding the goal by definition gives ¬(∀x.P(x)) → ¬(∀x.¬¬P(x)).",
      "Convert DNE ¬¬P(x)→P(x) into ∀x.¬¬P(x)→∀x.P(x) with Gen + Dist∀.",
      "Take the contrapositive with Modus Tollens.",
    ],
    learningPoint:
      "¬∀x.P(x) → ∃x.¬P(x) holds only in classical logic. In the Hilbert system, proved using the combination of DNE + Gen + Dist∀ + MT.",
  },
  "pred-adv-04": {
    title: "Existential Implication Distribution",
    description:
      "Prove (∀x.(P(x)→Q(x))) → ((∃x.P(x)) → (∃x.Q(x))). Show that a universal implication distributes over existential quantifiers.",
    hints: [
      "Expand ∃x.P(x) = ¬∀x.¬P(x) and ∃x.Q(x) = ¬∀x.¬Q(x) by definition.",
      "Extract P(x)→Q(x) with A4, convert to ¬Q(x)→¬P(x) with MT.",
      "Construct ∀x.(¬Q(x)→¬P(x)) with Gen + A5, derive ∀x.¬Q(x)→∀x.¬P(x) with Dist∀.",
      "Take the contrapositive with MT and connect everything with HS.",
    ],
    learningPoint:
      "∀ distributes over ∃ via implication as well. The core is the pattern: ∃ definition expansion + MT + Dist∀.",
  },
  "pred-adv-05": {
    title: "Universal Quantifier Swap",
    description:
      "Prove (∀x.∀y.P(x,y)) → (∀y.∀x.P(x,y)). Show that universal quantifiers can be swapped.",
    hints: [
      "Use A4 twice to eliminate both ∀x and ∀y, extracting P(x,y).",
      "Universalize over x with Gen[x] and bring outside the implication with A5.",
      "Then universalize over y with Gen[y] and bring outside with A5.",
      "The key to swapping quantifier order is the order of Gen application.",
    ],
    learningPoint:
      "Universal quantifiers are interchangeable. Pattern: eliminate with A4 → reintroduce in reverse order with Gen → bring outside the implication with A5.",
  },
  "pred-adv-06": {
    title: "Universal to Existential",
    description:
      "Prove (∀x.P(x)) → (∃x.P(x)). Show that a universal proposition implies an existential proposition.",
    hints: [
      "∃x.P(x) is an abbreviation for ¬∀x.¬P(x).",
      "Expanding the goal by definition gives (∀x.P(x)) → ¬(∀x.¬P(x)).",
      "Can be proved by combining A4 and A3 (contraposition).",
      "Derive a contradiction from ∀x.¬P(x) → ¬P(x) and ∀x.P(x) → P(x).",
    ],
    learningPoint:
      "A universal proposition implies an existential proposition. A fundamental property for understanding the definition ∃x.P(x) = ¬∀x.¬P(x).",
  },
  "pred-adv-07": {
    title: "Double Universal Elimination with HS",
    description:
      "Prove (∀x.(P(x)→Q(x))) → ((∀x.(Q(x)→R(x))) → (P(x)→R(x))). Eliminate universal quantifiers twice and chain implications with HS.",
    hints: [
      "Extract P(x)→Q(x) from ∀x.(P(x)→Q(x)) with A4.",
      "Similarly extract Q(x)→R(x) from ∀x.(Q(x)→R(x)) with A4.",
      "Connect P(x)→Q(x) and Q(x)→R(x) using the A1+A2 HS expansion pattern.",
      "Repeat the 'hypothesis introduction' pattern of lifting with A1 and distributing with A2.",
    ],
    learningPoint:
      "Combination of universal elimination via A4 and HS expansion. The basic pattern for deriving conclusions from multiple universal propositions.",
  },
  "pred-adv-08": {
    title: "Universal → Negation of Existential Negation",
    description:
      "Prove (∀x.P(x)) → ¬(∃x.¬P(x)). From a universal proposition, negate the existential of its negation.",
    hints: [
      "Since ∃x.¬P(x) = ¬∀x.¬¬P(x), the goal becomes (∀x.P(x)) → ¬¬(∀x.¬¬P(x)).",
      "Use the relationship between ∀x.P(x) → P(x) and ¬¬P(x) → P(x).",
      "Construct ¬P(x) → ¬(∀x.P(x)) with A3 (contraposition), and universalize with Gen+A5.",
      "Finally take the contrapositive of ∀x.¬P(x) → ¬(∀x.P(x)).",
    ],
    learningPoint:
      "∀x.P(x) → ¬∃x.¬P(x) is one direction of quantifier duality. Reduces to double negation by expanding the ∃ definition.",
  },
  "pred-adv-09": {
    title: "Existential → Negation of Universal Negation",
    description:
      "Prove (∃x.P(x)) → ¬(∀x.¬P(x)). Derive the negation of a universal negation from an existential proposition. The definition of ∃ itself.",
    hints: [
      "∃x.P(x) is an abbreviation for ¬∀x.¬P(x).",
      "Expanding the goal gives ¬(∀x.¬P(x)) → ¬(∀x.¬P(x)).",
      "This is an instance of the identity law φ→φ.",
    ],
    learningPoint:
      "Since ∃x.P(x) = ¬∀x.¬P(x), this proposition is trivially true by definition (an instance of the identity law).",
  },
  "pred-adv-10": {
    title: "Transitivity of Universal Implication",
    description:
      "Prove (∀x.(P(x)→Q(x))) → ((∀x.(Q(x)→R(x))) → (∀x.(P(x)→R(x)))). Wrap transitivity in universal quantification.",
    hints: [
      "First eliminate ∀ with A4 and derive P(x)→R(x), similar to pred-adv-07.",
      "Re-universalize the result with Gen[x]+A5.",
      "Refer to the Dist∀ pattern of pred-adv-01, combining HS expansion+Gen+A5.",
      "The overall proof wraps the pred-adv-07 result with Gen+A5.",
    ],
    learningPoint:
      "Transitivity of universal implication. Pattern: eliminate ∀ with A4 + obtain conclusion via HS expansion, then re-universalize with Gen+A5.",
  },
  "pred-adv-11": {
    title: "Vacuous Quantification",
    description:
      "Prove φ → (∀x.φ). A formula without free variable x is equivalent when universally quantified.",
    hints: [
      "Prove the identity φ → φ.",
      "Get ∀x.(φ → φ) with Gen[x]. Applicable since x ∉ FV(φ).",
      "Use A5: (∀x.(φ → φ)) → (φ → ∀x.φ).",
      "Combine with MP to finish.",
    ],
    learningPoint:
      "Vacuous quantification is a fundamental property of predicate logic. If x does not occur in φ, then φ and ∀x.φ are equivalent. Proved with the Gen + A5 pattern.",
  },
  "pred-adv-12": {
    title: "Existential Quantifier Swap",
    description:
      "Prove (∃x.∃y.P(x,y)) → (∃y.∃x.P(x,y)). Show that existential quantifiers can also be swapped.",
    hints: [
      "∃ is an abbreviation for ¬∀¬. Expand the definitions to reason.",
      "This is the contrapositive structure of pred-adv-05's universal quantifier swap ∀x.∀y → ∀y.∀x.",
      "The form converts ∀¬∀¬ to ∀¬∀¬.",
      "The core is the combination of pred-adv-05 + negation handling.",
    ],
    learningPoint:
      "Existential quantifier swap is the dual of universal quantifier swap. Reduce to universal swap by expanding the definition ∃ = ¬∀¬.",
  },
  "pred-adv-13": {
    title: "Contraposition under Universal",
    description:
      "Prove (∀x.(P(x) → Q(x))) → (∀x.(¬Q(x) → ¬P(x))). Wrap Modus Tollens in universal quantification.",
    hints: [
      "Extract P(x)→Q(x) with A4, convert to ¬Q(x)→¬P(x) with A3 (one direction of contraposition).",
      "Build (∀x.(P(x)→Q(x))) → (¬Q(x)→¬P(x)) via HS expansion.",
      "Re-universalize with Gen[x] + A5.",
      "Same pattern as pred-adv-01 (Dist∀) but with A3 added.",
    ],
    learningPoint:
      "Pattern of bringing the contraposition law inside a universal quantifier. A4 to eliminate ∀ → A3 for contraposition → Gen+A5 to re-universalize.",
  },
  "pred-adv-14": {
    title: "Weakening under Universal",
    description:
      "Prove (∀x.P(x)) → (∀x.(Q(x) → P(x))). Wrap a universal proposition with the weakening axiom.",
    hints: [
      "Extract P(x) from ∀x.P(x) with A4.",
      "Get P(x) → (Q(x) → P(x)) with A1.",
      "Build (∀x.P(x)) → (Q(x) → P(x)) via HS expansion.",
      "Re-universalize with Gen[x] + A5: (∀x.P(x)) → ∀x.(Q(x) → P(x)).",
    ],
    learningPoint:
      "Pattern of bringing weakening axiom A1 inside a universal quantifier. A4 elimination → A1 application → Gen+A5 re-universalization.",
  },
  "nd-01": {
    title: "Identity (→I)",
    description:
      "Prove φ → φ in natural deduction NM. The most basic use of →I: assume and immediately discharge.",
    hints: [
      "Assume φ.",
      "φ follows trivially from φ, so discharge the assumption with →I to get φ → φ.",
    ],
    learningPoint:
      "→I (implication introduction) is the rule: 'if you derive ψ assuming φ, discharge the assumption to get φ → ψ'. A proof requiring 5 steps in Hilbert systems is completed in 2 steps.",
  },
  "nd-02": {
    title: "K Axiom (Double →I)",
    description:
      "Prove φ → (ψ → φ) in natural deduction NM. Use →I twice to introduce an unnecessary premise.",
    hints: [
      "First assume φ.",
      "Then assume ψ.",
      "φ is already assumed, so discharge ψ with →I to get ψ→φ, then discharge φ with →I.",
    ],
    learningPoint:
      "Corresponds to the K axiom (A1) of Hilbert systems. In natural deduction, directly provable by nesting →I.",
  },
  "nd-03": {
    title: "Contraposition (Modus Tollens)",
    description:
      "Prove (φ → ψ) → (¬ψ → ¬φ) in natural deduction NM. Contraposition provable even in minimal logic.",
    hints: [
      "Assume the three hypotheses: φ→ψ, ¬ψ, and φ.",
      "Get ψ from φ→ψ and φ via →E, then derive contradiction from ¬ψ and ψ via →E.",
      "Discharge assumptions in order with →I.",
    ],
    learningPoint:
      "Contraposition is provable even in minimal logic NM. ¬φ is shorthand for φ → ⊥, so it can be constructed using only →I and →E.",
  },
  "nd-04": {
    title: "Commutativity of Conjunction",
    description:
      "Prove (φ ∧ ψ) → (ψ ∧ φ) in natural deduction NM. Combination of ∧E and ∧I.",
    hints: [
      "Assume φ∧ψ.",
      "Extract φ with ∧E (left) and ψ with ∧E (right).",
      "Recombine ψ and φ in reverse order with ∧I to make ψ∧φ, then discharge the assumption with →I.",
    ],
    learningPoint:
      "In natural deduction, conjunction can be decomposed with ∧E and reconstructed with ∧I. Operations that required definition expansion in Hilbert systems can be done directly.",
  },
  "nd-05": {
    title: "Commutativity of Disjunction",
    description:
      "Prove (φ ∨ ψ) → (ψ ∨ φ) in natural deduction NM. Combination of ∨E and ∨I.",
    hints: [
      "Assume φ∨ψ.",
      "Use ∨E (case split): in the φ case, use ∨I(right) for ψ∨φ; in the ψ case, use ∨I(left) for ψ∨φ.",
      "Discharge the assumption with →I.",
    ],
    learningPoint:
      "∨E (disjunction elimination) is case-splitting reasoning. Process a disjunction by deriving the same conclusion in each case.",
  },
  "nd-06": {
    title: "Double Negation Introduction (DNI)",
    description:
      "Prove φ → ¬¬φ in natural deduction NM. A basic theorem provable even in minimal logic.",
    hints: [
      "Assume φ, then further assume ¬φ.",
      "Derive ⊥ (contradiction) from ¬φ and φ via →E.",
      "Discharge the ¬φ assumption with →I to get ¬¬φ, then discharge the φ assumption.",
    ],
    learningPoint:
      "DNI is provable even in minimal logic NM. Since ¬φ = φ → ⊥, we have ¬¬φ = (φ → ⊥) → ⊥. Hilbert system's A3 is not needed.",
  },
  "nd-07": {
    title: "Ex Falso Quodlibet (EFQ)",
    description:
      "Prove ¬φ → (φ → ψ) in natural deduction NJ. From a contradiction, anything follows.",
    hints: [
      "Assume ¬φ, then assume φ.",
      "Derive ⊥ from ¬φ and φ via →E.",
      "Get ψ from ⊥ via EFQ, then discharge assumptions in order with →I.",
    ],
    learningPoint:
      "EFQ (Ex Falso Quodlibet) is a rule added in NJ. In minimal logic NM, an arbitrary proposition cannot be derived from a contradiction.",
  },
  "nd-08": {
    title: "Clavius' Law (CM*)",
    description:
      "Prove (¬φ → φ) → φ in natural deduction NK. A reasoning pattern characteristic of classical logic.",
    hints: [
      "Assume ¬φ→φ.",
      "Assume ¬φ and derive φ via →E. This contradicts the ¬φ assumption.",
      "Get ¬¬φ via →I, then φ via DNE.",
    ],
    learningPoint:
      "Clavius' law is specific to classical logic NK. DNE (double negation elimination) is the key. Not provable in intuitionistic logic NJ.",
  },
  "nd-09": {
    title: "Law of Excluded Middle (TND)",
    description:
      "Prove φ ∨ ¬φ in natural deduction NK. The core theorem of classical logic.",
    hints: [
      "Assume ¬(φ ∨ ¬φ) and derive a contradiction.",
      "Assume φ, get φ∨¬φ via ∨I(left) → contradicts ¬(φ∨¬φ) → get ¬φ.",
      "From ¬φ, get φ∨¬φ via ∨I(right) → contradicts ¬(φ∨¬φ) → get ¬¬(φ∨¬φ) → φ∨¬φ via DNE.",
    ],
    learningPoint:
      "TND (law of excluded middle) is the core of classical logic NK. Not provable in intuitionistic logic NJ. Equivalent to DNE.",
  },
  "nd-10": {
    title: "Consequentia Mirabilis (CM)",
    description:
      "Prove (φ → ¬φ) → ¬φ in natural deduction NM. A self-contradiction pattern provable even in minimal logic.",
    hints: [
      "Assume φ→¬φ.",
      "Assume φ and derive ¬φ via →E. Derive ⊥ from ¬φ and φ via →E.",
      "Discharge the φ assumption with →I to get ¬φ. Discharge the φ→¬φ assumption with →I.",
    ],
    learningPoint:
      "Consequentia mirabilis is provable even in minimal logic NM. φ→¬φ is a self-contradictory hypothesis, and ¬φ is the consequence.",
  },
  "nd-11": {
    title: "Reductio ad Absurdum RAA¬ (NM)",
    description:
      "Prove (φ → ψ) → (φ → ¬ψ) → ¬φ in natural deduction NM. If assuming φ leads to contradiction, then ¬φ.",
    hints: [
      "Assume φ→ψ, φ→¬ψ, and φ respectively.",
      "Get ψ from φ→ψ and φ via →E, get ¬ψ from φ→¬ψ and φ via →E.",
      "Derive ⊥ from ¬ψ and ψ via →E, discharge φ with →I to get ¬φ. Discharge outer assumptions with →I.",
    ],
    learningPoint:
      "RAA¬ is a derived rule of minimal logic NM. If assuming φ leads to a contradiction (both ψ and ¬ψ), ¬φ is concluded. A generalization of negation introduction.",
  },
  "nd-12": {
    title: "Classical Reductio RAA*¬ (NK)",
    description:
      "Prove (¬φ → ψ) → (¬φ → ¬ψ) → φ in natural deduction NK. If assuming ¬φ leads to contradiction, then φ.",
    hints: [
      "Assume ¬φ→ψ, ¬φ→¬ψ, and ¬φ respectively.",
      "Get ψ and ¬ψ via →E, derive contradiction via →E. Discharge ¬φ with →I to get ¬¬φ.",
      "Get φ from ¬¬φ via DNE. Discharge outer assumptions with →I.",
    ],
    learningPoint:
      "Classical RAA*¬ is a derived rule of NK. DNE is the key. Not provable in NJ, demonstrating the difference between classical and intuitionistic logic.",
  },
  "nd-13": {
    title: "Contradiction Inference CON1 (NM)",
    description:
      "Prove ψ → ¬ψ → ¬φ in natural deduction NM. If ψ and ¬ψ both hold, any ¬φ is concluded.",
    hints: [
      "Assume ψ, ¬ψ, and φ respectively.",
      "Derive ⊥ from ¬ψ and ψ via →E (¬ψ = ψ→⊥).",
      "Discharge φ with →I to get ¬φ. Discharge outer assumptions with →I.",
    ],
    learningPoint:
      "CON1 is a derived rule of NM. From contradictory premises (ψ and ¬ψ), any negated proposition ¬φ can be derived. Note the difference from EFQ: EFQ derives any φ (without negation), while CON1 only derives ¬φ.",
  },
  "nd-14": {
    title: "Contradiction Inference CON4 (NK)",
    description:
      "Prove ¬ψ → ψ → φ in natural deduction NK. From contradictory premises, any φ is concluded (classical version).",
    hints: [
      "Assume ¬ψ, ψ, and ¬φ respectively.",
      "Derive ⊥ from ¬ψ and ψ via →E. Discharge ¬φ with →I to get ¬¬φ.",
      "Get φ from ¬¬φ via DNE. Discharge outer assumptions with →I.",
    ],
    learningPoint:
      "CON4 is a derived rule of NK. While NM's CON1 can only derive ¬φ, NK uses DNE to derive any φ. Equivalent claim to EFQ.",
  },
  "nd-15": {
    title: "Universal Introduction ∀I (NM)",
    description:
      "Prove P(x) → ∀x.P(x) → P(x) in natural deduction NM. Learn the basic use of the ∀I rule.",
    hints: [
      "Assume P(x).",
      "Create P(x) → P(x) with →I (assume P(x) and immediately discharge).",
      "Quantify over x with ∀I to get ∀x.(P(x) → P(x)).",
      "Discharge the initial P(x) assumption with →I.",
    ],
    learningPoint:
      "∀I (universal introduction) derives ∀x.φ from the premise φ. x must not occur free in undischarged assumptions (eigenvariable condition).",
  },
  "nd-16": {
    title: "Universal Elimination ∀E (NM)",
    description:
      "Prove ∀x.P(x) → P(x) in natural deduction NM. A basic operation of removing a quantifier using the ∀E rule.",
    hints: [
      "Assume ∀x.P(x).",
      "Apply ∀E to substitute x and obtain P(x) (t = x).",
      "Discharge the assumption with →I to complete the proof.",
    ],
    learningPoint:
      "∀E (universal elimination) derives φ[t/x] from ∀x.φ. Any term t can be substituted, but the free-for (substitutability) condition must be satisfied.",
  },
  "nd-17": {
    title: "Existential Introduction ∃I (NM)",
    description:
      "Prove P(x) → ∃x.P(x) in natural deduction NM. Derive an existential statement from a concrete instance.",
    hints: [
      "Assume P(x).",
      "Apply ∃I with x as the quantified variable and x as the witness to obtain ∃x.P(x).",
      "Discharge the assumption with →I to complete the proof.",
    ],
    learningPoint:
      "∃I (existential introduction) derives ∃x.φ from φ[t/x]. If a concrete term t satisfies φ, it can be generalized to an existential statement.",
  },
  "nd-18": {
    title: "Swapping Universal Quantifiers (NM)",
    description:
      "Prove ∀x.∀y.P(x, y) → ∀y.∀x.P(x, y) in natural deduction NM. A combination of ∀E and ∀I.",
    hints: [
      "Assume ∀x.∀y.P(x,y).",
      "Apply ∀E to eliminate x, obtaining ∀y.P(x,y).",
      "Apply ∀E to eliminate y, obtaining P(x,y).",
      "Apply ∀I to quantify over x to get ∀x.P(x,y). Apply ∀I to quantify over y to get ∀y.∀x.P(x,y). Complete with →I.",
    ],
    learningPoint:
      "The order of ∀ quantifiers can be swapped. This is shown by combining ∀E (elimination) and ∀I (introduction). In natural deduction, this can be proved directly without Hilbert-style A5.",
  },
  "nd-19": {
    title: "Existential Elimination ∃E (NM)",
    description:
      "Prove (∀x.(P(x) → φ)) → (∃x.P(x)) → φ in natural deduction NM. Learn the basic pattern of discharging existential hypotheses using the ∃E rule.",
    hints: [
      "Assume ∀x.(P(x) → φ) and ∃x.P(x).",
      "Use ∃E: take ∃x.P(x) as the existential premise, and build a proof deriving φ under the assumption P(x) as the case premise.",
      "From the assumption P(x): apply ∀E to get P(x) → φ from ∀x.(P(x) → φ). Apply →E to get φ.",
      "φ is the conclusion of ∃E (x does not occur free in φ, satisfying the eigenvariable condition). Discharge assumptions with →I.",
    ],
    learningPoint:
      "∃E (existential elimination) derives χ from ∃x.φ and a proof that derives χ from the assumption φ. x must not occur free in χ (eigenvariable condition). A fundamental hypothesis discharge pattern.",
  },
  "nd-20": {
    title: "Universal to Existential ∀→∃ (NM)",
    description:
      "Prove ∀x.P(x) → ∃x.P(x) in natural deduction NM. A basic operation of deriving an existential from a universal statement.",
    hints: [
      "Assume ∀x.P(x).",
      "Apply ∀E to substitute x and obtain P(x).",
      "Apply ∃I with x as the quantified variable and x as the witness to obtain ∃x.P(x). Discharge the assumption with →I to complete.",
    ],
    learningPoint:
      "If ∀x.φ then ∃x.φ holds. Extract a concrete instance with ∀E and wrap it back into an existential with ∃I. A basic combination of ∀E and ∃I.",
  },
  "nd-21": {
    title: "Existential Transitivity (NM)",
    description:
      "Prove (∃x.P(x)) → (∀x.(P(x) → Q(x))) → ∃x.Q(x) in natural deduction NM. A combination of ∃E and ∃I.",
    hints: [
      "Assume ∃x.P(x) and ∀x.(P(x) → Q(x)).",
      "Use ∃E: build a proof deriving ∃x.Q(x) under the assumption P(x).",
      "Under the assumption P(x): apply ∀E to get P(x) → Q(x), then →E to get Q(x).",
      "Apply ∃I to derive ∃x.Q(x) from Q(x). This is the conclusion of ∃E (x is not free in ∃x.Q(x)). Discharge assumptions with →I.",
    ],
    learningPoint:
      "A combined pattern of ∃E and ∃I: open an existential, apply a transformation, and wrap it back into an existential. Demonstrates the 'transitivity' of existence.",
  },
  "nd-22": {
    title: "∃ Distributes over ∧ (NM)",
    description:
      "Prove (∃x.(P(x) ∧ Q(x))) → (∃x.P(x)) ∧ (∃x.Q(x)) in natural deduction NM. Open an existential with ∃E, decompose with ∧E, reconstruct with ∃I.",
    hints: [
      "Assume ∃x.(P(x) ∧ Q(x)).",
      "Use ∃E: assume P(x) ∧ Q(x) and derive (∃x.P(x)) ∧ (∃x.Q(x)).",
      "Extract P(x) with ∧E₁ and Q(x) with ∧E₂.",
      "Apply ∃I to get ∃x.P(x) and ∃x.Q(x) respectively, then combine with ∧I. Discharge assumption with →I.",
    ],
    learningPoint:
      "The existential quantifier distributes over conjunction (the reverse direction does not hold in general). A typical pattern using multiple ∃I within an ∃E discharge.",
  },
  "nd-23": {
    title: "∀ with ∧ Combination (NM)",
    description:
      "Prove (∀x.P(x)) ∧ (∀x.Q(x)) → ∀x.(P(x) ∧ Q(x)) in natural deduction NM. Separate with ∀E, combine with ∧I, re-quantify with ∀I.",
    hints: [
      "Assume (∀x.P(x)) ∧ (∀x.Q(x)).",
      "Extract ∀x.P(x) with ∧E₁ and ∀x.Q(x) with ∧E₂.",
      "Apply ∀E to obtain P(x) and Q(x) respectively, then create P(x) ∧ Q(x) with ∧I.",
      "Quantify over x with ∀I to get ∀x.(P(x) ∧ Q(x)). Discharge assumption with →I.",
    ],
    learningPoint:
      "The universal quantifier can be distributed into a conjunction. A basic technique for adjusting quantifier scope using ∀E and ∀I.",
  },
  "nd-24": {
    title: "De Morgan ¬∨→∧¬ (NM)",
    description:
      "Prove ¬(φ ∨ ψ) → (¬φ ∧ ¬ψ) in natural deduction NM. Decompose a negated disjunction into a conjunction of negations.",
    hints: [
      "Assume ¬(φ ∨ ψ).",
      "Assume φ, create φ ∨ ψ with ∨I, derive ⊥ with ¬(φ ∨ ψ) and →E. Apply →I to get ¬φ.",
      "Similarly, assume ψ to derive ¬ψ.",
      "Combine ¬φ ∧ ¬ψ with ∧I, discharge assumption with →I.",
    ],
    learningPoint:
      "One direction of De Morgan's law. Extract the negation of each component from a negated disjunction. Provable in minimal logic.",
  },
  "nd-25": {
    title: "De Morgan ∧¬→¬∨ (NM)",
    description:
      "Prove (¬φ ∧ ¬ψ) → ¬(φ ∨ ψ) in natural deduction NM. Derive the negation of a disjunction from a conjunction of negations.",
    hints: [
      "Assume ¬φ ∧ ¬ψ, extract ¬φ and ¬ψ with ∧E.",
      "Assume φ ∨ ψ, apply ∨E for case analysis.",
      "In the φ case, derive ⊥ with ¬φ and →E; in the ψ case, derive ⊥ with ¬ψ and →E.",
      "Combine ⊥ with ∨E, discharge φ ∨ ψ with →I to get ¬(φ ∨ ψ).",
    ],
    learningPoint:
      "The reverse direction of De Morgan's law. Construct the negation of an entire disjunction from negations of each component. Provable in minimal logic.",
  },
  "nd-26": {
    title: "De Morgan ¬∧→∨¬ (NK)",
    description:
      "Prove ¬(φ ∧ ψ) → (¬φ ∨ ¬ψ) in natural deduction NK. The direction that requires classical logic's DNE.",
    hints: [
      "Assume ¬(φ ∧ ψ). Directly constructing ¬φ ∨ ¬ψ is difficult.",
      "Use the strategy of assuming ¬(¬φ ∨ ¬ψ) and deriving a contradiction.",
      "Assume φ → assume ψ → φ ∧ ψ → contradicts ¬(φ∧ψ) → ¬ψ → ¬φ∨¬ψ → contradicts ¬(¬φ∨¬ψ) → ¬φ → similarly contradiction.",
      "Obtain ¬¬(¬φ ∨ ¬ψ) with →I, then eliminate double negation with DNE.",
    ],
    learningPoint:
      "The ¬∧→∨¬ direction of De Morgan's law cannot be proved in intuitionistic logic and requires classical logic's DNE. An important example experiencing the difference between intuitionistic and classical logic.",
  },
  "nd-27": {
    title: "∧∨ Distributive Law (NM)",
    description:
      "Prove φ ∧ (ψ ∨ χ) → (φ ∧ ψ) ∨ (φ ∧ χ) in natural deduction NM. Distribute conjunction over disjunction.",
    hints: [
      "Assume φ ∧ (ψ ∨ χ), extract φ and ψ ∨ χ with ∧E.",
      "Apply ∨E to ψ ∨ χ for case analysis.",
      "ψ case: create φ ∧ ψ with ∧I, then (φ ∧ ψ) ∨ (φ ∧ χ) with ∨I_L.",
      "χ case: create φ ∧ χ with ∧I, then (φ ∧ ψ) ∨ (φ ∧ χ) with ∨I_R. Combine with ∨E and discharge with →I.",
    ],
    learningPoint:
      "The distributive law of conjunction over disjunction. A standard technique of handling each case with ∨E and combining with ∨I.",
  },
  "nd-28": {
    title: "Double Negation Elimination (NK)",
    description:
      "Prove ¬¬φ → φ in natural deduction NK. The most basic classical logic proof using the DNE rule directly.",
    hints: [
      "Assume ¬¬φ.",
      "Apply the DNE rule to derive φ from ¬¬φ.",
      "Discharge the assumption with →I to complete the proof.",
    ],
    learningPoint:
      "Double negation elimination (DNE) is a characteristic rule of classical logic NK. It cannot be used in intuitionistic logic.",
  },
  "nd-29": {
    title: "Reverse Contrapositive (NK)",
    description:
      "Prove (¬ψ → ¬φ) → (φ → ψ) in natural deduction NK. The reverse direction of contraposition requires DNE.",
    hints: [
      "Assume ¬ψ → ¬φ and φ.",
      "Assume ¬ψ, derive ¬φ with →E, then derive ⊥ with →E.",
      "Create ¬¬ψ with →I, then obtain ψ with DNE.",
      "Apply →I twice to discharge the assumptions.",
    ],
    learningPoint:
      "The reverse direction of contraposition holds only in classical logic. Construct ¬¬ψ through reductio ad absurdum reasoning and obtain ψ via DNE.",
  },
  "nd-30": {
    title: "Peirce's Law (NK)",
    description:
      "Prove ((φ → ψ) → φ) → φ in natural deduction NK. A famous theorem of classical logic.",
    hints: [
      "Assume (φ → ψ) → φ.",
      "Assume ¬φ, then assume φ and derive ⊥.",
      "Obtain ψ via EFQ, then create φ → ψ with →I.",
      "Apply →E to get φ, derive contradiction with ¬φ to get ¬¬φ, then obtain φ with DNE.",
    ],
    learningPoint:
      "Peirce's law is a theorem unique to classical logic that cannot be proved in intuitionistic logic. The combination of EFQ and DNE is key.",
  },
  "nd-31": {
    title: "Reverse ∨∧ Distributive Law (NM)",
    description:
      "Prove (φ ∨ ψ) ∧ (φ ∨ χ) → φ ∨ (ψ ∧ χ) in natural deduction NM. Uses ∨E twice.",
    hints: [
      "Assume (φ ∨ ψ) ∧ (φ ∨ χ), extract φ ∨ ψ and φ ∨ χ with ∧E.",
      "Apply ∨E to φ ∨ ψ for case analysis.",
      "φ case: directly φ ∨ (ψ ∧ χ) via ∨I_L.",
      "ψ case: apply ∨E to φ ∨ χ. φ → ∨I_L, χ → create ψ ∧ χ with ∧I then ∨I_R.",
    ],
    learningPoint:
      "A technique of nested ∨E (double case analysis). The inner ∨E is used in the right case of the outer ∨E.",
  },
  "nd-32": {
    title: "∀ Distributes over ∧ (NM)",
    description:
      "Prove ∀x.(P(x) ∧ Q(x)) → (∀x.P(x)) ∧ (∀x.Q(x)) in natural deduction NM. Distribute the universal quantifier outside a conjunction.",
    hints: [
      "Assume ∀x.(P(x) ∧ Q(x)).",
      "Apply ∀E to extract P(x) ∧ Q(x), then decompose into P(x) and Q(x) with ∧E.",
      "Apply ∀I to each to create ∀x.P(x) and ∀x.Q(x).",
      "Combine with ∧I, discharge assumption with →I.",
    ],
    learningPoint:
      "∀ distributes over ∧, paired with nd-23 (reverse direction). The pattern is ∀E → ∧E → ∀I.",
  },
  "nd-33": {
    title: "∃ and ∨ Combination (NM)",
    description:
      "Prove (∃x.P(x)) ∨ (∃x.Q(x)) → ∃x.(P(x) ∨ Q(x)) in natural deduction NM. Unify a disjunction of existential quantifiers.",
    hints: [
      "Assume (∃x.P(x)) ∨ (∃x.Q(x)), apply ∨E for case analysis.",
      "∃x.P(x) case: extract P(x) with ∃E, apply ∨I_L then ∃I to get ∃x.(P(x) ∨ Q(x)).",
      "∃x.Q(x) case: extract Q(x) with ∃E, apply ∨I_R then ∃I to get ∃x.(P(x) ∨ Q(x)).",
      "Combine with ∨E, complete with →I.",
    ],
    learningPoint:
      "A proof requiring nested ∨E and ∃E. In each case, combine ∨I + ∃I.",
  },
  "nd-34": {
    title: "Quantifier De Morgan ¬∃→∀¬ (NM)",
    description:
      "Prove ¬∃x.P(x) → ∀x.¬P(x) in natural deduction NM. Derive a universal negation from the negation of an existential.",
    hints: [
      "Assume ¬∃x.P(x).",
      "Assume P(x), create ∃x.P(x) with ∃I.",
      "Derive ⊥ from ¬∃x.P(x) and ∃x.P(x) with →E.",
      "Discharge P(x) with →I to get ¬P(x). Apply ∀I for ∀x.¬P(x). Complete with →I.",
    ],
    learningPoint:
      "One direction of De Morgan's law for quantifiers. A basic pattern of creating a contradiction with ∃I + →E, then constructing a negation with →I. Provable in minimal logic.",
  },
  "nd-35": {
    title: "Quantifier De Morgan ∀¬→¬∃ (NM)",
    description:
      "Prove ∀x.¬P(x) → ¬∃x.P(x) in natural deduction NM. Derive the negation of an existential from a universal negation.",
    hints: [
      "Assume ∀x.¬P(x).",
      "Assume ∃x.P(x), extract P(x) with ∃E.",
      "Obtain ¬P(x) with ∀E, then derive ⊥ with P(x) and →E.",
      "Combine ⊥ via ∃E, discharge ∃x.P(x) with →I to get ¬∃x.P(x). Complete with →I.",
    ],
    learningPoint:
      "The reverse direction of De Morgan's law for quantifiers. A combination of ∃E + ∀E + →E. Paired with nd-34. Provable in minimal logic.",
  },
  "tab-01": {
    title: "Refutation of Identity (→)",
    description:
      "Construct a closed tableau with ¬(φ → φ) as root. Applying the ¬→ rule yields φ and ¬φ on the same branch, closing with BS.",
    hints: [
      "Apply the ¬→ rule to ¬(φ → φ), which adds φ and ¬φ to the antecedent.",
      "If φ and ¬φ are on the same branch, close with BS (basic set).",
    ],
    learningPoint:
      "In TAB, place the negation ¬φ of the formula to prove as the root, and prove by deriving a contradiction (refutation). The ¬→ rule is a basic rule that decomposes negated implications.",
  },
  "tab-02": {
    title: "Refutation of Double Negation Elimination (¬¬)",
    description:
      "Construct a closed tableau with ¬(¬¬φ → φ) as root. Decompose with ¬→, then eliminate double negation with the ¬¬ rule.",
    hints: [
      "Apply the ¬→ rule to ¬(¬¬φ → φ), adding ¬¬φ and ¬φ to the antecedent.",
      "Apply the ¬¬ rule to ¬¬φ, adding φ to the antecedent.",
      "φ and ¬φ on the same branch closes with BS.",
    ],
    learningPoint:
      "The TAB ¬¬ rule eliminates double negation. Double negation elimination, which requires 5 steps in Hilbert systems, can be handled directly in TAB.",
  },
  "tab-03": {
    title: "Refutation of Excluded Middle (¬∨, →)",
    description:
      "Construct a closed tableau with ¬(φ ∨ ¬φ) as root. Decomposing with ¬∨ yields ¬φ and ¬¬φ.",
    hints: [
      "Apply the ¬∨ rule to ¬(φ ∨ ¬φ), adding ¬φ and ¬¬φ to the antecedent.",
      "Apply the ¬¬ rule to ¬¬φ, adding φ to the antecedent.",
      "φ and ¬φ on the same branch closes with BS.",
    ],
    learningPoint:
      "The law of excluded middle φ ∨ ¬φ can be directly refuted in TAB. The ¬∨ rule decomposes a negated disjunction into two negations.",
  },
  "tab-04": {
    title: "Refutation of Contraposition (→, ¬→)",
    description:
      "Construct a closed tableau with ¬((φ → ψ) → (¬ψ → ¬φ)) as root. Combine implication decomposition and branching.",
    hints: [
      "Decompose with ¬→ to get φ → ψ and ¬(¬ψ → ¬φ).",
      "Apply ¬→ to ¬(¬ψ → ¬φ) to get ¬ψ and ¬¬φ.",
      "Apply ¬¬ to ¬¬φ to get φ.",
      "Apply → to φ → ψ to branch: ¬φ / ψ. Target BS on each branch.",
    ],
    learningPoint:
      "Contraposition is a basic theorem of classical logic. In TAB, branching via the → rule leads to independent contradictions on each branch.",
  },
  "tab-05": {
    title: "De Morgan's Law 1 (¬∧, ∨)",
    description:
      "Construct a closed tableau with ¬(¬(φ ∧ ψ) → (¬φ ∨ ¬ψ)) as root. Combine ¬∧ branching and ∨ branching.",
    hints: [
      "Decompose with ¬→ to get ¬(φ ∧ ψ) and ¬(¬φ ∨ ¬ψ).",
      "Apply ¬∨ to ¬(¬φ ∨ ¬ψ) to get ¬¬φ and ¬¬ψ.",
      "Apply ¬¬ to extract φ and ψ.",
      "Apply ¬∧ to ¬(φ ∧ ψ) to branch: ¬φ / ¬ψ. BS on each branch.",
    ],
    learningPoint:
      "De Morgan's law can be naturally proved using TAB's branching rule (¬∧). Each branch independently demonstrates a contradiction.",
  },
  "tab-06": {
    title: "De Morgan's Law 2 (¬∨, ∧)",
    description:
      "Construct a closed tableau with ¬(¬(φ ∨ ψ) → (¬φ ∧ ¬ψ)) as root. Decompose negation with ¬∨ and conjunction with ∧.",
    hints: [
      "Decompose with ¬→ to get ¬(φ ∨ ψ) and ¬(¬φ ∧ ¬ψ).",
      "Apply ¬∨ to ¬(φ ∨ ψ) to get ¬φ and ¬ψ.",
      "Apply ¬∧ to ¬(¬φ ∧ ¬ψ) to branch: ¬¬φ / ¬¬ψ.",
      "Apply ¬¬ on each branch to extract φ / ψ, then close with BS.",
    ],
    learningPoint:
      "The reverse direction of De Morgan's law is also naturally provable in TAB. The ¬∨ and ¬∧ rules directly handle negated logical connectives.",
  },
  "tab-07": {
    title: "Commutativity of Conjunction (∧, ¬∧)",
    description:
      "Construct a closed tableau with ¬((φ ∧ ψ) → (ψ ∧ φ)) as root. Decompose with ∧, close with ¬∧ branching.",
    hints: [
      "Decompose with ¬→ to get φ ∧ ψ and ¬(ψ ∧ φ).",
      "Apply the ∧ rule to φ ∧ ψ, adding φ and ψ to the antecedent.",
      "Apply ¬∧ to ¬(ψ ∧ φ) to branch: ¬ψ / ¬φ. BS on each branch.",
    ],
    learningPoint:
      "The ∧ rule decomposes a conjunction into two elements on the antecedent (no branching). ¬∧ involves branching, but each branch closes if a contradiction is found.",
  },
  "tab-08": {
    title: "Commutativity of Disjunction (∨, ¬∨)",
    description:
      "Construct a closed tableau with ¬((φ ∨ ψ) → (ψ ∨ φ)) as root. Combine ∨ branching with ¬∨.",
    hints: [
      "Decompose with ¬→ to get φ ∨ ψ and ¬(ψ ∨ φ).",
      "Apply ¬∨ to ¬(ψ ∨ φ), adding ¬ψ and ¬φ to the antecedent.",
      "Apply ∨ to φ ∨ ψ to branch: φ / ψ. BS on each branch.",
    ],
    learningPoint:
      "The ∨ rule involves branching (two premises), while ¬∨ adds two negations without branching. Note the symmetry between the rules.",
  },
  "tab-09": {
    title: "Refutation of Modus Tollens (→)",
    description:
      "Refute the contrapositive in another form. Handle ¬(((φ → ψ) ∧ ¬ψ) → ¬φ).",
    hints: [
      "Decompose with ¬→ to get (φ → ψ) ∧ ¬ψ and ¬¬φ.",
      "Apply ∧ to extract φ → ψ and ¬ψ, apply ¬¬ to get φ.",
      "Apply → to φ → ψ to branch: ¬φ / ψ.",
      "Left branch: BS with φ and ¬φ. Right branch: BS with ψ and ¬ψ.",
    ],
    learningPoint:
      "Modus tollens ((φ→ψ) ∧ ¬ψ → ¬φ) can be naturally proved via TAB's → branching. More intuitive than chaining MP in Hilbert systems.",
  },
  "tab-10": {
    title: "Refutation of Transitivity (→)",
    description:
      "Construct a closed tableau with ¬((φ → ψ) → ((ψ → χ) → (φ → χ))) as root. Process multiple → branchings.",
    hints: [
      "Decompose with ¬→ to get φ → ψ and ¬((ψ → χ) → (φ → χ)).",
      "Apply ¬→ again to get ψ → χ and ¬(φ → χ).",
      "Apply ¬→ to ¬(φ → χ) to get φ and ¬χ.",
      "Apply → to φ → ψ to branch: ¬φ / ψ. Left branch closes with BS. On the right branch, apply → to ψ → χ to branch: ¬ψ / χ.",
    ],
    learningPoint:
      "Transitivity is the most basic yet difficult lemma in Hilbert systems, but in TAB it can be proved by mechanically processing branches.",
  },
  "tab-11": {
    title: "Refutation of Double Negation Introduction (¬¬)",
    description:
      "Construct a closed tableau with ¬(φ → ¬¬φ) as root. Decompose with ¬→ and eliminate double negation with the ¬¬ rule.",
    hints: [
      "Decompose with ¬→ to get φ and ¬(¬¬φ).",
      "Apply ¬¬ to ¬¬¬φ to get ¬φ.",
      "φ and ¬φ on the same branch, close with BS.",
    ],
    learningPoint:
      "Double negation introduction (DNI) is simply closed in TAB by double negation elimination of ¬¬¬. A basic pattern paired with DNE.",
  },
  "tab-12": {
    title: "Refutation of Ex Falso (¬→, →)",
    description:
      "Construct a closed tableau with ¬(¬φ → (φ → ψ)) as root. The principle that anything follows from a contradiction.",
    hints: [
      "Decompose with ¬→ to get ¬φ and ¬(φ → ψ).",
      "Apply ¬→ to ¬(φ → ψ) again to get φ and ¬ψ.",
      "¬φ and φ on the same branch, close with BS.",
    ],
    learningPoint:
      "Ex falso quodlibet (EFQ) means anything can be derived from contradictory premises. In TAB, it closes mechanically with two applications of ¬→.",
  },
  "tab-13": {
    title: "De Morgan Reverse Direction (¬∧, ∨)",
    description:
      "Construct a closed tableau with ¬((¬φ ∨ ¬ψ) → ¬(φ ∧ ψ)) as root. Refute the reverse direction of De Morgan's law.",
    hints: [
      "Decompose with ¬→ to get ¬φ ∨ ¬ψ and ¬(¬(φ ∧ ψ)).",
      "Apply ¬¬ to ¬¬(φ ∧ ψ) to get φ ∧ ψ.",
      "Apply ∧ to get φ and ψ.",
      "Apply ∨ to branch: ¬φ branch closes with φ via BS, ¬ψ branch closes with ψ via BS.",
    ],
    learningPoint:
      "There are four directions of De Morgan's law. In TAB, all directions can be handled with ¬¬ elimination and ∧/∨ decomposition.",
  },
  "tab-14": {
    title: "Implication-Conjunction Distribution (¬∧, →)",
    description:
      "Construct a closed tableau with ¬((φ → (ψ ∧ χ)) → ((φ → ψ) ∧ (φ → χ))) as root. A theorem about implication distributing over conjunction.",
    hints: [
      "Decompose with ¬→: get φ → (ψ ∧ χ) and ¬((φ → ψ) ∧ (φ → χ)).",
      "Apply ¬∧ to branch: ¬(φ → ψ) and ¬(φ → χ) on two branches.",
      "On each branch, apply ¬→ to get φ and ¬ψ (or ¬χ).",
      "Apply → to φ → (ψ ∧ χ) to branch: ¬φ / (ψ ∧ χ). ¬φ branch closes with φ via BS. (ψ ∧ χ) branch extracts ψ and χ for contradiction.",
    ],
    learningPoint:
      "The theorem of implication distributing over conjunction branches into 2 via ¬∧ (beta rule), and each branch applies the → rule to the same implication to close.",
  },
  "tab-15": {
    title: "Associativity of Conjunction (∧, ¬∧)",
    description:
      "Construct a closed tableau with ¬(((φ ∧ ψ) ∧ χ) → (φ ∧ (ψ ∧ χ))) as root. The associativity theorem for conjunction.",
    hints: [
      "Decompose with ¬→: get (φ ∧ ψ) ∧ χ and ¬(φ ∧ (ψ ∧ χ)).",
      "Apply ∧ twice to get φ, ψ, χ.",
      "Apply ¬∧ to branch: ¬φ and ¬(ψ ∧ χ) on two branches.",
      "¬φ branch closes with φ via BS. ¬(ψ ∧ χ) branch applies ¬∧ again to branch into ¬ψ / ¬χ, each closing via BS.",
    ],
    learningPoint:
      "Associativity of conjunction is proved using ∧ (alpha rule) and ¬∧ (beta rule). Nested ¬∧ produces two levels of branching.",
  },
  "tab-16": {
    title: "Associativity of Disjunction (∨, ¬∨)",
    description:
      "Construct a closed tableau with ¬((φ ∨ (ψ ∨ χ)) → ((φ ∨ ψ) ∨ χ)) as root. The associativity theorem for disjunction.",
    hints: [
      "Decompose with ¬→: get φ ∨ (ψ ∨ χ) and ¬((φ ∨ ψ) ∨ χ).",
      "Apply ¬∨ twice to get ¬(φ ∨ ψ), ¬χ, then ¬φ, ¬ψ.",
      "Apply ∨ to branch: φ branch closes with ¬φ via BS. ψ ∨ χ branch applies ∨ again.",
      "ψ branch closes with ¬ψ via BS. χ branch closes with ¬χ via BS.",
    ],
    learningPoint:
      "Associativity of disjunction uses ¬∨ (alpha rule) and ∨ (beta rule). Two levels of ∨ branching is characteristic.",
  },
  "tab-17": {
    title: "Absorption Law (→, ¬∧)",
    description:
      "Construct a closed tableau with ¬((φ → ψ) → (φ → (φ ∧ ψ))) as root. The absorption theorem.",
    hints: [
      "Apply ¬→ twice: get φ → ψ, φ, ¬(φ ∧ ψ).",
      "Apply ¬∧ to branch: ¬φ and ¬ψ on two branches.",
      "¬φ branch closes with φ via BS.",
      "¬ψ branch: apply → to φ → ψ: ¬φ branch closes with φ via BS, ψ branch closes with ¬ψ via BS.",
    ],
    learningPoint:
      "The absorption law captures the 'premise is included' property. Combining ¬∧ and → branching closes all branches.",
  },
  "tab-18": {
    title: "Disjunctive Form of Implication (¬∨, →)",
    description:
      "Construct a closed tableau with ¬((φ → ψ) → (¬φ ∨ ψ)) as root. A classical theorem expressing implication as disjunction.",
    hints: [
      "Decompose with ¬→: get φ → ψ and ¬(¬φ ∨ ψ).",
      "Apply ¬∨ to get ¬¬φ and ¬ψ.",
      "Apply ¬¬ to get φ.",
      "Apply → to φ → ψ to branch: ¬φ branch closes with φ via BS, ψ branch closes with ¬ψ via BS.",
    ],
    learningPoint:
      "The equivalence of implication φ → ψ and disjunction ¬φ ∨ ψ is fundamental to classical logic. Prepare with ¬∨ and ¬¬, then close with → branching.",
  },
  "tab-19": {
    title: "Universal Elimination (∀ rule)",
    description:
      "Construct a closed tableau with ¬(∀x.P(x) → P(x)) as root. Basic practice applying the ∀ rule to a universal quantifier.",
    hints: [
      "Apply ¬→ to get ∀x.P(x) and ¬P(x).",
      "Apply the ∀ rule to substitute x in ∀x.P(x) and get P(x).",
      "Contradiction between P(x) and ¬P(x), close with BS.",
    ],
    learningPoint:
      "Applying the ∀ rule to ∀x.P(x) with a concrete term yields P(τ). The substitution term can be freely chosen.",
  },
  "tab-20": {
    title: "Existential to Negated Universal Negation (∃, ¬¬, ∀)",
    description:
      "Construct a closed tableau with ¬(∃x.P(x) → ¬∀x.¬P(x)) as root. Introduce an eigenvariable with the ∃ rule, then substitute the same variable with the ∀ rule.",
    hints: [
      "Apply ¬→ to get ∃x.P(x) and ¬¬∀x.¬P(x).",
      "Apply ¬¬ to get ∀x.¬P(x).",
      "Apply the ∃ rule to introduce eigenvariable a and get P(a).",
      "Apply the ∀ rule to substitute a in ∀x.¬P(x) to get ¬P(a). Close with BS.",
    ],
    learningPoint:
      "The ∃ rule has an eigenvariable condition: the introduced variable must not occur free in the sequent. The ∀ rule can reuse that eigenvariable as a substitution term.",
  },
  "tab-21": {
    title: "Universal Implication Distribution (¬∀, ∀, → branching)",
    description:
      "Construct a closed tableau with ¬(∀x.(P(x)→Q(x)) → (∀x.P(x) → ∀x.Q(x))) as root. Introduce eigenvariable with ¬∀, substitute with ∀, branch with →.",
    hints: [
      "Decompose with ¬→ twice: get ∀x.(P(x)→Q(x)), ∀x.P(x), and ¬∀x.Q(x).",
      "Apply ¬∀ to introduce eigenvariable a: get ¬Q(a).",
      "Apply ∀ to substitute a in both ∀x.P(x) and ∀x.(P(x)→Q(x)).",
      "Apply → to P(a) → Q(a) to branch: left branch BS(¬P(a), P(a)), right branch BS(Q(a), ¬Q(a)).",
    ],
    learningPoint:
      "After introducing an eigenvariable with ¬∀, the same variable can be substituted into multiple ∀-quantified formulas. Each branch of → closes independently.",
  },
  "tab-22": {
    title: "Universal Conjunction Distribution (¬∧ branching, ¬∀, ∀, ∧)",
    description:
      "Construct a closed tableau with ¬(∀x.(P(x)∧Q(x)) → (∀x.P(x) ∧ ∀x.Q(x))) as root. Branch with ¬∧, then use ¬∀+∀+∧ on each branch.",
    hints: [
      "Apply ¬→ to get ∀x.(P(x)∧Q(x)) and ¬(∀x.P(x) ∧ ∀x.Q(x)).",
      "Apply ¬∧ to branch: left ¬∀x.P(x), right ¬∀x.Q(x).",
      "On each branch: ¬∀ → eigenvariable introduction → ∀ substitution → ∧ decomposition → BS.",
      "Left branch: ¬P(a) vs P(a), right branch: ¬Q(a) vs Q(a) to close.",
    ],
    learningPoint:
      "¬∧ branching generates two independent branches. Each branch uses the pipeline ¬∀→∀→∧ to close.",
  },
  "tab-23": {
    title: "Universal to Existential (∀, ¬∃)",
    description:
      "Construct a closed tableau with ¬(∀x.P(x) → ∃x.P(x)) as root. After concretizing with the ∀ rule, substitute the same variable with ¬∃.",
    hints: [
      "Apply ¬→ to get ∀x.P(x) and ¬∃x.P(x).",
      "Apply the ∀ rule to substitute x in ∀x.P(x) to get P(x).",
      "Apply the ¬∃ rule to substitute x in ¬∃x.P(x) to get ¬P(x).",
      "Contradiction between P(x) and ¬P(x), close with BS.",
    ],
    learningPoint:
      "The ¬∃ rule allows substituting any term, similar to the ∀ rule. Apply the term obtained from ∀ to ¬∃ as well to derive a contradiction.",
  },
  "tab-24": {
    title: "Existential Conjunction Distribution (∃, ∧, ¬∃)",
    description:
      "Construct a closed tableau with ¬(∃x.(P(x) ∧ Q(x)) → ∃x.P(x)) as root. Introduce eigenvariable with ∃, decompose with ∧, then substitute the same variable with ¬∃.",
    hints: [
      "Apply ¬→ to get ∃x.(P(x)∧Q(x)) and ¬∃x.P(x).",
      "Apply the ∃ rule to introduce eigenvariable a and get P(a)∧Q(a).",
      "Apply the ∧ rule to decompose into P(a) and Q(a).",
      "Apply ¬∃ to substitute a in ¬∃x.P(x) to get ¬P(a). Close with BS.",
    ],
    learningPoint:
      "The eigenvariable introduced by the ∃ rule can be reused as a substitution term for ¬∃. The flow ∧ decomposition → ¬∃ derives a contradiction.",
  },
  "tab-25": {
    title: "Negated Universal to Existential Negation (¬∀, ¬∃, ¬¬)",
    description:
      "Construct a closed tableau with ¬(¬∀x.P(x) → ∃x.¬P(x)) as root. Introduce eigenvariable with ¬∀, substitute with ¬∃+¬¬ to derive contradiction.",
    hints: [
      "Apply ¬→ to get ¬∀x.P(x) and ¬∃x.¬P(x).",
      "Apply ¬∀ to introduce eigenvariable a: get ¬P(a).",
      "Apply ¬∃ to substitute a in ¬∃x.¬P(x): get ¬¬P(a).",
      "Apply ¬¬ to ¬¬P(a) → P(a). BS with P(a) and ¬P(a).",
    ],
    learningPoint:
      "Use the eigenvariable from ¬∀ as the substitution term for ¬∃, restore the original predicate with ¬¬ elimination, and derive a contradiction.",
  },
  "tab-26": {
    title: "Existential Disjunction Distribution (∨ branching, ∃, ¬∃, ¬∨)",
    description:
      "Construct a closed tableau with ¬((∃x.P(x) ∨ ∃x.Q(x)) → ∃x.(P(x) ∨ Q(x))) as root. Branch with ∨, then apply ∃+¬∃+¬∨ pipeline on each branch.",
    hints: [
      "Apply ¬→ to get ∃x.P(x)∨∃x.Q(x) and ¬∃x.(P(x)∨Q(x)).",
      "Apply ∨ to branch: left ∃x.P(x), right ∃x.Q(x).",
      "On each branch: apply ∃ to introduce eigenvariable a → ¬∃ to substitute a → ¬∨ to decompose → BS.",
    ],
    learningPoint:
      "Apply the ∃→¬∃→¬∨ pipeline independently on each branch produced by ∨ branching. Eigenvariables on each branch are independent.",
  },
  "at-01": {
    title: "Excluded Middle (alpha/beta rules)",
    description:
      "Place F:φ ∨ ¬φ as root and close all branches to prove φ ∨ ¬φ. Branch with beta rule, close with alpha rule.",
    hints: [
      "Place F(φ ∨ ¬φ) as the root node (text: F:phi \\/ ~phi).",
      "F(φ ∨ ψ) is an alpha rule (F∨): adds F(φ) and F(ψ) on the same branch.",
      "F(¬φ) is an alpha rule (F¬): converts to T(φ).",
      "If T(φ) and F(φ) are on the same branch, close with the closure rule.",
    ],
    learningPoint:
      "In analytic tableaux, place F(target formula) as root and prove by deriving a contradiction (refutation). Alpha rules do not branch, beta rules branch into two.",
  },
  "at-02": {
    title: "Basic Implication (alpha rule)",
    description:
      "Place F:φ → (ψ → φ) as root and close all branches to prove φ → (ψ → φ). Repeatedly apply the F→ rule.",
    hints: [
      "Place F(φ → (ψ → φ)) as the root (text: F:phi -> (psi -> phi)).",
      "F(φ → ψ) is an alpha rule (F→): adds T(φ) and F(ψ) on the same branch.",
      "Applying F→ twice yields T(φ) and F(φ), close with closure.",
    ],
    learningPoint:
      "The F→ rule decomposes F(φ → ψ) into T(φ) and F(ψ), a non-branching (alpha) rule. It separates a negated implication into premise and negated conclusion.",
  },
  "at-03": {
    title: "Double Negation Elimination (alpha rule)",
    description:
      "Place F:~~phi -> phi as root and close all branches to prove ~~phi -> phi. Uses the double negation alpha rule.",
    hints: [
      "Place F(~~phi -> phi) as the root node (text: F:~~phi -> phi).",
      "Apply F-> rule to get T(~~phi) and F(phi).",
      "Apply T~~ rule to T(~~phi) to get T(phi).",
      "T(phi) and F(phi) give closure.",
    ],
    learningPoint:
      "Double negation elimination is handled directly by the T~~ alpha rule. Proofs that require multiple steps in Hilbert systems are simple in tableaux.",
  },
  "at-04": {
    title: "Contraposition (alpha/beta rules)",
    description:
      "Place F:(phi -> psi) -> (~psi -> ~phi) as root and close all branches to prove contraposition. Process branching with beta rules.",
    hints: [
      "Place F((phi -> psi) -> (~psi -> ~phi)) as root.",
      "Apply F-> to get T(phi -> psi) and F(~psi -> ~phi).",
      "Apply F-> to F(~psi -> ~phi) to get T(~psi) and F(~phi).",
      "T(~psi) -> F(psi), F(~phi) -> T(phi). Apply T-> (beta rule) to T(phi -> psi) to branch: F(phi)/T(psi). Each branch closes.",
    ],
    learningPoint:
      "T-> is a beta rule with branching. It splits into F(antecedent) and T(consequent) branches, each requiring independent contradiction.",
  },
  "at-05": {
    title: "De Morgan (alpha/beta rules)",
    description:
      "Place F:~(phi /\\ psi) -> (~phi \\/ ~psi) as root and close all branches to prove De Morgan's law.",
    hints: [
      "Place F(~(phi /\\ psi) -> (~phi \\/ ~psi)) as root.",
      "Apply F-> to get T(~(phi /\\ psi)) and F(~phi \\/ ~psi).",
      "Apply T~ to T(~(phi /\\ psi)) to get F(phi /\\ psi). F(phi /\\ psi) is a beta rule (F/\\) that branches.",
      "Apply F\\/ to F(~phi \\/ ~psi) to get F(~phi) and F(~psi) -> T(phi) and T(psi).",
      "Each branch closes with F(phi)/T(phi) or F(psi)/T(psi) contradiction.",
    ],
    learningPoint:
      "F/\\ is a beta rule (branching), F\\/ is an alpha rule (non-branching). De Morgan's law is proved by combining these symmetric rules.",
  },
  "at-06": {
    title: "Distribution (compound branching)",
    description:
      "Place F:(phi /\\ (psi \\/ chi)) -> ((phi /\\ psi) \\/ (phi /\\ chi)) as root and close all branches to prove the distributive law.",
    hints: [
      "Apply F-> to get T(phi /\\ (psi \\/ chi)) and F((phi /\\ psi) \\/ (phi /\\ chi)).",
      "Apply T/\\ (alpha rule) to T(phi /\\ (psi \\/ chi)) to get T(phi) and T(psi \\/ chi).",
      "Apply F\\/ (alpha rule) to F((phi /\\ psi) \\/ (phi /\\ chi)) to get F(phi /\\ psi) and F(phi /\\ chi).",
      "Apply T\\/ (beta rule) to T(psi \\/ chi) to branch. Apply F/\\ (beta rule) in each branch to close.",
    ],
    learningPoint:
      "The distributive law involves multiple branches. T/\\/F\\/ are alpha rules (non-branching), T\\//F/\\ are beta rules (branching). The order of beta rule application affects the number of branches.",
  },
  "at-07": {
    title: "Universal to Existential (gamma/delta rules)",
    description:
      "Place F:all x.P(x) -> ex x.P(x) as root and close all branches to prove forall x.P(x) -> exists x.P(x). Uses quantifier rules.",
    hints: [
      "Place F(forall x.P(x) -> exists x.P(x)) as root (text: F:all x. P(x) -> ex x. P(x)).",
      "Apply F-> to get T(forall x.P(x)) and F(exists x.P(x)).",
      "Apply delta rule (F exists) to F(exists x.P(x)): F(P(a)) (eigenvariable a).",
      "Apply gamma rule (T forall) to T(forall x.P(x)): T(P(a)) (using term a).",
      "T(P(a)) and F(P(a)) give closure.",
    ],
    learningPoint:
      "Gamma rules (T forall/F exists) can substitute any term. Delta rules (F forall/T exists) substitute a fresh variable satisfying the eigenvariable condition. Using delta-introduced variables as gamma terms is a typical pattern.",
  },
  "at-08": {
    title: "Conjunction Commutativity (alpha rule)",
    description:
      "Place F:(phi /\\ psi) -> (psi /\\ phi) as root and close all branches to prove conjunction commutativity. Distinguish T/\\/F/\\ alpha/beta rules.",
    hints: [
      "Place F((phi /\\ psi) -> (psi /\\ phi)) as root (text: F:(phi /\\ psi) -> (psi /\\ phi)).",
      "Apply F-> to get T(phi /\\ psi) and F(psi /\\ phi).",
      "Apply alpha rule (T/\\) to T(phi /\\ psi): get T(phi) and T(psi).",
      "Apply beta rule (F/\\) to F(psi /\\ phi): branch into F(psi) and F(phi). Each contradicts T(psi)/T(phi).",
    ],
    learningPoint:
      "T/\\ is an alpha rule (non-branching) that yields both components. F/\\ is a beta rule (branching) representing that at least one is false. Apply alpha rules first to maximize information.",
  },
  "at-09": {
    title: "Disjunction Commutativity (beta rule)",
    description:
      "Place F:(phi \\/ psi) -> (psi \\/ phi) as root and close all branches to prove disjunction commutativity. Distinguish T\\//F\\/ beta/alpha rules.",
    hints: [
      "Place F((phi \\/ psi) -> (psi \\/ phi)) as root (text: F:(phi \\/ psi) -> (psi \\/ phi)).",
      "Apply F-> to get T(phi \\/ psi) and F(psi \\/ phi).",
      "Apply alpha rule (F\\/) to F(psi \\/ phi): get F(psi) and F(phi).",
      "Apply beta rule (T\\/) to T(phi \\/ psi): branch into T(phi) and T(psi). Each contradicts F(phi)/F(psi).",
    ],
    learningPoint:
      "F\\/ is an alpha rule (non-branching) that negates both disjuncts. T\\/ is a beta rule (branching) representing that at least one is true. Apply F\\/ first for efficiency.",
  },
  "at-10": {
    title: "Transitivity (multiple F-> decomposition)",
    description:
      "Place F:(phi -> psi) -> ((psi -> chi) -> (phi -> chi)) as root and close all branches to prove transitivity of implication.",
    hints: [
      "Place F((phi -> psi) -> ((psi -> chi) -> (phi -> chi))) as root.",
      "Apply F-> repeatedly: get T(phi -> psi), T(psi -> chi), T(phi), F(chi).",
      "Apply beta rule (T->) to T(phi -> psi): branch into F(phi) and T(psi).",
      "F(phi) contradicts T(phi). In the T(psi) branch, apply beta rule to T(psi -> chi): branch into F(psi) and T(chi).",
      "F(psi) contradicts T(psi). T(chi) contradicts F(chi). All branches closed.",
    ],
    learningPoint:
      "F-> is an alpha rule (non-branching) that makes antecedent T and consequent F. T-> is a beta rule (branching) into F(antecedent) or T(consequent). Apply all F-> first, then branch with T->.",
  },
  "at-11": {
    title: "De Morgan 2 (alpha-centric)",
    description:
      "Place F:~(phi \\/ psi) -> (~phi /\\ ~psi) as root and close all branches to prove De Morgan's law (disjunction version).",
    hints: [
      "Place F(~(phi \\/ psi) -> (~phi /\\ ~psi)) as root (text: F:~(phi \\/ psi) -> (~phi /\\ ~psi)).",
      "Apply F-> to get T(~(phi \\/ psi)) and F(~phi /\\ ~psi).",
      "Apply T~ to get F(phi \\/ psi) from T(~(phi \\/ psi)).",
      "Apply F\\/ (alpha rule) to get F(phi) and F(psi).",
      "Apply F/\\ (beta rule) to branch into F(~phi) and F(~psi). Apply F~ to get T(phi)/T(psi) for contradiction.",
    ],
    learningPoint:
      "T~ flips to F, F~ flips to T (alpha rules). For ~(phi \\/ psi), proceed T~ -> F\\/ for non-branching information gain.",
  },
  "at-12": {
    title: "Implication De Morgan (alpha rule)",
    description:
      "Place F:~(phi -> psi) -> (phi /\\ ~psi) as root and close all branches to prove ~(phi -> psi) -> (phi /\\ ~psi). Completes with alpha rules only.",
    hints: [
      "Place F(~(phi -> psi) -> (phi /\\ ~psi)) as root (text: F:~(phi -> psi) -> (phi /\\ ~psi)).",
      "Apply F-> to get T(~(phi -> psi)) and F(phi /\\ ~psi).",
      "Apply T~ to get F(phi -> psi). Apply F-> (alpha) to get T(phi) and F(psi).",
      "Apply F/\\ (beta rule) to branch into F(phi) and F(~psi). F(phi) contradicts T(phi). F~ gives F(~psi) -> T(psi) -> contradicts F(psi).",
    ],
    learningPoint:
      "~(phi -> psi) decomposes into T(phi) and F(psi) via a chain of alpha rules. F/\\ beta rule is the only branching point.",
  },
  "at-13": {
    title: "Double Negation Introduction (alpha rule)",
    description:
      "Place F:phi -> ~~phi as root and close all branches to prove phi -> ~~phi. Uses negation alpha rules.",
    hints: [
      "Place F(phi -> ~~phi) as root (text: F:phi -> ~~phi).",
      "Apply F-> to get T(phi) and F(~~phi).",
      "Apply F~ to get F(~~phi) -> T(~phi). Apply T~ to get T(~phi) -> F(phi).",
      "T(phi) and F(phi) give closure.",
    ],
    learningPoint:
      "Double negation introduction uses a two-step F~ -> T~ alpha rule chain. This is the counterpart to at-03 (double negation elimination).",
  },
  "at-14": {
    title: "Implication-Disjunction Conversion (beta rule)",
    description:
      "Place F:(phi -> psi) -> (~phi \\/ psi) as root and close all branches to prove the conversion from implication to disjunction. T-> beta rule is key.",
    hints: [
      "Place F((phi -> psi) -> (~phi \\/ psi)) as root.",
      "Apply F-> to get T(phi -> psi) and F(~phi \\/ psi).",
      "Apply F\\/ (alpha rule) to get F(~phi) and F(psi). Apply F~ to get F(~phi) -> T(phi).",
      "Apply beta rule (T->) to T(phi -> psi): branch into F(phi) and T(psi).",
      "F(phi) contradicts T(phi). T(psi) contradicts F(psi). All branches closed.",
    ],
    learningPoint:
      "Implication phi -> psi is equivalent to ~phi \\/ psi. The T-> beta rule branching into F(antecedent)/T(consequent) reflects this equivalence.",
  },
  "at-15": {
    title: "Peirce's Law (compound beta rule)",
    description:
      "Place F:((phi -> psi) -> phi) -> phi as root and close all branches to prove Peirce's law. Apply T-> beta rule twice.",
    hints: [
      "Place F(((phi -> psi) -> phi) -> phi) as root (text: F:((phi -> psi) -> phi) -> phi).",
      "Apply F-> to get T((phi -> psi) -> phi) and F(phi).",
      "Apply beta rule (T->) to T((phi -> psi) -> phi): branch into F(phi -> psi) and T(phi).",
      "T(phi) branch contradicts F(phi) via closure.",
      "In the F(phi -> psi) branch, apply alpha rule (F->): get T(phi) and F(psi). T(phi) contradicts F(phi) via closure.",
    ],
    learningPoint:
      "Peirce's law is a tautology unique to classical logic. In tableaux, a single T-> beta rule splits into 2 branches that close quickly. Hilbert systems and ND require more complex proofs, but tableaux handle it efficiently.",
  },
  "at-16": {
    title: "Existential to Negated Universal (delta/gamma rules)",
    description:
      "Place F:ex x.P(x) -> ~(all x.~P(x)) as root and close all branches. Uses delta rule (T exists) for eigenvariable introduction and gamma rule (T forall) for term substitution.",
    hints: [
      "Place F(ex x.P(x) -> ~(all x.~P(x))) as root (text: F:ex x. P(x) -> ~(all x. ~P(x))).",
      "Apply F-> to get T(ex x.P(x)) and F(~(all x.~P(x))).",
      "Apply F~ to get F(~(all x.~P(x))) -> T(all x.~P(x)).",
      "Apply delta rule (T exists) to T(ex x.P(x)): T(P(a)) (eigenvariable a).",
      "Apply gamma rule (T forall) to T(all x.~P(x)) with term a: T(~P(a)). Apply T~ to get F(P(a)).",
      "T(P(a)) and F(P(a)) give closure.",
    ],
    learningPoint:
      "Reusing eigenvariables introduced by delta rules as concrete terms in gamma rules is a standard pattern. exists -> ~forall~ holds in intuitionistic logic as well.",
  },
  "at-17": {
    title: "Universal-Implication Distribution (gamma rule x2)",
    description:
      "Place F:all x.(P(x) -> Q(x)) -> (all x.P(x) -> all x.Q(x)) as root and close all branches. Apply gamma rule multiple times.",
    hints: [
      "Place F(all x.(P(x) -> Q(x)) -> (all x.P(x) -> all x.Q(x))) as root.",
      "Apply F-> twice: get T(all x.(P(x) -> Q(x))), T(all x.P(x)), F(all x.Q(x)).",
      "Apply delta rule (F forall) to F(all x.Q(x)): F(Q(a)) (eigenvariable a).",
      "Apply gamma rule (T forall, term a) to T(all x.(P(x) -> Q(x))): T(P(a) -> Q(a)).",
      "Apply beta rule (T->) to T(P(a) -> Q(a)): branch into F(P(a)) and T(Q(a)).",
      "Apply gamma rule (T forall, term a) to T(all x.P(x)): T(P(a)). Contradicts F(P(a)). T(Q(a)) contradicts F(Q(a)).",
    ],
    learningPoint:
      "Gamma rules can be applied multiple times to the same universal formula (with different terms). Using delta-introduced eigenvariables as gamma terms is the standard pattern.",
  },
  "at-18": {
    title: "Universal-Conjunction Distribution (gamma rule + F/\\)",
    description:
      "Place F:all x.(P(x) /\\ Q(x)) -> (all x.P(x) /\\ all x.Q(x)) as root and close all branches. Combine gamma rule with F/\\ beta rule.",
    hints: [
      "Place F(all x.(P(x) /\\ Q(x)) -> (all x.P(x) /\\ all x.Q(x))) as root.",
      "Apply F-> to get T(all x.(P(x) /\\ Q(x))) and F(all x.P(x) /\\ all x.Q(x)).",
      "Apply F/\\ (beta rule) to branch into F(all x.P(x)) and F(all x.Q(x)).",
      "In each branch, apply delta rule (F forall) to introduce eigenvariable: F(P(a)) / F(Q(b)).",
      "Apply gamma rule (T forall) to T(all x.(P(x) /\\ Q(x))): get T(P(a) /\\ Q(a)) / T(P(b) /\\ Q(b)).",
      "Apply T/\\ (alpha rule) to get T(P(a)), T(Q(a)) / T(P(b)), T(Q(b)) for contradiction in each branch.",
    ],
    learningPoint:
      "Each branch from F/\\ beta rule independently introduces eigenvariables via delta rules. Use the corresponding eigenvariable for gamma rules in each branch.",
  },
  "at-19": {
    title: "Existential-Disjunction Converse (T\\/ beta + delta rule)",
    description:
      "Place F:(ex x.P(x) \\/ ex x.Q(x)) -> ex x.(P(x) \\/ Q(x)) as root and close all branches. Combine T\\/ beta rule with quantifier delta rules.",
    hints: [
      "Place F((ex x.P(x) \\/ ex x.Q(x)) -> ex x.(P(x) \\/ Q(x))) as root.",
      "Apply F-> to get T(ex x.P(x) \\/ ex x.Q(x)) and F(ex x.(P(x) \\/ Q(x))).",
      "Apply T\\/ (beta rule) to branch into T(ex x.P(x)) and T(ex x.Q(x)).",
      "In each branch, apply delta rule (T exists): T(P(a)) / T(Q(b)).",
      "For F(ex x.(P(x) \\/ Q(x))): reconsider gamma rule application (F exists cannot use delta rule directly here...)",
      "F(ex x.(P(x) \\/ Q(x))) is equivalent to ~ex x.(P(x)\\/Q(x)), so apply gamma rule (F exists, any term): F(P(a)\\/Q(a)) / F(P(b)\\/Q(b)).",
      "Apply F\\/ (alpha rule) to get F(P(a)), F(Q(a)) / F(P(b)), F(Q(b)) for contradiction.",
    ],
    learningPoint:
      "F exists is a gamma rule (any-term substitution) and can be applied multiple times. Pass delta-introduced eigenvariables from each T\\/ branch to the F exists gamma rule.",
  },
  "sc-01": {
    title: "Identity",
    description:
      "Prove phi -> phi in sequent calculus. Derive using the =>-> rule (->right) and Identity axiom.",
    hints: [
      "Using the =>-> rule, reduce => phi -> phi to phi => phi.",
      "phi => phi is the Identity axiom itself.",
    ],
    learningPoint:
      "The =>-> rule in sequent calculus corresponds to moving hypotheses to the antecedent to prove implication. The Identity axiom is the foundation of all proofs.",
  },
  "sc-02": {
    title: "Weakening Left",
    description:
      "Prove phi -> (psi -> phi) in sequent calculus. Use Weakening Left (WL) to add an unnecessary antecedent.",
    hints: [
      "Apply =>-> twice to reduce to phi, psi => phi.",
      "phi => phi is Identity. Apply WL (Weakening Left) to add psi, giving phi, psi => phi.",
    ],
    learningPoint:
      "Weakening is a structural rule that adds an unnecessary formula to the antecedent. It corresponds to the Hilbert K axiom phi -> (psi -> phi).",
  },
  "sc-03": {
    title: "Contraction Left",
    description:
      "Prove (phi -> (phi -> psi)) -> (phi -> psi) in sequent calculus. Use Contraction Left (CL) to merge duplicate antecedents.",
    hints: [
      "Apply =>-> twice to reduce to phi -> (phi -> psi), phi => psi.",
      "Apply ->=> to decompose phi -> (phi -> psi): phi => phi and phi -> psi, phi => psi.",
      "phi -> psi, phi => psi also decomposes with ->=>. Use CL (Contraction Left) to merge duplicate phi.",
    ],
    learningPoint:
      "Contraction is a structural rule that removes duplicate antecedents. It is needed when a hypothesis is used multiple times in a proof.",
  },
  "sc-04": {
    title: "Exchange",
    description:
      "Prove (phi -> (psi -> chi)) -> (psi -> (phi -> chi)) in sequent calculus. Use Exchange Left (XL) to swap antecedent order.",
    hints: [
      "Apply =>-> three times to reduce to phi -> (psi -> chi), psi, phi => chi.",
      "Apply ->=> to decompose phi -> (psi -> chi).",
      "Use XL (Exchange Left) to swap the antecedent order as needed.",
    ],
    learningPoint:
      "Exchange is a structural rule that reorders antecedents. While implicit in Hilbert systems, sequent calculus makes this operation explicit.",
  },
  "sc-05": {
    title: "Conjunction Introduction (R)",
    description:
      "Prove phi -> (psi -> (phi /\\ psi)) in sequent calculus. Use the =>/\\ rule to construct a conjunction.",
    hints: [
      "Apply =>-> twice to reduce to phi, psi => phi /\\ psi.",
      "The =>/\\ rule requires two premises: phi, psi => phi and phi, psi => psi.",
      "Each is derived with Identity + WL.",
    ],
    learningPoint:
      "The =>/\\ (conjunction right) rule introduces a conjunction. It requires two premises, proving each component separately.",
  },
  "sc-06": {
    title: "Disjunction Elimination (L)",
    description:
      "Prove (phi \\/ psi) -> ((phi -> chi) -> ((psi -> chi) -> chi)) in sequent calculus. Use the \\/=> rule to decompose a disjunction.",
    hints: [
      "Apply =>-> three times to reduce to phi \\/ psi, phi -> chi, psi -> chi => chi.",
      "Apply \\/=> to decompose phi \\/ psi: two premises phi, phi -> chi, psi -> chi => chi and psi, phi -> chi, psi -> chi => chi.",
      "In each premise, use ->=> to derive chi.",
    ],
    learningPoint:
      "The \\/=> (disjunction left) rule performs case analysis on a disjunction. Each branch must independently prove the conclusion.",
  },
  "sc-07": {
    title: "Excluded Middle (LK)",
    description:
      "Prove phi \\/ ~phi in sequent calculus (LK system). The heart of classical logic.",
    hints: [
      "Combine =>\\/  and =>~ rules.",
      "From => phi \\/ ~phi, apply =>\\/2 to reduce to => ~phi, then =>~ to reduce to phi =>.",
      "phi => phi \\/ ~phi follows from =>\\/1 + Identity. LK allows multiple formulas on the right side.",
      "Apply CR (Contraction Right) to merge phi \\/ ~phi on the right.",
    ],
    learningPoint:
      "Excluded middle phi \\/ ~phi is specific to LK (classical logic). It cannot be proved in LJ (intuitionistic logic). LK allows multiple formulas on the right side, enabling this proof.",
  },
  "sc-08": {
    title: "Double Negation Elimination (LK)",
    description:
      "Prove ~~phi -> phi in sequent calculus (LK system). Combination of ~=> and =>~.",
    hints: [
      "Apply =>-> to reduce to ~~phi => phi.",
      "Apply ~=> to decompose ~~phi: requires premise => ~phi, phi.",
      "Apply =>~ to reduce => ~phi to phi =>. phi => phi is Identity.",
    ],
    learningPoint:
      "Double negation elimination ~~phi -> phi is LK-specific. The ~=> rule removes negation from the antecedent and moves the content to the succedent.",
  },
  "sc-09": {
    title: "Contraposition",
    description:
      "Prove (phi -> psi) -> (~psi -> ~phi) in sequent calculus. Interaction of negation and implication.",
    hints: [
      "Apply =>-> twice to reduce to phi -> psi, ~psi => ~phi.",
      "Apply =>~ to reduce to phi -> psi, ~psi, phi =>.",
      "Apply ->=> to decompose phi -> psi, and ~=> to decompose ~psi.",
    ],
    learningPoint:
      "The contraposition proof is a typical combination of implication and negation rules. Sequent calculus makes the interaction of each rule clearly visible.",
  },
  "sc-10": {
    title: "De Morgan's Law",
    description:
      "Prove ~(phi /\\ psi) -> (~phi \\/ ~psi) in sequent calculus. Relationship between negation and conjunction/disjunction.",
    hints: [
      "Apply =>-> to reduce to ~(phi /\\ psi) => ~phi \\/ ~psi.",
      "Apply ~=> to decompose ~(phi /\\ psi): requires premise => phi /\\ psi, ~phi \\/ ~psi.",
      "Apply =>/\\ to prove phi and psi separately. Combine =>\\/ and =>~.",
      "LK allows multiple formulas on the right, so ~phi \\/ ~psi can remain while operating.",
    ],
    learningPoint:
      "De Morgan's law is a typical example utilizing LK's multiple-formula succedent. The duality of negation with conjunction/disjunction is clearly expressed in sequent calculus.",
  },
  "sc-11": {
    title: "LJ: Identity",
    description:
      "Prove phi -> phi in intuitionistic sequent calculus (LJ system). LJ restricts the succedent to at most one formula. This basic theorem is still provable in LJ.",
    hints: [
      "Same as LK: apply =>-> to reduce to phi => phi.",
      "phi => phi is the Identity axiom itself.",
    ],
    learningPoint:
      "LJ restricts the succedent to at most one formula, but basic theorems like identity are provable without issues.",
  },
  "sc-12": {
    title: "LJ: Ex Falso",
    description:
      "Prove bottom -> phi in LJ system. Use the bottom=> (bottom-left) rule to derive any proposition from contradiction. An important principle of intuitionistic logic.",
    hints: [
      "Apply =>-> to reduce to bottom => phi.",
      "The bottom=> rule derives any conclusion when bottom is in the antecedent.",
    ],
    learningPoint:
      "The bottom=> (bottom-left) rule is characteristic of intuitionistic logic. Any proposition can be constructively derived from contradiction (bottom). This rule is absent in minimal logic (LM).",
  },
  "sc-13": {
    title: "LJ: Contraposition",
    description:
      "Prove (phi -> psi) -> (~psi -> ~phi) in LJ system. Contraposition holds in intuitionistic logic. Learn to handle negation under the single-succedent restriction.",
    hints: [
      "Apply =>-> three times to reduce to phi -> psi, ~psi, phi => (empty succedent is allowed).",
      "Apply ->=> to decompose phi -> psi: branches into phi => phi and psi, ... =>.",
      "Apply ~=> to decompose ~psi: requires premise => psi. Supply this psi from the ->=> result.",
    ],
    learningPoint:
      "Contraposition (phi->psi)->(~psi->~phi) holds intuitionistically. However, the converse (~psi->~phi)->(phi->psi) is not provable in LJ.",
  },
  "sc-14": {
    title: "LJ: Disjunction Elimination",
    description:
      "Prove (phi \\/ psi) -> ((phi -> chi) -> ((psi -> chi) -> chi)) in LJ system. Constructive disjunction elimination is provable in LJ.",
    hints: [
      "Apply =>-> three times to reduce to phi \\/ psi, phi -> chi, psi -> chi => chi.",
      "Apply \\/=> to decompose phi \\/ psi: two premises phi, ... => chi and psi, ... => chi.",
      "In each branch, use ->=> to decompose phi -> chi (or psi -> chi) and close with Identity.",
    ],
    learningPoint:
      "Disjunction elimination is constructively valid (exhausting all cases to derive the conclusion), so it is provable in LJ. The single-succedent restriction has no effect.",
  },
  "sc-15": {
    title: "LJ: Conjunction Elimination",
    description:
      "Prove (phi /\\ psi) -> phi in LJ system. Basic operation of decomposing conjunction with the /\\=> (conjunction left) rule.",
    hints: [
      "Apply =>-> to reduce to phi /\\ psi => phi.",
      "Apply /\\=> to decompose phi /\\ psi: becomes phi, psi => phi.",
      "phi => phi is Identity; psi is removed by Weakening Left.",
    ],
    learningPoint:
      "The /\\=> (conjunction left) rule decomposes conjunctions from the antecedent. Unnecessary components are removed by weakening.",
  },
  "sc-16": {
    title: "LJ: Conjunction Commutativity",
    description:
      "Prove (phi /\\ psi) -> (psi /\\ phi) in LJ system. Swap left and right of a conjunction. Combination of /\\=> and =>/\\.",
    hints: [
      "Apply =>-> to reduce to phi /\\ psi => psi /\\ phi.",
      "Apply =>/\\ to decompose the right side: two premises phi /\\ psi => psi and phi /\\ psi => phi.",
      "In each premise, use /\\=> to decompose phi /\\ psi and close with Identity and weakening.",
    ],
    learningPoint:
      "Conjunction commutativity is a typical example combining /\\=> (decomposition) and =>/\\ (introduction). Provable in LJ without issues.",
  },
  "sc-17": {
    title: "LJ: Implication Transitivity",
    description:
      "Prove (phi -> psi) -> ((psi -> chi) -> (phi -> chi)) in LJ system. Transitivity of implication is a basic theorem of intuitionistic logic.",
    hints: [
      "Apply =>-> three times to reduce to phi -> psi, psi -> chi, phi => chi.",
      "Apply ->=> to decompose phi -> psi: branches into phi => phi and psi, psi -> chi, ... => chi.",
      "psi, psi -> chi => chi is closed with ->=> + Identity.",
    ],
    learningPoint:
      "Implication transitivity is a basic theorem that holds in intuitionistic logic. It is proved by repeated application of the ->=> rule.",
  },
  "sc-18": {
    title: "LJ: Negation Consequence from Contradiction",
    description:
      "Prove (phi -> bottom) -> (phi -> psi) in LJ system. Derive any consequence from ~phi (= phi -> bottom). A property of negation in intuitionistic logic.",
    hints: [
      "Apply =>-> twice to reduce to phi -> bottom, phi => psi.",
      "Apply ->=> to decompose phi -> bottom: branches into phi => phi and bottom, ... => psi.",
      "The bottom=> rule derives any conclusion from bottom.",
    ],
    learningPoint:
      "phi -> bottom is the sequent calculus representation of negation ~phi. Combining bottom=> and ->=> derives the explosion principle from negation.",
  },
  "sc-19": {
    title: "LJ: Disjunction Introduction",
    description:
      "Prove phi -> (phi \\/ psi) in LJ system. Basic operation of introducing disjunction with the =>\\/ (disjunction right) rule.",
    hints: [
      "Apply =>-> to reduce to phi => phi \\/ psi.",
      "Apply =>\\/ to introduce phi \\/ psi on the right: reduces to phi => phi.",
      "phi => phi is closed with Identity.",
    ],
    learningPoint:
      "The =>\\/ (disjunction right) rule introduces a disjunction in the conclusion. You specify which disjunct to use (left or right).",
  },
  "sc-20": {
    title: "LJ: Currying",
    description:
      "Prove ((phi /\\ psi) -> chi) -> (phi -> (psi -> chi)) in LJ system. The currying theorem that converts a conjunction premise to a chain of implications.",
    hints: [
      "Apply =>-> three times to reduce to (phi /\\ psi) -> chi, phi, psi => chi.",
      "Apply ->=> to decompose (phi /\\ psi) -> chi: branches into => phi /\\ psi and chi => chi.",
      "Apply =>/\\ to construct phi /\\ psi: phi => phi and psi => psi (remove unnecessary antecedents with weakening).",
    ],
    learningPoint:
      "Currying is a fundamental concept in functional programming, corresponding in logic to the equivalence between conjunction premises and implication chains. Provable in LJ.",
  },
  "sc-21": {
    title: "LJ: Uncurrying",
    description:
      "Prove (phi -> (psi -> chi)) -> ((phi /\\ psi) -> chi) in LJ system. The uncurrying theorem that converts an implication chain to a conjunction premise.",
    hints: [
      "Apply =>-> twice to reduce to phi -> (psi -> chi), phi /\\ psi => chi.",
      "Apply /\\=> to decompose phi /\\ psi: phi, psi, phi -> (psi -> chi) => chi.",
      "Apply ->=> twice to decompose phi -> (psi -> chi), closing with Identity.",
    ],
    learningPoint:
      "Uncurrying is the reverse of currying. Decompose conjunction with /\\=> and expand implication with ->=> to combine them.",
  },
  "sc-22": {
    title: "LJ: Implication-Conjunction Distribution",
    description:
      "Prove (phi -> (psi /\\ chi)) -> ((phi -> psi) /\\ (phi -> chi)) in LJ system. The distributive property of implication over conjunction.",
    hints: [
      "Apply =>-> to reduce to phi -> (psi /\\ chi) => (phi -> psi) /\\ (phi -> chi).",
      "Apply =>/\\ to decompose the right side: two premises phi -> (psi /\\ chi) => phi -> psi and phi -> (psi /\\ chi) => phi -> chi.",
      "In each premise, combine =>-> + ->=> + /\\=> to extract conjunction components.",
    ],
    learningPoint:
      "The distributive law of implication over conjunction. Decompose with =>/\\, then combine ->=> and /\\=> in each branch. Requires integrated use of multiple rules.",
  },
  "sc-23": {
    title: "LK: Peirce's Law",
    description:
      "Prove ((phi -> psi) -> phi) -> phi in sequent calculus (LK system). Peirce's law is a characteristic theorem of classical logic, not provable in intuitionistic logic (LJ). LK's multiple-succedent capability is essential.",
    hints: [
      "Apply =>-> to reduce to (phi -> psi) -> phi => phi.",
      "Apply ->=> to decompose (phi -> psi) -> phi: two premises => phi -> psi, phi and phi => phi.",
      "phi => phi is Identity. => phi -> psi, phi reduces via =>-> to phi => psi, phi.",
      "phi => psi, phi has two formulas on the right (LK-specific). Close with WR (Weakening Right) + Identity.",
    ],
    learningPoint:
      "Peirce's law ((phi->psi)->phi)->phi is equivalent to excluded middle as a classical logic principle. LK proves it by allowing multiple succedent formulas. LJ's single-succedent restriction makes it unprovable.",
  },
  "sc-24": {
    title: "LK: Converse Contraposition",
    description:
      "Prove (~psi -> ~phi) -> (phi -> psi) in sequent calculus (LK system). The converse direction of contraposition is LK-specific. Not provable in LJ.",
    hints: [
      "Apply =>-> twice to reduce to ~psi -> ~phi, phi => psi.",
      "Apply ->=> to decompose ~psi -> ~phi: two premises => ~psi, psi and ~phi, phi => psi.",
      "Apply =>~ to reduce => ~psi, psi to psi => psi (LK: multiple succedent formulas needed).",
      "Apply ~=> to decompose ~phi: close phi => psi with WR + Identity.",
    ],
    learningPoint:
      "Converse contraposition (~psi->~phi)->(phi->psi) is LK-specific. While contraposition (phi->psi)->(~psi->~phi) is provable in LJ, the reverse direction essentially requires LK's multiple-succedent formulas.",
  },
  "sc-25": {
    title: "LK: Implication as Disjunction",
    description:
      "Prove (phi -> psi) -> (~phi \\/ psi) in sequent calculus (LK system). In classical logic, implication can be expressed as negation-plus-disjunction. This equivalence is LK-specific.",
    hints: [
      "Apply =>-> to reduce to phi -> psi => ~phi \\/ psi.",
      "Apply ->=> to decompose phi -> psi: two premises => phi, ~phi \\/ psi and psi => ~phi \\/ psi.",
      "Decompose ~phi \\/ psi on the right with =>\\/. Combine =>~ and Identity.",
      "LK's multiple-succedent capability lets phi and ~phi \\/ psi coexist on the right.",
    ],
    learningPoint:
      "In classical logic, phi->psi and ~phi\\/psi are equivalent. This conversion is LK-specific, requiring multiple-succedent and negation rules. In intuitionistic logic, implication cannot be reduced to disjunction.",
  },
  "sc-26": {
    title: "LK: Weak Excluded Middle",
    description:
      "Prove ~phi \\/ ~~phi in sequent calculus (LK system). The weak excluded middle is a variant of excluded middle, specific to LK.",
    hints: [
      "Apply the excluded middle phi \\/ ~phi proof pattern.",
      "Combine =>\\/ and =>~ rules.",
      "From => ~phi \\/ ~~phi, apply =>\\/2 to reduce to => ~~phi, then =>~ to reduce to ~phi =>.",
      "~phi => ~phi \\/ ~~phi follows from =>\\/1 + Identity. Merge with Contraction Right.",
    ],
    learningPoint:
      "Weak excluded middle ~phi\\/~~phi is LK-specific like excluded middle phi\\/~phi. It applies the excluded middle proof pattern to negation. Not provable in LJ.",
  },
  "sc-27": {
    title: "LJ: Universal Elimination (forall=>)",
    description:
      "Prove forall x.P(x) -> P(a) in LJ system. Use the forall=> (universal left) rule to eliminate the quantifier and substitute a concrete term. Basic universal elimination in sequent calculus.",
    hints: [
      "Apply =>-> to reduce to forall x.P(x) => P(a).",
      "Apply forall=> (universal left) to replace forall x.P(x) with P(a). Substitute term a.",
      "P(a) => P(a) is Identity (axiom).",
    ],
    learningPoint:
      "The forall=> rule replaces a universal quantifier in the antecedent with a concrete term. Corresponds to Hilbert system A4 (universal elimination).",
  },
  "sc-28": {
    title: "LJ: Existential Introduction (=>exists)",
    description:
      "Prove P(a) -> exists x.P(x) in LJ system. Use the =>exists (existential right) rule to introduce an existential quantifier from a concrete term.",
    hints: [
      "Apply =>-> to reduce to P(a) => exists x.P(x).",
      "Apply =>exists (existential right) specifying term a as the witness for exists x.P(x).",
      "P(a) => P(a) is Identity (axiom).",
    ],
    learningPoint:
      "The =>exists rule introduces an existential quantifier in the succedent. You specify a concrete witness term and show it satisfies the condition.",
  },
  "sc-29": {
    title: "LJ: Universal to Existential",
    description:
      "Prove forall x.P(x) -> exists x.P(x) in LJ system. Combine forall=> and =>exists to derive existence from universality.",
    hints: [
      "Apply =>-> to reduce to forall x.P(x) => exists x.P(x).",
      "Apply forall=> to replace left side forall x.P(x) with P(a). Apply =>exists to replace right side exists x.P(x) with P(a).",
      "P(a) => P(a) is Identity (axiom).",
    ],
    learningPoint:
      "Combining forall=> and =>exists derives existence from universality. The intermediate term a is used in both universal elimination and existential introduction.",
  },
  "sc-30": {
    title: "LJ: Universal Quantifier Swap",
    description:
      "Prove forall x.forall y.P(x, y) -> forall y.forall x.P(x, y) in LJ system. Combine =>forall (universal right) and forall=> (universal left) to swap quantifier order.",
    hints: [
      "Apply =>-> to reduce to forall x.forall y.P(x,y) => forall y.forall x.P(x,y).",
      "Apply =>forall twice to strip the right side quantifiers. Pay attention to fresh variable conditions.",
      "Apply forall=> twice to eliminate left side quantifiers, reducing to P(a,b) => P(a,b).",
    ],
    learningPoint:
      "The =>forall rule's fresh variable condition (eigenvariable condition) is key to justifying quantifier order swapping. Eigenvariables must not overlap with other free variables in the sequent.",
  },
  "sc-31": {
    title: "LJ: Existential Elimination (exists=>)",
    description:
      "Prove exists x.(P(x) /\\ Q(x)) -> exists x.P(x) in LJ system. Use the exists=> (existential left) rule to eliminate the existential quantifier while satisfying the eigenvariable condition.",
    hints: [
      "Apply =>-> to reduce to exists x.(P(x) /\\ Q(x)) => exists x.P(x).",
      "Apply exists=> (existential left) to eliminate the left side existential, introducing eigenvariable a.",
      "Apply /\\=> to extract P(a), then =>exists to introduce exists x.P(x).",
    ],
    learningPoint:
      "The exists=> rule replaces an existential quantifier in the antecedent with an eigenvariable. The eigenvariable must not appear in the conclusion sequent (eigenvariable condition).",
  },
  "sc-32": {
    title: "LJ: Existential Quantifier Distribution",
    description:
      "Prove exists x.(P(x) \\/ Q(x)) -> exists x.P(x) \\/ exists x.Q(x) in LJ system. Distribute existential quantifier over disjunction using exists=> and \\/=>.",
    hints: [
      "Apply =>-> to reduce to exists x.(P(x) \\/ Q(x)) => exists x.P(x) \\/ exists x.Q(x).",
      "Apply exists=> to eliminate the existential, then \\/=> to case-split P(a) and Q(a).",
      "In each branch, use =>exists and =>\\/ to derive the conclusion.",
    ],
    learningPoint:
      "Distributing existential quantifier over disjunction: introduce eigenvariable with exists=>, case-split with \\/=>, then combine =>exists and =>\\/ in each branch. A typical pattern.",
  },
  "sc-33": {
    title: "LK: Negated Universal to Existential Negation",
    description:
      "Prove ~(forall x.P(x)) -> exists x.~P(x) in LK system. Classical quantifier equivalence using LK's multiple-succedent capability. Not provable in intuitionistic logic (LJ).",
    hints: [
      "Apply =>-> to reduce to ~(forall x.P(x)) => exists x.~P(x).",
      "Apply ~=> to process the left negation, placing forall x.P(x) and exists x.~P(x) on the right (LK-specific).",
      "Use =>forall and =>exists, then =>~ to reduce to P(a) => P(a) via Identity.",
    ],
    learningPoint:
      "~forall -> exists~ is a classical logic equivalence. LK can place multiple formulas on the right, so after ~=> processes the negation, forall x.P(x) and exists x.~P(x) can be handled simultaneously.",
  },
  "sc-34": {
    title: "LJ: Universal-Implication Distribution",
    description:
      "Prove forall x.(P(x) -> Q(x)) -> (forall x.P(x) -> forall x.Q(x)) in LJ system. Distribute universal quantifier over implication using forall=> and =>forall.",
    hints: [
      "Apply =>-> twice to reduce to forall x.(P(x) -> Q(x)), forall x.P(x) => forall x.Q(x).",
      "Apply =>forall to decompose forall x.Q(x) on the right. Introduce fresh variable a.",
      "Apply forall=> twice to extract P(a) -> Q(a) and P(a), then ->=> to derive Q(a).",
    ],
    learningPoint:
      "Universal-implication distribution: introduce fresh variable with =>forall, instantiate with forall=>, and derive conclusion with ->=>. An important property of predicate logic.",
  },
  "sc-ce-01": {
    title: "Cut Basics: Transitivity",
    description:
      "Prove (phi -> psi) -> ((psi -> chi) -> (phi -> chi)) using the Cut rule. Basic technique of composing two implications via Cut. After completing the proof, observe the elimination process with the cut elimination stepper.",
    hints: [
      "Apply =>-> three times to reduce to phi -> psi, psi -> chi, phi => chi.",
      "Apply ->=> to phi -> psi to branch into phi => phi and psi, ... => chi. Similarly decompose psi -> chi.",
      "Cut approach: first derive phi -> psi, phi => psi (->=> + Identity). Then derive psi -> chi, psi => chi (->=> + Identity). Compose these two via Cut on formula psi to get phi -> psi, psi -> chi, phi => chi.",
      "After completing the proof, press the cut elimination stepper button to observe the elimination process.",
    ],
    learningPoint:
      "The Cut rule corresponds to 'proof by lemma'. An intermediate formula psi mediates the composition of two proofs. The cut elimination theorem guarantees this convenient Cut is in principle unnecessary.",
  },
  "sc-ce-02": {
    title: "Cut and Modus Ponens",
    description:
      "Prove phi -> (phi -> psi) -> psi using the Cut rule. Experience the use of Cut corresponding to Hilbert system Modus Ponens.",
    hints: [
      "Apply =>-> twice to reduce to phi, phi -> psi => psi.",
      "The direct method: decompose phi -> psi with ->=>.",
      "Cut approach: compose phi => phi (Identity) and phi, phi -> psi => psi (->=>)  via Cut on formula phi.",
      "After completing the proof, check how the Cut is eliminated in the stepper.",
    ],
    learningPoint:
      "The Cut rule can be seen as a generalization of Modus Ponens. In sequent calculus, ->=> can directly express this, but Cut modularizes the proof structure.",
  },
  "sc-ce-03": {
    title: "Cut for Conjunction Commutativity",
    description:
      "Prove (phi /\\ psi) -> (psi /\\ phi) using the Cut rule. Extract left and right components of conjunction individually and reconstruct via Cut.",
    hints: [
      "Apply =>-> to reduce to phi /\\ psi => psi /\\ phi.",
      "Lemma 1: phi /\\ psi => psi (/\\=> to get left component). Lemma 2: phi /\\ psi => phi (/\\=> to get right component).",
      "Cut approach: compose Lemma 1 and Lemma 2 with =>/\\ to construct psi /\\ phi. Or connect intermediate results via Cut.",
      "In the cut elimination stepper, observe how Cut transforms into a direct combination of /\\=> and =>/\\.",
    ],
    learningPoint:
      "Conjunction commutativity is provable without Cut, but Cut expresses modular thinking: 'extract one side, then the other, then assemble.' Cut elimination expands this modular structure.",
  },
  "sc-ce-04": {
    title: "Cut Chain",
    description:
      "Prove (phi -> psi) -> ((psi -> chi) -> ((chi -> theta) -> (phi -> theta))) by chaining multiple Cuts. Express 3-step transitivity with Cut.",
    hints: [
      "Apply =>-> four times to reduce to phi -> psi, psi -> chi, chi -> theta, phi => theta.",
      "Cut 1: use phi -> psi and phi => phi with Cut on phi to get phi -> psi, phi => psi.",
      "Cut 2: compose psi -> chi with the above via Cut on psi to get ..., phi => chi.",
      "Cut 3: compose chi -> theta with the above via Cut on chi to get ..., phi => theta.",
      "After proof, observe each Cut being eliminated one by one in the stepper. Watch how depth and rank change.",
    ],
    learningPoint:
      "Chaining multiple Cuts builds long reasoning step by step. Cut elimination removes them one at a time, converting to a direct proof. Observe the growth in elimination steps to appreciate the computational cost of cut elimination.",
  },
  "sc-ce-05": {
    title: "Negation and Cut",
    description:
      "Prove ~~phi -> phi using the Cut rule. Experience how Cut operates in the process of decomposing negation.",
    hints: [
      "Apply =>-> to reduce to ~~phi => phi.",
      "Lemma: prove => ~phi, phi (apply =>~ to reduce to phi => phi, close with Identity).",
      "Main proof: decompose ~~phi with ~=> to get => ~phi, phi.",
      "Cut approach: compose the lemma result and ~=> via Cut.",
      "In the cut elimination stepper, observe negation cut elimination. Watch the depth decrease.",
    ],
    learningPoint:
      "In negation cut elimination, ~=> and =>~ 'cancel out'. This is a typical depth-reduction case of cut elimination, showing the induction mechanism.",
  },
  "sc-ce-06": {
    title: "Don't Eliminate Cut: Proof Explosion",
    description:
      "Prove ((phi /\\ psi) -> chi) -> (phi -> (psi -> chi)) using the Cut rule, then observe proof size explosion during cut elimination. Boolos (1984) showed examples (H_n family) where cut-free proofs grow super-exponentially compared to proofs with Cut. Experience this 'explosion' at small scale.",
    hints: [
      "Apply =>-> three times to reduce to (phi /\\ psi) -> chi, phi, psi => chi.",
      "Cut-free direct method: decompose (phi /\\ psi) -> chi with ->=> and reconstruct phi /\\ psi with =>/\\.",
      "Cut approach: first derive phi, psi => phi /\\ psi as a lemma (=>/\\ + Identity). Then compose this with ->=> of (phi /\\ psi) -> chi via Cut on phi /\\ psi.",
      "After completing the proof with Cut, run the stepper to the end. Note the step count.",
      "Boolos (1984) 'Don't Eliminate Cut': Cut is 'lemma reuse'. Eliminating it expands lemmas, causing proof explosion. See also 'Speed-Up Theorem'.",
    ],
    learningPoint:
      "Boolos (1984) 'Don't Eliminate Cut' showed that while the cut elimination theorem is theoretically correct, removing Cut (= lemma reuse) causes explosive proof size growth. For the H_n family, proofs with Cut are O(2^n) while cut-free proofs exceed 2^^n (super-exponential). Experience the 'cost' of cut elimination and understand why Cut (lemmas) are essential in natural reasoning.",
  },
  "sc-ce-07": {
    title: "Cut for Disjunction Commutativity",
    description:
      "Prove (phi \\/ psi) -> (psi \\/ phi) using the Cut rule. Observe how Cut participates in decomposition and reconstruction of disjunction. After proof, check the depth reduction for disjunction in the cut elimination stepper.",
    hints: [
      "Apply =>-> to reduce to phi \\/ psi => psi \\/ phi.",
      "Apply \\/=> to decompose phi \\/ psi, and in each branch use =>\\/ to construct psi \\/ phi.",
      "Cut approach: derive phi => psi \\/ phi and psi => psi \\/ phi as separate lemmas, then connect each \\/=> branch via Cut.",
      "After proof, observe disjunction cut elimination in the stepper.",
    ],
    learningPoint:
      "Disjunction commutativity can be proved directly with \\/=> + =>\\/without Cut, but Cut lets you 'separate each component's handling into independent lemmas.' Cut elimination expands these lemmas into direct branching proofs.",
  },
  "sc-ce-08": {
    title: "Cut for Contraposition",
    description:
      "Prove (phi -> psi) -> (~psi -> ~phi) using the Cut rule. Negation ~alpha is treated as alpha -> bottom. Observe implication and negation cut elimination in the stepper.",
    hints: [
      "Apply =>-> three times to reduce to phi, ~psi, phi -> psi => bottom.",
      "~psi is psi -> bottom, so decompose with ->=>. Similarly decompose phi -> psi with ->=>.",
      "Cut approach: compose phi -> psi and phi => phi (Identity) via Cut on phi to get psi. Then Cut psi with ~psi (= psi -> bottom) to get bottom.",
      "In the cut elimination stepper, observe the interaction of implication and negation cut elimination.",
    ],
    learningPoint:
      "Contraposition derives ~psi -> ~phi from phi -> psi. Treating negation as implication (alpha -> bottom), Cut mediates between 'the conclusion psi of phi -> psi' and the antecedent of ~psi. After cut elimination, it becomes direct decomposition with ->=>.",
  },
  "sc-ce-09": {
    title: "Cut for Disjunction Elimination",
    description:
      "Prove (phi -> chi) -> ((psi -> chi) -> ((phi \\/ psi) -> chi)) using the Cut rule. Compose two implications and a disjunction via Cut to build a case analysis structure.",
    hints: [
      "Apply =>-> three times to reduce to phi \\/ psi, psi -> chi, phi -> chi => chi.",
      "Apply \\/=> to decompose phi \\/ psi, processing the left branch (phi) and right branch (psi) individually.",
      "Left branch: phi, phi -> chi => chi via ->=> + Identity. Right branch: psi, psi -> chi => chi likewise.",
      "Cut approach: compose phi -> chi (or psi -> chi) and Identity via Cut in each branch.",
      "In the cut elimination stepper, observe the interaction of disjunction case analysis and Cut.",
    ],
    learningPoint:
      "Disjunction elimination corresponds to 'case analysis'. Having phi -> chi and psi -> chi lets you derive chi from phi \\/ psi. Cut modularizes each case's processing, but after elimination, ->=> is directly applied within \\/=> branches.",
  },
  "sc-ce-10": {
    title: "Cut for Distribution",
    description:
      "Prove (phi /\\ (psi \\/ chi)) -> ((phi /\\ psi) \\/ (phi /\\ chi)) using the Cut rule. The distributive law where Cut bridges conjunction decomposition and disjunction construction. Observe proof size growth during cut elimination.",
    hints: [
      "Apply =>-> to reduce to phi /\\ (psi \\/ chi) => (phi /\\ psi) \\/ (phi /\\ chi).",
      "Apply /\\=> to extract phi and psi \\/ chi, then \\/=> to decompose psi \\/ chi.",
      "In each branch, combine =>/\\ and =>\\/ to construct (phi /\\ psi) \\/ (phi /\\ chi).",
      "Cut approach: derive a lemma extracting phi from phi /\\ (psi \\/ chi) and a lemma extracting psi \\/ chi, composing them via Cut.",
      "In the cut elimination stepper, observe how distributive law cut elimination expands conjunction and disjunction rules.",
    ],
    learningPoint:
      "The distributive law shows conjunction-disjunction interaction. Cut lets you reuse the 'extract phi' lemma, but after cut elimination, phi extraction is performed independently in each branch, causing proof explosion. A typical example of cut elimination's computational cost.",
  },
  "sc-ce-11": {
    title: "Cut for forall Implication Distribution",
    description:
      "Prove (forall x.(P(x) -> Q(x))) -> ((forall x.P(x)) -> (forall x.Q(x))) using the Cut rule. Extract individual instances with forall-E and bridge implication and quantifiers via Cut. Observe how quantifier rules expand during cut elimination.",
    hints: [
      "Apply =>-> twice to reduce to forall x.(P(x) -> Q(x)), forall x.P(x) => forall x.Q(x).",
      "Apply =>forall to decompose forall x.Q(x) on the right, introducing fresh variable zeta for forall x.(P(x) -> Q(x)), forall x.P(x) => Q(zeta).",
      "Apply forall=> to instantiate forall x.P(x) to P(zeta) and forall x.(P(x) -> Q(x)) to P(zeta) -> Q(zeta).",
      "Cut approach: use P(zeta) as intermediate formula, composing forall x.P(x) => P(zeta) and P(zeta), P(zeta)->Q(zeta) => Q(zeta) via Cut.",
      "In the cut elimination stepper, observe how quantifier instance Cuts are eliminated.",
    ],
    learningPoint:
      "Universal implication distribution is a quantified version of Modus Ponens chain. Cut lets you reuse the lemma 'extract P(zeta) from forall x.P(x)'. After cut elimination, forall=> is applied directly, revealing quantifier transparency.",
  },
  "sc-ce-12": {
    title: "Cut for Existential Transitivity",
    description:
      "Prove (forall x.(P(x) -> Q(x))) -> ((exists x.P(x)) -> (exists x.Q(x))) using the Cut rule. Apply universal implication to existentials, bridging quantifier transitivity via Cut.",
    hints: [
      "Apply =>-> twice to reduce to forall x.(P(x) -> Q(x)), exists x.P(x) => exists x.Q(x).",
      "Apply exists=> to decompose left side exists x.P(x) with eigenvariable zeta: P(zeta), forall x.(P(x)->Q(x)) => exists x.Q(x).",
      "Apply forall=> to instantiate forall x.(P(x) -> Q(x)) to P(zeta) -> Q(zeta), then decompose with ->=>.",
      "Apply =>exists to construct exists x.Q(x) from Q(zeta).",
      "Cut approach: compose P(zeta)->Q(zeta) and P(zeta) via Cut to get Q(zeta).",
    ],
    learningPoint:
      "Existential transitivity is the natural reasoning: 'if P(x)->Q(x) for all x, and some x satisfies P, then some x satisfies Q.' Cut bridges the implication from forall=> with the instance from exists=>. Observe how quantifier and implication instances expand during cut elimination.",
  },
  "sc-ce-13": {
    title: "Cut for Quantifier De Morgan",
    description:
      "Prove (forall x.~P(x)) -> ~(exists x.P(x)) using the Cut rule. Experience how Cut interacts with negation and quantifier conversion.",
    hints: [
      "Apply =>-> to reduce to forall x.~P(x) => ~(exists x.P(x)).",
      "Since ~ is -> bottom, apply =>-> again: exists x.P(x), forall x.~P(x) => bottom.",
      "Apply exists=> to decompose exists x.P(x) with eigenvariable zeta: P(zeta), forall x.~P(x) => bottom.",
      "Apply forall=> to instantiate forall x.~P(x) to ~P(zeta), then decompose with ~=>.",
      "Cut approach: compose P(zeta) and ~P(zeta) via Cut to derive bottom.",
    ],
    learningPoint:
      "Quantifier De Morgan (forall~ -> ~exists) is a basic relationship between negation and quantifiers. Cut mediates between ~P(zeta) from forall=> and P(zeta) from exists=> to derive contradiction. After cut elimination, this becomes direct decomposition of negation and quantifiers.",
  },
  "sc-ce-14": {
    title: "Cut for Quantifier Shift",
    description:
      "Prove (forall x.(P(x) -> Q)) -> ((exists x.P(x)) -> Q) (x is not free in Q). Use the Cut rule to experience the interaction between forall and exists.",
    hints: [
      "Apply =>-> twice to reduce to forall x.(P(x)->Q), exists x.P(x) => Q.",
      "Apply exists=> to decompose exists x.P(x) with eigenvariable zeta: P(zeta), forall x.(P(x)->Q) => Q.",
      "Apply forall=> to instantiate forall x.(P(x)->Q) to P(zeta)->Q, then decompose with ->=>.",
      "Cut approach: use P(zeta) as intermediate formula, composing P(zeta) => P(zeta) (Identity) and ->=> of P(zeta)->Q via Cut.",
      "In the cut elimination stepper, observe how quantifier shift Cuts are eliminated.",
    ],
    learningPoint:
      "Quantifier shift is the reasoning: 'if P(x)->Q for all x, and some x satisfies P, then Q holds.' The key requirement is that x is not free in Q. Cut bridges forall and exists. This is a typical pattern of cut elimination in first-order predicate logic, where the quantifier shifts across implication.",
  },
  "sc-cer-01": {
    title: "Cut Elimination Practice: Transitivity",
    description:
      "A proof of (phi -> psi) -> ((psi -> chi) -> (phi -> chi)) using the Cut rule is pre-placed in the workspace. Study this proof and re-prove the same theorem without using the Cut rule.",
    hints: [
      "Observe the pre-placed proof tree and identify where Cut is used.",
      "Apply =>-> three times to reduce to phi -> psi, psi -> chi, phi => chi.",
      "Apply ->=> to decompose phi -> psi: branches into phi => phi (Identity) and psi, psi -> chi, ... => chi.",
      "On the psi branch, apply ->=> again to decompose psi -> chi: psi => psi (Identity) and chi => chi (Identity).",
      "The cut-free proof uses nested ->=> instead of Cut to compose the two implications directly.",
    ],
    learningPoint:
      "Cut elimination in practice: rewrite a proof that used Cut for 'lemma composition' into a direct decomposition using ->=>. Cut-free proofs tend to be larger but are always possible — this is the content of the cut elimination theorem.",
  },
  "sc-ap-01": {
    title: "Auto Proof: Identity",
    description:
      "Use a script to automatically prove phi -> phi. Generate a proof tree for the sequent => phi -> phi with proveSequentLK, and display it in the workspace with displayScProof.",
    hints: [
      "Open the script editor and parse the goal formula with parseFormula.",
      "Create a sequent object { antecedents: [], succedents: [formula] }.",
      "Call proveSequentLK(sequent) to get the proof tree.",
      "Use displayScProof(proof) to display the proof tree in the workspace.",
    ],
    learningPoint:
      "proveSequentLK is a decision procedure for propositional LK. It always finds a proof for valid formulas. This is a practical experience of propositional logic completeness.",
  },
  "sc-ap-02": {
    title: "Auto Proof: Contraposition",
    description:
      "Use a script to automatically prove (phi -> psi) -> (~psi -> ~phi). Generate a proof tree with proveSequentLK and observe what rule applications are made.",
    hints: [
      "Parse the goal formula with parseFormula('(phi -> psi) -> (~psi -> ~phi)').",
      "Create a sequent with empty antecedents and the goal formula in succedents.",
      "Generate the proof tree with proveSequentLK and display it with displayScProof.",
      "Examine the generated proof tree nodes and observe how =>=>, ~=>, =>~ and other rules are used.",
    ],
    learningPoint:
      "Automatic proof search correctly handles combinations of implication and negation. Reading the generated proof tree structure helps understand rule application patterns in sequent calculus.",
  },
  "sc-ap-03": {
    title: "Auto Proof: De Morgan's Law",
    description:
      "Use a script to automatically prove ~(phi /\\ psi) -> (~phi \\/ ~psi). Auto-prove a theorem that only holds in classical logic (LK) and examine the proof structure.",
    hints: [
      "Parse ~(phi /\\ psi) -> (~phi \\/ ~psi) with parseFormula.",
      "Generate the proof tree with proveSequentLK. This theorem only holds in classical logic (LK).",
      "Display with displayScProof and observe how /\\=> and =>\\/ rules are used.",
    ],
    learningPoint:
      "De Morgan's law ~(phi/\\psi) -> (~phi\\/~psi) is a classical logic theorem (not provable in intuitionistic logic). Observing auto-generated proofs helps understand reasoning patterns specific to classical logic.",
  },
};

export const categoryTranslationsEn: Readonly<
  Record<string, CategoryTranslation | undefined>
> = {
  "propositional-basics": {
    label: "Propositional Logic Basics",
    description: "Basic proofs using A1, A2, A3 + MP.",
  },
  "propositional-intermediate": {
    label: "Propositional Logic Intermediate",
    description: "Transitivity usage and composite proof techniques.",
  },
  "propositional-negation": {
    label: "Propositional Logic with Negation",
    description: "Proofs utilizing the negation axiom A3.",
  },
  "propositional-advanced": {
    label: "Propositional Logic Challenge",
    description:
      "High-difficulty proofs involving conjunction/disjunction definition expansion.",
  },
  "predicate-basics": {
    label: "Predicate Logic Basics",
    description: "Proofs involving quantifiers (∀, ∃) and the Gen rule.",
  },
  "predicate-advanced": {
    label: "Predicate Logic Advanced",
    description:
      "High-difficulty proofs involving quantifier interactions and negation manipulation.",
  },
  "equality-basics": {
    label: "Equality Logic",
    description: "Proofs involving equality axioms.",
  },
  "peano-basics": {
    label: "Peano Arithmetic Basics",
    description: "Basic proofs directly using PA axioms (PA1-PA6).",
  },
  "peano-arithmetic": {
    label: "Peano Arithmetic Reasoning",
    description: "Proofs of arithmetic properties combining PA axioms.",
  },
  "group-basics": {
    label: "Group Theory Basics",
    description: "Basic proofs directly using group axioms (G1-G3).",
  },
  "group-proofs": {
    label: "Group Theory Reasoning",
    description: "Proofs of group properties combining group axioms.",
  },
  "nd-basics": {
    label: "Natural Deduction Basics",
    description:
      "Proofs by introducing and discharging assumptions in natural deduction systems (NM/NJ/NK).",
  },
  "tab-basics": {
    label: "Tableau Method Basics",
    description:
      "Refutation proofs in tableau-style sequent calculus (TAB). Negate and construct closed tableaux.",
  },
  "at-basics": {
    label: "Analytic Tableau Basics",
    description:
      "Refutation proofs in Analytic Tableau. Apply α/β rules to signed formulas and close all branches.",
  },
  "sc-basics": {
    label: "Sequent Calculus Basics",
    description:
      "Proofs in Gentzen-style sequent calculus (LK/LJ). Combine structural and logical rules to derive sequents.",
  },
  "sc-cut-elimination": {
    label: "Cut Elimination Experience",
    description:
      "Construct proofs using the cut rule and experience the elimination process with the cut-elimination stepper. Deepen understanding of the cut-elimination theorem (Gentzen's Hauptsatz).",
  },
  "sc-auto-proof": {
    label: "Automated Proof Search",
    description:
      "Call proveSequentLK from scripts to automatically prove propositional logic theorems. Aim for practical understanding of the completeness theorem.",
  },
};
