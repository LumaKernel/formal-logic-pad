import { describe, it, expect } from "vitest";
import {
  systemPresets,
  defaultPresetId,
  findPresetById,
  defaultCreateFormValues,
  validateCreateForm,
  getFieldError,
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

  it("hilbert presets have correct style", () => {
    const hilbertPresets = systemPresets.filter(
      (p) => !p.id.startsWith("nd-") && !p.id.startsWith("sc-"),
    );
    expect(hilbertPresets.length).toBeGreaterThanOrEqual(9);
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
