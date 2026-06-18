import { describe, expect, it } from "vitest";
import { getWeekStart, getWeekEnd, shiftWeek, weekISO } from "../src/lib/week";

describe("week helpers", () => {
  it("getWeekStart returns the Monday at 00:00", () => {
    // 2026-06-18 (qui)
    const d = new Date(2026, 5, 18, 15, 30);
    const start = getWeekStart(d);
    expect(start.getDay()).toBe(1); // segunda
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });

  it("getWeekEnd returns Sunday end of day", () => {
    const d = new Date(2026, 5, 18);
    const end = getWeekEnd(d);
    expect(end.getDay()).toBe(0); // domingo
    expect(end.getHours()).toBe(23);
  });

  it("shiftWeek moves by N weeks", () => {
    const start = getWeekStart(new Date(2026, 5, 18));
    const next = shiftWeek(start, 1);
    expect(next.getTime() - start.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("weekISO formats yyyy-MM-dd", () => {
    const d = getWeekStart(new Date(2026, 5, 18));
    expect(weekISO(d)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
