import { describe, it, expect } from "vitest";
import {
  getCurrentTimestamp,
  getCurrentUtcDateComponents,
  timestampToLocalDateComponents,
} from "./unsafeDate";

describe("getCurrentTimestamp", () => {
  it("returns a positive number", () => {
    const ts = getCurrentTimestamp();
    expect(typeof ts).toBe("number");
    expect(ts).toBeGreaterThan(0);
  });
});

describe("getCurrentUtcDateComponents", () => {
  it("returns valid date components", () => {
    const c = getCurrentUtcDateComponents();
    expect(c.year).toBeGreaterThanOrEqual(2024);
    expect(c.month).toBeGreaterThanOrEqual(1);
    expect(c.month).toBeLessThanOrEqual(12);
    expect(c.day).toBeGreaterThanOrEqual(1);
    expect(c.day).toBeLessThanOrEqual(31);
    expect(c.hour).toBeGreaterThanOrEqual(0);
    expect(c.hour).toBeLessThanOrEqual(23);
    expect(c.minute).toBeGreaterThanOrEqual(0);
    expect(c.minute).toBeLessThanOrEqual(59);
  });
});

describe("timestampToLocalDateComponents", () => {
  it("converts a known timestamp", () => {
    // 2024-01-15T10:30:00.000Z in UTC
    const ts = 1705312200000;
    const c = timestampToLocalDateComponents(ts);
    expect(c.year).toBe(2024);
    // month/day/hour may differ by timezone, but should be valid
    expect(c.month).toBeGreaterThanOrEqual(1);
    expect(c.month).toBeLessThanOrEqual(12);
    expect(c.day).toBeGreaterThanOrEqual(1);
    expect(c.day).toBeLessThanOrEqual(31);
    expect(c.hour).toBeGreaterThanOrEqual(0);
    expect(c.hour).toBeLessThanOrEqual(23);
    expect(c.minute).toBeGreaterThanOrEqual(0);
    expect(c.minute).toBeLessThanOrEqual(59);
  });
});
