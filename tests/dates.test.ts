import { describe, expect, it } from "vitest";
import {
  formatBrazilianDateTime,
  parseBrazilianDateTime,
  roundToNextHalfHour,
  snapToHalfHour,
} from "../src/lib/dates";

describe("agendamento: data/hora BR", () => {
  it("formata dd/MM/yyyy HH:mm", () => {
    const d = new Date(2026, 5, 23, 14, 30, 0);
    expect(formatBrazilianDateTime(d)).toBe("23/06/2026 14:30");
  });

  it("aceita minutos :00 e :30", () => {
    expect(parseBrazilianDateTime("23/06/2026 09:00")).toEqual(
      new Date(2026, 5, 23, 9, 0, 0)
    );
    expect(parseBrazilianDateTime("23/06/2026 09:30")).toEqual(
      new Date(2026, 5, 23, 9, 30, 0)
    );
  });

  it("rejeita outros minutos", () => {
    expect(parseBrazilianDateTime("23/06/2026 09:15")).toBeNull();
    expect(parseBrazilianDateTime("23/06/2026 09:45")).toBeNull();
  });

  it("rejeita formato inválido", () => {
    expect(parseBrazilianDateTime("2026-06-23 09:30")).toBeNull();
    expect(parseBrazilianDateTime("")).toBeNull();
  });

  it("arredonda para o próximo slot de 30 min", () => {
    const d = new Date(2026, 5, 23, 14, 10, 0);
    expect(roundToNextHalfHour(d).getMinutes()).toBe(30);
    expect(roundToNextHalfHour(d).getHours()).toBe(14);

    const late = new Date(2026, 5, 23, 14, 45, 0);
    expect(roundToNextHalfHour(late).getMinutes()).toBe(0);
    expect(roundToNextHalfHour(late).getHours()).toBe(15);
  });

  it("ajusta minutos existentes ao slot mais próximo", () => {
    const d = new Date(2026, 5, 23, 10, 17, 0);
    expect(snapToHalfHour(d).getMinutes()).toBe(30);
  });
});
