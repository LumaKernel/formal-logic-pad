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

  it("each preset has a valid LogicSystem", () => {
    for (const preset of systemPresets) {
      expect(preset.system.name).toBeTruthy();
      expect(preset.system.propositionalAxioms).toBeInstanceOf(Set);
    }
  });

  it("includes lukasiewicz, predicate, and equality presets", () => {
    const ids = systemPresets.map((p) => p.id);
    expect(ids).toContain("lukasiewicz");
    expect(ids).toContain("predicate");
    expect(ids).toContain("equality");
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
    expect(values.mode).toBe("free");
    expect(values.systemPresetId).toBe(defaultPresetId);
  });
});

describe("validateCreateForm", () => {
  const validValues: CreateFormValues = {
    name: "テストノート",
    mode: "free",
    systemPresetId: "lukasiewicz",
  };

  it("valid form returns valid: true", () => {
    expect(validateCreateForm(validValues)).toEqual({ valid: true });
  });

  it("valid form with quest mode", () => {
    expect(validateCreateForm({ ...validValues, mode: "quest" })).toEqual({
      valid: true,
    });
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
        mode: "free",
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
      mode: "free",
      systemPresetId: "lukasiewicz",
    });
    expect(getFieldError(validation, "name")).toBeUndefined();
    expect(getFieldError(validation, "systemPresetId")).toBeUndefined();
  });

  it("returns error message for invalid name", () => {
    const validation = validateCreateForm({
      name: "",
      mode: "free",
      systemPresetId: "lukasiewicz",
    });
    expect(getFieldError(validation, "name")).toBe("名前を入力してください");
    expect(getFieldError(validation, "systemPresetId")).toBeUndefined();
  });

  it("returns error message for invalid systemPresetId", () => {
    const validation = validateCreateForm({
      name: "テスト",
      mode: "free",
      systemPresetId: "bad",
    });
    expect(getFieldError(validation, "name")).toBeUndefined();
    expect(getFieldError(validation, "systemPresetId")).toBe(
      "公理系を選択してください",
    );
  });
});
