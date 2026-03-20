import { describe, it, expect } from "vitest";
import {
  TermVariable,
  Constant,
  FunctionApplication,
  BinaryOperation,
  termVariable,
  termMetaVariable,
  constant,
  functionApplication,
  binaryOperation,
  binaryOperators,
  termSubstitution,
} from "./term";
import type { Term } from "./term";

describe("TermVariable", () => {
  it("creates a term variable with _tag", () => {
    const x = termVariable("x");
    expect(x._tag).toBe("TermVariable");
    expect(x.name).toBe("x");
  });

  it("creates with new keyword", () => {
    const y = new TermVariable({ name: "y" });
    expect(y._tag).toBe("TermVariable");
    expect(y.name).toBe("y");
  });
});

describe("TermMetaVariable", () => {
  it("creates without subscript", () => {
    const tau = termMetaVariable("τ");
    expect(tau._tag).toBe("TermMetaVariable");
    expect(tau.name).toBe("τ");
    expect(tau.subscript).toBeUndefined();
  });

  it("creates with subscript", () => {
    const tau1 = termMetaVariable("τ", "1");
    expect(tau1._tag).toBe("TermMetaVariable");
    expect(tau1.name).toBe("τ");
    expect(tau1.subscript).toBe("1");
  });

  it("distinguishes different subscripts (1 vs 01 vs 001)", () => {
    const a = termMetaVariable("σ", "1");
    const b = termMetaVariable("σ", "01");
    const c = termMetaVariable("σ", "001");
    expect(a.subscript).toBe("1");
    expect(b.subscript).toBe("01");
    expect(c.subscript).toBe("001");
    expect(a.subscript).not.toBe(b.subscript);
    expect(b.subscript).not.toBe(c.subscript);
  });

  it("accepts all valid Greek letters", () => {
    const letters = [
      "α",
      "β",
      "γ",
      "δ",
      "ε",
      "ζ",
      "η",
      "θ",
      "ι",
      "κ",
      "λ",
      "μ",
      "ν",
      "ξ",
      "π",
      "ρ",
      "σ",
      "τ",
      "υ",
      "φ",
      "χ",
      "ψ",
      "ω",
    ] as const;
    for (const letter of letters) {
      const mv = termMetaVariable(letter);
      expect(mv.name).toBe(letter);
    }
  });
});

describe("Constant", () => {
  it("creates a constant", () => {
    const zero = constant("0");
    expect(zero._tag).toBe("Constant");
    expect(zero.name).toBe("0");
  });

  it("creates named constants", () => {
    const a = constant("a");
    expect(a._tag).toBe("Constant");
    expect(a.name).toBe("a");
  });
});

describe("FunctionApplication", () => {
  it("creates a nullary function", () => {
    const f = functionApplication("f", []);
    expect(f._tag).toBe("FunctionApplication");
    expect(f.name).toBe("f");
    expect(f.args).toEqual([]);
  });

  it("creates a unary function", () => {
    const x = termVariable("x");
    const fx = functionApplication("f", [x]);
    expect(fx._tag).toBe("FunctionApplication");
    expect(fx.name).toBe("f");
    expect(fx.args).toHaveLength(1);
    expect(fx.args[0]._tag).toBe("TermVariable");
  });

  it("creates a binary function", () => {
    const x = termVariable("x");
    const y = termVariable("y");
    const gxy = functionApplication("g", [x, y]);
    expect(gxy._tag).toBe("FunctionApplication");
    expect(gxy.name).toBe("g");
    expect(gxy.args).toHaveLength(2);
  });

  it("supports nested function applications", () => {
    const x = termVariable("x");
    const fx = functionApplication("f", [x]);
    const gfx = functionApplication("g", [fx]);
    expect(gfx._tag).toBe("FunctionApplication");
    expect(gfx.args[0]._tag).toBe("FunctionApplication");
    expect((gfx.args[0] as FunctionApplication).name).toBe("f");
  });
});

describe("BinaryOperation", () => {
  it("creates addition", () => {
    const x = termVariable("x");
    const y = termVariable("y");
    const sum = binaryOperation("+", x, y);
    expect(sum._tag).toBe("BinaryOperation");
    expect(sum.operator).toBe("+");
    expect(sum.left._tag).toBe("TermVariable");
    expect(sum.right._tag).toBe("TermVariable");
  });

  it("supports all binary operators", () => {
    const x = termVariable("x");
    const y = termVariable("y");
    for (const op of binaryOperators) {
      const result = binaryOperation(op, x, y);
      expect(result.operator).toBe(op);
    }
  });

  it("creates nested binary operations: x + y * z", () => {
    const x = termVariable("x");
    const y = termVariable("y");
    const z = termVariable("z");
    // x + (y * z)
    const yz = binaryOperation("*", y, z);
    const expr = binaryOperation("+", x, yz);
    expect(expr._tag).toBe("BinaryOperation");
    expect(expr.operator).toBe("+");
    expect(expr.left._tag).toBe("TermVariable");
    expect(expr.right._tag).toBe("BinaryOperation");
    expect((expr.right as BinaryOperation).operator).toBe("*");
  });

  it("creates right-associative power: x ^ y ^ z = x ^ (y ^ z)", () => {
    const x = termVariable("x");
    const y = termVariable("y");
    const z = termVariable("z");
    const yz = binaryOperation("^", y, z);
    const expr = binaryOperation("^", x, yz);
    expect(expr.operator).toBe("^");
    expect((expr.right as BinaryOperation).operator).toBe("^");
  });
});

describe("Term union type", () => {
  it("discriminates by _tag", () => {
    const terms: readonly Term[] = [
      termVariable("x"),
      termMetaVariable("τ"),
      constant("0"),
      functionApplication("f", [termVariable("x")]),
      binaryOperation("+", termVariable("x"), termVariable("y")),
    ];

    const tags = terms.map((t) => t._tag);
    expect(tags).toEqual([
      "TermVariable",
      "TermMetaVariable",
      "Constant",
      "FunctionApplication",
      "BinaryOperation",
    ]);
  });

  it("supports exhaustive switch on _tag", () => {
    const classify = (t: Term): string => {
      switch (t._tag) {
        case "TermVariable":
          return "var";
        case "TermMetaVariable":
          return "meta";
        case "Constant":
          return "const";
        case "FunctionApplication":
          return "func";
        case "BinaryOperation":
          return "binop";
        case "TermSubstitution":
          return "subst";
      }
      t satisfies never;
    };
    expect(classify(termVariable("x"))).toBe("var");
    expect(classify(termMetaVariable("τ"))).toBe("meta");
    expect(classify(constant("0"))).toBe("const");
    expect(classify(functionApplication("f", []))).toBe("func");
    expect(
      classify(binaryOperation("+", termVariable("x"), termVariable("y"))),
    ).toBe("binop");
    expect(
      classify(
        termSubstitution(
          termVariable("x"),
          termVariable("y"),
          termVariable("z"),
        ),
      ),
    ).toBe("subst");
  });
});

describe("TermSubstitution", () => {
  it("creates a term substitution with correct fields", () => {
    const x = termVariable("x");
    const y = termVariable("y");
    const z = termVariable("z");
    const subst = termSubstitution(x, y, z);
    expect(subst._tag).toBe("TermSubstitution");
    expect(subst.term._tag).toBe("TermVariable");
    expect(subst.replacement._tag).toBe("TermVariable");
    expect(subst.variable._tag).toBe("TermVariable");
    expect(subst.variable.name).toBe("z");
  });

  it("creates f(x)[g(y)/x] substitution", () => {
    const x = termVariable("x");
    const y = termVariable("y");
    const fx = functionApplication("f", [x]);
    const gy = functionApplication("g", [y]);
    const subst = termSubstitution(fx, gy, x);
    expect(subst._tag).toBe("TermSubstitution");
    expect(subst.term._tag).toBe("FunctionApplication");
    expect(subst.replacement._tag).toBe("FunctionApplication");
    expect(subst.variable.name).toBe("x");
  });

  it("supports chained substitution x[y/x][z/y]", () => {
    const x = termVariable("x");
    const y = termVariable("y");
    const z = termVariable("z");
    const inner = termSubstitution(x, y, x);
    const outer = termSubstitution(inner, z, y);
    expect(outer._tag).toBe("TermSubstitution");
    expect(outer.term._tag).toBe("TermSubstitution");
    expect(outer.variable.name).toBe("y");
  });
});

describe("complex term construction", () => {
  it("builds f(x) + g(y) = h(z) structure (term part)", () => {
    const x = termVariable("x");
    const y = termVariable("y");
    const z = termVariable("z");
    const fx = functionApplication("f", [x]);
    const gy = functionApplication("g", [y]);
    const hz = functionApplication("h", [z]);
    const sum = binaryOperation("+", fx, gy);

    // sum = f(x) + g(y)
    expect(sum._tag).toBe("BinaryOperation");
    expect(sum.operator).toBe("+");
    expect((sum.left as FunctionApplication).name).toBe("f");
    expect((sum.right as FunctionApplication).name).toBe("g");

    // hz = h(z)
    expect(hz._tag).toBe("FunctionApplication");
    expect(hz.name).toBe("h");
  });

  it("builds x + 0 = x structure (term part)", () => {
    const x = termVariable("x");
    const zero = constant("0");
    const sum = binaryOperation("+", x, zero);

    expect(sum._tag).toBe("BinaryOperation");
    expect(sum.operator).toBe("+");
    expect((sum.left as TermVariable).name).toBe("x");
    expect((sum.right as Constant).name).toBe("0");
  });
});
