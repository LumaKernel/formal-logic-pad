import { describe, it, expect } from "vitest";
import {
  sectionTitleLabel,
  createButtonLabel,
  importToggleLabel,
  emptyStateLabel,
  editButtonLabel,
  shareButtonLabel,
  duplicateButtonLabel,
  deleteButtonLabel,
  deleteConfirmLabel,
  cancelLabel,
  deleteConfirmActionLabel,
  sharePanelTitleLabel,
  jsonExportLabel,
  urlCopyLabel,
  closeLabel,
  titleFieldLabel,
  descriptionFieldLabel,
  difficultyFieldLabel,
  systemFieldLabel,
  goalFormulasFieldLabel,
  hintsFieldLabel,
  estimatedStepsFieldLabel,
  learningPointFieldLabel,
  stepsPlaceholder,
  saveButtonLabel,
  createSubmitLabel,
  importFileLabel,
  importPasteLabel,
  importSubmitLabel,
} from "./customQuestListLabels";

describe("customQuestListLabels", () => {
  // --- セクションヘッダー ---

  describe("sectionTitleLabel", () => {
    it("JA", () => expect(sectionTitleLabel("ja")).toBe("自作クエスト"));
    it("EN", () => expect(sectionTitleLabel("en")).toBe("Custom Quests"));
  });

  describe("createButtonLabel", () => {
    it("JA not creating", () =>
      expect(createButtonLabel(false, "ja")).toBe("新規作成"));
    it("JA creating", () =>
      expect(createButtonLabel(true, "ja")).toBe("閉じる"));
    it("EN not creating", () =>
      expect(createButtonLabel(false, "en")).toBe("Create New"));
    it("EN creating", () =>
      expect(createButtonLabel(true, "en")).toBe("Close"));
  });

  describe("importToggleLabel", () => {
    it("JA not importing", () =>
      expect(importToggleLabel(false, "ja")).toBe("インポート"));
    it("JA importing", () =>
      expect(importToggleLabel(true, "ja")).toBe("閉じる"));
    it("EN not importing", () =>
      expect(importToggleLabel(false, "en")).toBe("Import"));
    it("EN importing", () =>
      expect(importToggleLabel(true, "en")).toBe("Close"));
  });

  describe("emptyStateLabel", () => {
    it("JA", () =>
      expect(emptyStateLabel("ja")).toBe("自作クエストはまだありません。"));
    it("EN", () => expect(emptyStateLabel("en")).toBe("No custom quests yet."));
  });

  // --- アイテムボタン ---

  describe("editButtonLabel", () => {
    it("JA", () => expect(editButtonLabel("ja")).toBe("編集"));
    it("EN", () => expect(editButtonLabel("en")).toBe("Edit"));
  });

  describe("shareButtonLabel", () => {
    it("JA", () => expect(shareButtonLabel("ja")).toBe("共有"));
    it("EN", () => expect(shareButtonLabel("en")).toBe("Share"));
  });

  describe("duplicateButtonLabel", () => {
    it("JA", () => expect(duplicateButtonLabel("ja")).toBe("複製"));
    it("EN", () => expect(duplicateButtonLabel("en")).toBe("Duplicate"));
  });

  describe("deleteButtonLabel", () => {
    it("JA", () => expect(deleteButtonLabel("ja")).toBe("削除"));
    it("EN", () => expect(deleteButtonLabel("en")).toBe("Delete"));
  });

  // --- 削除確認 ---

  describe("deleteConfirmLabel", () => {
    it("JA", () =>
      expect(deleteConfirmLabel("ja")).toBe("本当に削除しますか？"));
    it("EN", () =>
      expect(deleteConfirmLabel("en")).toBe(
        "Are you sure you want to delete?",
      ));
  });

  describe("cancelLabel", () => {
    it("JA", () => expect(cancelLabel("ja")).toBe("キャンセル"));
    it("EN", () => expect(cancelLabel("en")).toBe("Cancel"));
  });

  describe("deleteConfirmActionLabel", () => {
    it("JA", () => expect(deleteConfirmActionLabel("ja")).toBe("削除する"));
    it("EN", () => expect(deleteConfirmActionLabel("en")).toBe("Delete"));
  });

  // --- 共有パネル ---

  describe("sharePanelTitleLabel", () => {
    it("JA", () => expect(sharePanelTitleLabel("ja")).toBe("共有"));
    it("EN", () => expect(sharePanelTitleLabel("en")).toBe("Share"));
  });

  describe("jsonExportLabel", () => {
    it("JA", () => expect(jsonExportLabel("ja")).toBe("JSONエクスポート"));
    it("EN", () => expect(jsonExportLabel("en")).toBe("JSON Export"));
  });

  describe("urlCopyLabel", () => {
    it("JA not copied", () =>
      expect(urlCopyLabel(false, "ja")).toBe("URLをコピー"));
    it("JA copied", () =>
      expect(urlCopyLabel(true, "ja")).toBe("コピーしました!"));
    it("EN not copied", () =>
      expect(urlCopyLabel(false, "en")).toBe("Copy URL"));
    it("EN copied", () => expect(urlCopyLabel(true, "en")).toBe("Copied!"));
  });

  describe("closeLabel", () => {
    it("JA", () => expect(closeLabel("ja")).toBe("閉じる"));
    it("EN", () => expect(closeLabel("en")).toBe("Close"));
  });

  // --- フォームラベル ---

  describe("titleFieldLabel", () => {
    it("JA", () => expect(titleFieldLabel("ja")).toBe("タイトル"));
    it("EN", () => expect(titleFieldLabel("en")).toBe("Title"));
  });

  describe("descriptionFieldLabel", () => {
    it("JA", () => expect(descriptionFieldLabel("ja")).toBe("説明"));
    it("EN", () => expect(descriptionFieldLabel("en")).toBe("Description"));
  });

  describe("difficultyFieldLabel", () => {
    it("JA", () => expect(difficultyFieldLabel("ja")).toBe("難易度"));
    it("EN", () => expect(difficultyFieldLabel("en")).toBe("Difficulty"));
  });

  describe("systemFieldLabel", () => {
    it("JA", () => expect(systemFieldLabel("ja")).toBe("体系"));
    it("EN", () => expect(systemFieldLabel("en")).toBe("System"));
  });

  describe("goalFormulasFieldLabel", () => {
    it("JA", () => expect(goalFormulasFieldLabel("ja")).toBe("ゴール式"));
    it("EN", () => expect(goalFormulasFieldLabel("en")).toBe("Goal Formulas"));
  });

  describe("hintsFieldLabel", () => {
    it("JA", () =>
      expect(hintsFieldLabel("ja")).toBe("ヒント（1行に1つ、任意）"));
    it("EN", () =>
      expect(hintsFieldLabel("en")).toBe("Hints (one per line, optional)"));
  });

  describe("estimatedStepsFieldLabel", () => {
    it("JA", () =>
      expect(estimatedStepsFieldLabel("ja")).toBe("推定ステップ数（任意）"));
    it("EN", () =>
      expect(estimatedStepsFieldLabel("en")).toBe("Est. Steps (optional)"));
  });

  describe("learningPointFieldLabel", () => {
    it("JA", () => expect(learningPointFieldLabel("ja")).toBe("学習ポイント"));
    it("EN", () =>
      expect(learningPointFieldLabel("en")).toBe("Learning Point"));
  });

  describe("stepsPlaceholder", () => {
    it("JA", () => expect(stepsPlaceholder("ja")).toBe("未指定"));
    it("EN", () => expect(stepsPlaceholder("en")).toBe("N/A"));
  });

  describe("saveButtonLabel", () => {
    it("JA", () => expect(saveButtonLabel("ja")).toBe("保存"));
    it("EN", () => expect(saveButtonLabel("en")).toBe("Save"));
  });

  describe("createSubmitLabel", () => {
    it("JA", () => expect(createSubmitLabel("ja")).toBe("作成"));
    it("EN", () => expect(createSubmitLabel("en")).toBe("Create"));
  });

  // --- インポートフォーム ---

  describe("importFileLabel", () => {
    it("JA", () => expect(importFileLabel("ja")).toBe("JSONファイルを選択"));
    it("EN", () => expect(importFileLabel("en")).toBe("Select JSON file"));
  });

  describe("importPasteLabel", () => {
    it("JA", () => expect(importPasteLabel("ja")).toBe("またはJSONを貼り付け"));
    it("EN", () => expect(importPasteLabel("en")).toBe("Or paste JSON"));
  });

  describe("importSubmitLabel", () => {
    it("JA", () => expect(importSubmitLabel("ja")).toBe("インポート"));
    it("EN", () => expect(importSubmitLabel("en")).toBe("Import"));
  });
});
