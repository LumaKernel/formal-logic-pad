import { describe, it, expect } from "vitest";
import {
  systemPresets,
  defaultPresetId,
  findPresetById,
  defaultCreateFormValues,
  validateCreateForm,
  getFieldError,
  shouldShowFieldError,
  getFirstErrorField,
  getPresetReferenceEntryId,
  classifyPresetCategory,
  groupPresetsByCategory,
  presetCategoryDefinitions,
  type CreateFormValues,
} from "./notebookCreateLogic";

describe("systemPresets", () => {
  it("contains at least one preset", () => {
    expect(systemPresets.length).toBeGreaterThanOrEqual(1);
  });

  it("each preset has unique id", () => {
    const ids = systemPresets.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each preset has non-empty label and description", () => {
    for (const preset of systemPresets) {
      expect(preset.label.length).toBeGreaterThan(0);
      expect(preset.description.length).toBeGreaterThan(0);
    }
  });

  it("each preset has a valid DeductionSystem", () => {
    for (const preset of systemPresets) {
      const ds = preset.deductionSystem;
      expect(
        ds.style === "hilbert" ||
          ds.style === "natural-deduction" ||
          ds.style === "sequent-calculus",
      ).toBe(true);
      expect(ds.system.name).toBeTruthy();
      if (ds.style === "hilbert") {
        expect(ds.system.propositionalAxioms).toBeInstanceOf(Set);
      }
      if (ds.style === "natural-deduction") {
        expect(ds.system.rules).toBeInstanceOf(Set);
      }
      if (ds.style === "sequent-calculus") {
        expect(ds.system.rules).toBeInstanceOf(Set);
      }
    }
  });

  it("includes all Hilbert presets", () => {
    const ids = systemPresets.map((p) => p.id);
    expect(ids).toContain("sk");
    expect(ids).toContain("minimal");
    expect(ids).toContain("intuitionistic");
    expect(ids).toContain("classical");
    expect(ids).toContain("lukasiewicz");
    expect(ids).toContain("mendelson");
    expect(ids).toContain("predicate");
    expect(ids).toContain("equality");
    expect(ids).toContain("peano");
    expect(ids).toContain("robinson");
    expect(ids).toContain("peano-hk");
    expect(ids).toContain("peano-mendelson");
    expect(ids).toContain("heyting");
    expect(ids).toContain("group-left");
    expect(ids).toContain("group-full");
    expect(ids).toContain("abelian-group");
  });

  it("includes all natural deduction presets", () => {
    const ids = systemPresets.map((p) => p.id);
    expect(ids).toContain("nd-nm");
    expect(ids).toContain("nd-nj");
    expect(ids).toContain("nd-nk");
  });

  it("includes all sequent calculus presets", () => {
    const ids = systemPresets.map((p) => p.id);
    expect(ids).toContain("sc-lm");
    expect(ids).toContain("sc-lj");
    expect(ids).toContain("sc-lk");
  });

  it("natural deduction presets have correct style", () => {
    const ndPresets = systemPresets.filter((p) => p.id.startsWith("nd-"));
    expect(ndPresets).toHaveLength(3);
    for (const p of ndPresets) {
      expect(p.deductionSystem.style).toBe("natural-deduction");
    }
  });

  it("sequent calculus presets have correct style", () => {
    const scPresets = systemPresets.filter((p) => p.id.startsWith("sc-"));
    expect(scPresets).toHaveLength(3);
    for (const p of scPresets) {
      expect(p.deductionSystem.style).toBe("sequent-calculus");
    }
  });

  it("peano preset includes theory axioms", () => {
    const peano = systemPresets.find((p) => p.id === "peano");
    expect(peano).toBeDefined();
    expect(peano?.deductionSystem.style).toBe("hilbert");
    if (peano?.deductionSystem.style === "hilbert") {
      expect(peano.deductionSystem.system.theoryAxioms).toBeDefined();
      expect(peano.deductionSystem.system.theoryAxioms?.length).toBe(6);
    }
  });

  it("robinson preset includes PA1-PA6 + Q7", () => {
    const robinson = systemPresets.find((p) => p.id === "robinson");
    expect(robinson).toBeDefined();
    expect(robinson?.deductionSystem.style).toBe("hilbert");
    if (robinson?.deductionSystem.style === "hilbert") {
      expect(robinson.deductionSystem.system.theoryAxioms?.length).toBe(7);
      const ids = robinson.deductionSystem.system.theoryAxioms?.map(
        (a) => a.id,
      );
      expect(ids).toContain("Q7");
    }
  });

  it("peano-hk preset uses DNE propositional axioms", () => {
    const preset = systemPresets.find((p) => p.id === "peano-hk");
    expect(preset).toBeDefined();
    if (preset?.deductionSystem.style === "hilbert") {
      expect(preset.deductionSystem.system.propositionalAxioms).toEqual(
        new Set(["A1", "A2", "DNE"]),
      );
      expect(preset.deductionSystem.system.theoryAxioms?.length).toBe(6);
    }
  });

  it("peano-mendelson preset uses M3 propositional axioms", () => {
    const preset = systemPresets.find((p) => p.id === "peano-mendelson");
    expect(preset).toBeDefined();
    if (preset?.deductionSystem.style === "hilbert") {
      expect(preset.deductionSystem.system.propositionalAxioms).toEqual(
        new Set(["A1", "A2", "M3"]),
      );
      expect(preset.deductionSystem.system.theoryAxioms?.length).toBe(6);
    }
  });

  it("heyting preset uses EFQ propositional axioms", () => {
    const preset = systemPresets.find((p) => p.id === "heyting");
    expect(preset).toBeDefined();
    if (preset?.deductionSystem.style === "hilbert") {
      expect(preset.deductionSystem.system.propositionalAxioms).toEqual(
        new Set(["A1", "A2", "EFQ"]),
      );
      expect(preset.deductionSystem.system.theoryAxioms?.length).toBe(6);
    }
  });

  it("group-left preset includes 3 theory axioms", () => {
    const preset = systemPresets.find((p) => p.id === "group-left");
    expect(preset).toBeDefined();
    if (preset?.deductionSystem.style === "hilbert") {
      expect(preset.deductionSystem.system.theoryAxioms?.length).toBe(3);
      const ids = preset.deductionSystem.system.theoryAxioms?.map((a) => a.id);
      expect(ids).toEqual(["G1", "G2L", "G3L"]);
    }
  });

  it("group-full preset includes 5 theory axioms", () => {
    const preset = systemPresets.find((p) => p.id === "group-full");
    expect(preset).toBeDefined();
    if (preset?.deductionSystem.style === "hilbert") {
      expect(preset.deductionSystem.system.theoryAxioms?.length).toBe(5);
    }
  });

  it("abelian-group preset includes 6 theory axioms", () => {
    const preset = systemPresets.find((p) => p.id === "abelian-group");
    expect(preset).toBeDefined();
    if (preset?.deductionSystem.style === "hilbert") {
      expect(preset.deductionSystem.system.theoryAxioms?.length).toBe(6);
      const ids = preset.deductionSystem.system.theoryAxioms?.map((a) => a.id);
      expect(ids).toContain("G4");
    }
  });

  it("hilbert presets have correct style", () => {
    const hilbertPresets = systemPresets.filter(
      (p) => !p.id.startsWith("nd-") && !p.id.startsWith("sc-"),
    );
    expect(hilbertPresets.length).toBeGreaterThanOrEqual(16);
    for (const p of hilbertPresets) {
      expect(p.deductionSystem.style).toBe("hilbert");
    }
  });
});

describe("defaultPresetId", () => {
  it("refers to an existing preset", () => {
    expect(findPresetById(defaultPresetId)).toBeDefined();
  });

  it("is lukasiewicz", () => {
    expect(defaultPresetId).toBe("lukasiewicz");
  });
});

describe("findPresetById", () => {
  it("returns preset for valid id", () => {
    const preset = findPresetById("lukasiewicz");
    expect(preset).toBeDefined();
    expect(preset?.id).toBe("lukasiewicz");
  });

  it("returns undefined for unknown id", () => {
    expect(findPresetById("nonexistent")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(findPresetById("")).toBeUndefined();
  });
});

describe("defaultCreateFormValues", () => {
  it("returns default values", () => {
    const values = defaultCreateFormValues();
    expect(values.name).toBe("");
    expect(values.systemPresetId).toBe(defaultPresetId);
  });
});

describe("validateCreateForm", () => {
  const validValues: CreateFormValues = {
    name: "テストノート",
    systemPresetId: "lukasiewicz",
  };

  it("valid form returns valid: true", () => {
    expect(validateCreateForm(validValues)).toEqual({ valid: true });
  });

  it("valid form with sk system", () => {
    expect(
      validateCreateForm({ ...validValues, systemPresetId: "sk" }),
    ).toEqual({ valid: true });
  });

  it("valid form with minimal system", () => {
    expect(
      validateCreateForm({ ...validValues, systemPresetId: "minimal" }),
    ).toEqual({ valid: true });
  });

  it("valid form with intuitionistic system", () => {
    expect(
      validateCreateForm({
        ...validValues,
        systemPresetId: "intuitionistic",
      }),
    ).toEqual({ valid: true });
  });

  it("valid form with classical system", () => {
    expect(
      validateCreateForm({ ...validValues, systemPresetId: "classical" }),
    ).toEqual({ valid: true });
  });

  it("valid form with mendelson system", () => {
    expect(
      validateCreateForm({ ...validValues, systemPresetId: "mendelson" }),
    ).toEqual({ valid: true });
  });

  it("valid form with predicate system", () => {
    expect(
      validateCreateForm({ ...validValues, systemPresetId: "predicate" }),
    ).toEqual({ valid: true });
  });

  it("valid form with equality system", () => {
    expect(
      validateCreateForm({ ...validValues, systemPresetId: "equality" }),
    ).toEqual({ valid: true });
  });

  it("valid form with peano system", () => {
    expect(
      validateCreateForm({ ...validValues, systemPresetId: "peano" }),
    ).toEqual({ valid: true });
  });

  it("valid form with nd-nm system", () => {
    expect(
      validateCreateForm({ ...validValues, systemPresetId: "nd-nm" }),
    ).toEqual({ valid: true });
  });

  it("valid form with nd-nj system", () => {
    expect(
      validateCreateForm({ ...validValues, systemPresetId: "nd-nj" }),
    ).toEqual({ valid: true });
  });

  it("valid form with nd-nk system", () => {
    expect(
      validateCreateForm({ ...validValues, systemPresetId: "nd-nk" }),
    ).toEqual({ valid: true });
  });

  it("valid form with sc-lm system", () => {
    expect(
      validateCreateForm({ ...validValues, systemPresetId: "sc-lm" }),
    ).toEqual({ valid: true });
  });

  it("valid form with sc-lj system", () => {
    expect(
      validateCreateForm({ ...validValues, systemPresetId: "sc-lj" }),
    ).toEqual({ valid: true });
  });

  it("valid form with sc-lk system", () => {
    expect(
      validateCreateForm({ ...validValues, systemPresetId: "sc-lk" }),
    ).toEqual({ valid: true });
  });

  it("valid form with robinson system", () => {
    expect(
      validateCreateForm({ ...validValues, systemPresetId: "robinson" }),
    ).toEqual({ valid: true });
  });

  it("valid form with peano-hk system", () => {
    expect(
      validateCreateForm({ ...validValues, systemPresetId: "peano-hk" }),
    ).toEqual({ valid: true });
  });

  it("valid form with peano-mendelson system", () => {
    expect(
      validateCreateForm({
        ...validValues,
        systemPresetId: "peano-mendelson",
      }),
    ).toEqual({ valid: true });
  });

  it("valid form with heyting system", () => {
    expect(
      validateCreateForm({ ...validValues, systemPresetId: "heyting" }),
    ).toEqual({ valid: true });
  });

  describe("name validation", () => {
    it("empty name is invalid", () => {
      const result = validateCreateForm({ ...validValues, name: "" });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          field: "name",
          message: "名前を入力してください",
        });
      }
    });

    it("whitespace-only name is invalid", () => {
      const result = validateCreateForm({ ...validValues, name: "   " });
      expect(result.valid).toBe(false);
    });

    it("name over 100 chars is invalid", () => {
      const result = validateCreateForm({
        ...validValues,
        name: "あ".repeat(101),
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          field: "name",
          message: "名前は100文字以内にしてください",
        });
      }
    });

    it("name with exactly 100 chars is valid", () => {
      expect(
        validateCreateForm({ ...validValues, name: "あ".repeat(100) }),
      ).toEqual({ valid: true });
    });

    it("name with leading/trailing spaces is valid (trimmed)", () => {
      expect(
        validateCreateForm({ ...validValues, name: "  テスト  " }),
      ).toEqual({ valid: true });
    });
  });

  describe("systemPresetId validation", () => {
    it("unknown preset id is invalid", () => {
      const result = validateCreateForm({
        ...validValues,
        systemPresetId: "nonexistent",
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          field: "systemPresetId",
          message: "公理系を選択してください",
        });
      }
    });

    it("empty preset id is invalid", () => {
      const result = validateCreateForm({
        ...validValues,
        systemPresetId: "",
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("multiple errors", () => {
    it("returns both name and system errors", () => {
      const result = validateCreateForm({
        name: "",
        systemPresetId: "nonexistent",
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors.length).toBe(2);
        expect(result.errors.map((e) => e.field)).toContain("name");
        expect(result.errors.map((e) => e.field)).toContain("systemPresetId");
      }
    });
  });
});

describe("getFieldError", () => {
  it("returns undefined for valid form", () => {
    const validation = validateCreateForm({
      name: "テスト",
      systemPresetId: "lukasiewicz",
    });
    expect(getFieldError(validation, "name")).toBeUndefined();
    expect(getFieldError(validation, "systemPresetId")).toBeUndefined();
  });

  it("returns error message for invalid name", () => {
    const validation = validateCreateForm({
      name: "",
      systemPresetId: "lukasiewicz",
    });
    expect(getFieldError(validation, "name")).toBe("名前を入力してください");
    expect(getFieldError(validation, "systemPresetId")).toBeUndefined();
  });

  it("returns error message for invalid systemPresetId", () => {
    const validation = validateCreateForm({
      name: "テスト",
      systemPresetId: "bad",
    });
    expect(getFieldError(validation, "name")).toBeUndefined();
    expect(getFieldError(validation, "systemPresetId")).toBe(
      "公理系を選択してください",
    );
  });
});

describe("getPresetReferenceEntryId", () => {
  it("returns system-lukasiewicz for lukasiewicz preset", () => {
    expect(getPresetReferenceEntryId("lukasiewicz")).toBe("system-lukasiewicz");
  });

  it("returns system-mendelson for mendelson preset", () => {
    expect(getPresetReferenceEntryId("mendelson")).toBe("system-mendelson");
  });

  it("returns system-minimal for sk preset", () => {
    expect(getPresetReferenceEntryId("sk")).toBe("system-minimal");
  });

  it("returns system-minimal for minimal preset", () => {
    expect(getPresetReferenceEntryId("minimal")).toBe("system-minimal");
  });

  it("returns system-intuitionistic for intuitionistic preset", () => {
    expect(getPresetReferenceEntryId("intuitionistic")).toBe(
      "system-intuitionistic",
    );
  });

  it("returns system-classical for classical preset", () => {
    expect(getPresetReferenceEntryId("classical")).toBe("system-classical");
  });

  it("returns theory-peano for peano preset", () => {
    expect(getPresetReferenceEntryId("peano")).toBe("theory-peano");
  });

  it("returns theory-peano for robinson preset", () => {
    expect(getPresetReferenceEntryId("robinson")).toBe("theory-peano");
  });

  it("returns theory-peano for peano-hk preset", () => {
    expect(getPresetReferenceEntryId("peano-hk")).toBe("theory-peano");
  });

  it("returns theory-peano for peano-mendelson preset", () => {
    expect(getPresetReferenceEntryId("peano-mendelson")).toBe("theory-peano");
  });

  it("returns theory-peano for heyting preset", () => {
    expect(getPresetReferenceEntryId("heyting")).toBe("theory-peano");
  });

  it("returns theory-group for group-left preset", () => {
    expect(getPresetReferenceEntryId("group-left")).toBe("theory-group");
  });

  it("returns theory-group for group-full preset", () => {
    expect(getPresetReferenceEntryId("group-full")).toBe("theory-group");
  });

  it("returns theory-group for abelian-group preset", () => {
    expect(getPresetReferenceEntryId("abelian-group")).toBe("theory-group");
  });

  it("returns rule-nd-overview for nd-nm preset", () => {
    expect(getPresetReferenceEntryId("nd-nm")).toBe("rule-nd-overview");
  });

  it("returns rule-nd-overview for nd-nj preset", () => {
    expect(getPresetReferenceEntryId("nd-nj")).toBe("rule-nd-overview");
  });

  it("returns rule-nd-overview for nd-nk preset", () => {
    expect(getPresetReferenceEntryId("nd-nk")).toBe("rule-nd-overview");
  });

  it("returns rule-sc-overview for sc-lm preset", () => {
    expect(getPresetReferenceEntryId("sc-lm")).toBe("rule-sc-overview");
  });

  it("returns rule-sc-overview for sc-lj preset", () => {
    expect(getPresetReferenceEntryId("sc-lj")).toBe("rule-sc-overview");
  });

  it("returns rule-sc-overview for sc-lk preset", () => {
    expect(getPresetReferenceEntryId("sc-lk")).toBe("rule-sc-overview");
  });

  it("returns undefined for predicate preset (no reference)", () => {
    expect(getPresetReferenceEntryId("predicate")).toBeUndefined();
  });

  it("returns undefined for equality preset (no reference)", () => {
    expect(getPresetReferenceEntryId("equality")).toBeUndefined();
  });

  it("returns undefined for unknown preset id", () => {
    expect(getPresetReferenceEntryId("nonexistent")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(getPresetReferenceEntryId("")).toBeUndefined();
  });
});

describe("shouldShowFieldError", () => {
  const invalidValidation = validateCreateForm({
    name: "",
    systemPresetId: "lukasiewicz",
  });
  const validValidation = validateCreateForm({
    name: "テスト",
    systemPresetId: "lukasiewicz",
  });

  it("returns undefined when not touched and not submitted", () => {
    expect(
      shouldShowFieldError({
        touched: false,
        submitted: false,
        validation: invalidValidation,
        field: "name",
      }),
    ).toBeUndefined();
  });

  it("returns error when touched even if not submitted", () => {
    expect(
      shouldShowFieldError({
        touched: true,
        submitted: false,
        validation: invalidValidation,
        field: "name",
      }),
    ).toBe("名前を入力してください");
  });

  it("returns error when submitted even if not touched", () => {
    expect(
      shouldShowFieldError({
        touched: false,
        submitted: true,
        validation: invalidValidation,
        field: "name",
      }),
    ).toBe("名前を入力してください");
  });

  it("returns error when both touched and submitted", () => {
    expect(
      shouldShowFieldError({
        touched: true,
        submitted: true,
        validation: invalidValidation,
        field: "name",
      }),
    ).toBe("名前を入力してください");
  });

  it("returns undefined for valid form even when touched and submitted", () => {
    expect(
      shouldShowFieldError({
        touched: true,
        submitted: true,
        validation: validValidation,
        field: "name",
      }),
    ).toBeUndefined();
  });

  it("returns undefined for non-error field", () => {
    expect(
      shouldShowFieldError({
        touched: true,
        submitted: true,
        validation: invalidValidation,
        field: "systemPresetId",
      }),
    ).toBeUndefined();
  });
});

describe("getFirstErrorField", () => {
  it("returns undefined for valid form", () => {
    const validation = validateCreateForm({
      name: "テスト",
      systemPresetId: "lukasiewicz",
    });
    expect(getFirstErrorField(validation)).toBeUndefined();
  });

  it("returns 'name' when name is the first error", () => {
    const validation = validateCreateForm({
      name: "",
      systemPresetId: "lukasiewicz",
    });
    expect(getFirstErrorField(validation)).toBe("name");
  });

  it("returns 'name' when both name and system have errors (name is first)", () => {
    const validation = validateCreateForm({
      name: "",
      systemPresetId: "nonexistent",
    });
    expect(getFirstErrorField(validation)).toBe("name");
  });

  it("returns 'systemPresetId' when only system has error", () => {
    const validation = validateCreateForm({
      name: "テスト",
      systemPresetId: "nonexistent",
    });
    expect(getFirstErrorField(validation)).toBe("systemPresetId");
  });
});

describe("classifyPresetCategory", () => {
  it("classifies SK as hilbert-propositional", () => {
    const preset = findPresetById("sk");
    expect(preset).toBeDefined();
    expect(classifyPresetCategory(preset!)).toBe("hilbert-propositional");
  });

  it("classifies lukasiewicz as hilbert-propositional", () => {
    const preset = findPresetById("lukasiewicz");
    expect(preset).toBeDefined();
    expect(classifyPresetCategory(preset!)).toBe("hilbert-propositional");
  });

  it("classifies predicate as hilbert-predicate", () => {
    const preset = findPresetById("predicate");
    expect(preset).toBeDefined();
    expect(classifyPresetCategory(preset!)).toBe("hilbert-predicate");
  });

  it("classifies equality as hilbert-predicate", () => {
    const preset = findPresetById("equality");
    expect(preset).toBeDefined();
    expect(classifyPresetCategory(preset!)).toBe("hilbert-predicate");
  });

  it("classifies peano as hilbert-theory", () => {
    const preset = findPresetById("peano");
    expect(preset).toBeDefined();
    expect(classifyPresetCategory(preset!)).toBe("hilbert-theory");
  });

  it("classifies group-left as hilbert-theory", () => {
    const preset = findPresetById("group-left");
    expect(preset).toBeDefined();
    expect(classifyPresetCategory(preset!)).toBe("hilbert-theory");
  });

  it("classifies nd-nm as natural-deduction", () => {
    const preset = findPresetById("nd-nm");
    expect(preset).toBeDefined();
    expect(classifyPresetCategory(preset!)).toBe("natural-deduction");
  });

  it("classifies sc-lk as sequent-calculus", () => {
    const preset = findPresetById("sc-lk");
    expect(preset).toBeDefined();
    expect(classifyPresetCategory(preset!)).toBe("sequent-calculus");
  });

  it("all presets are classified", () => {
    for (const preset of systemPresets) {
      const category = classifyPresetCategory(preset);
      expect(
        [
          "hilbert-propositional",
          "hilbert-predicate",
          "hilbert-theory",
          "natural-deduction",
          "sequent-calculus",
        ].includes(category),
      ).toBe(true);
    }
  });
});

describe("groupPresetsByCategory", () => {
  it("groups all presets into 5 categories", () => {
    const groups = groupPresetsByCategory(systemPresets);
    expect(groups).toHaveLength(5);
  });

  it("preserves category order from presetCategoryDefinitions", () => {
    const groups = groupPresetsByCategory(systemPresets);
    const categoryIds = groups.map((g) => g.category.id);
    expect(categoryIds).toEqual([
      "hilbert-propositional",
      "hilbert-predicate",
      "hilbert-theory",
      "natural-deduction",
      "sequent-calculus",
    ]);
  });

  it("hilbert-propositional contains 6 presets", () => {
    const groups = groupPresetsByCategory(systemPresets);
    const propGroup = groups.find(
      (g) => g.category.id === "hilbert-propositional",
    );
    expect(propGroup).toBeDefined();
    expect(propGroup!.presets).toHaveLength(6);
    const ids = propGroup!.presets.map((p) => p.id);
    expect(ids).toContain("sk");
    expect(ids).toContain("lukasiewicz");
    expect(ids).toContain("mendelson");
  });

  it("hilbert-predicate contains 2 presets", () => {
    const groups = groupPresetsByCategory(systemPresets);
    const predGroup = groups.find((g) => g.category.id === "hilbert-predicate");
    expect(predGroup).toBeDefined();
    expect(predGroup!.presets).toHaveLength(2);
  });

  it("hilbert-theory contains 8 presets", () => {
    const groups = groupPresetsByCategory(systemPresets);
    const theoryGroup = groups.find((g) => g.category.id === "hilbert-theory");
    expect(theoryGroup).toBeDefined();
    expect(theoryGroup!.presets).toHaveLength(8);
  });

  it("natural-deduction contains 3 presets", () => {
    const groups = groupPresetsByCategory(systemPresets);
    const ndGroup = groups.find((g) => g.category.id === "natural-deduction");
    expect(ndGroup).toBeDefined();
    expect(ndGroup!.presets).toHaveLength(3);
  });

  it("sequent-calculus contains 3 presets", () => {
    const groups = groupPresetsByCategory(systemPresets);
    const scGroup = groups.find((g) => g.category.id === "sequent-calculus");
    expect(scGroup).toBeDefined();
    expect(scGroup!.presets).toHaveLength(3);
  });

  it("total presets across all groups equals systemPresets length", () => {
    const groups = groupPresetsByCategory(systemPresets);
    const total = groups.reduce((sum, g) => sum + g.presets.length, 0);
    expect(total).toBe(systemPresets.length);
  });

  it("skips empty categories", () => {
    const groups = groupPresetsByCategory([]);
    expect(groups).toHaveLength(0);
  });

  it("each group has category with label and description", () => {
    const groups = groupPresetsByCategory(systemPresets);
    for (const group of groups) {
      expect(group.category.label.length).toBeGreaterThan(0);
      expect(group.category.description.length).toBeGreaterThan(0);
    }
  });
});

describe("presetCategoryDefinitions", () => {
  it("has 5 categories", () => {
    expect(presetCategoryDefinitions).toHaveLength(5);
  });

  it("each has unique id", () => {
    const ids = presetCategoryDefinitions.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each has non-empty label and description", () => {
    for (const def of presetCategoryDefinitions) {
      expect(def.label.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(0);
    }
  });
});
