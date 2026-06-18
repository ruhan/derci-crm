import { describe, expect, it } from "vitest";
import { formatBRL, fmtPhone, onlyDigits } from "../src/lib/format";

describe("format helpers", () => {
  it("formats BRL", () => {
    expect(formatBRL(1234.5)).toMatch(/R\$/);
    expect(formatBRL(0)).toMatch(/R\$/);
    expect(formatBRL(null)).toBe("R$ 0,00");
  });

  it("formats phone", () => {
    expect(fmtPhone("11987654321")).toBe("(11) 98765-4321");
    expect(fmtPhone("1133334444")).toBe("(11) 3333-4444");
    expect(fmtPhone("invalid")).toBe("invalid");
  });

  it("onlyDigits keeps only digits", () => {
    expect(onlyDigits("(11) 98765-4321")).toBe("11987654321");
    expect(onlyDigits(null)).toBe("");
  });
});
