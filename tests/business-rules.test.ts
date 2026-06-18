import { describe, expect, it } from "vitest";

/**
 * Testes "puros" das regras críticas. A função simula o comportamento de
 * `consumeSessionFromActivePlan` em memória, sem precisar de DB:
 *
 *  - Bloqueia se não houver plano ABERTO com sessões disponíveis.
 *  - Decrementa 1 sessão.
 *  - Finaliza o plano quando o saldo zera.
 *  - Marca para criação de tarefa de renovação ao finalizar.
 */

type FakePlan = {
  totalSessions: number;
  usedSessions: number;
  status: "ABERTO" | "FINALIZADO" | "CANCELADO" | "AGUARDANDO_PAGAMENTO";
};

function consume(plan: FakePlan | null) {
  if (!plan || plan.status !== "ABERTO") {
    throw new Error("Este paciente não possui plano pago com sessões disponíveis.");
  }
  if (plan.usedSessions >= plan.totalSessions) {
    throw new Error("Este paciente não possui plano pago com sessões disponíveis.");
  }
  const used = plan.usedSessions + 1;
  const finalize = used >= plan.totalSessions;
  return {
    plan: {
      ...plan,
      usedSessions: used,
      status: finalize ? "FINALIZADO" : "ABERTO",
    } as FakePlan,
    finalized: finalize,
  };
}

describe("regras de negócio: consumir sessão", () => {
  it("bloqueia quando não há plano", () => {
    expect(() => consume(null)).toThrow(/não possui plano pago/);
  });

  it("bloqueia quando plano não está aberto", () => {
    expect(() => consume({ totalSessions: 4, usedSessions: 0, status: "AGUARDANDO_PAGAMENTO" }))
      .toThrow(/não possui plano pago/);
  });

  it("decrementa uma sessão", () => {
    const r = consume({ totalSessions: 4, usedSessions: 1, status: "ABERTO" });
    expect(r.plan.usedSessions).toBe(2);
    expect(r.plan.status).toBe("ABERTO");
    expect(r.finalized).toBe(false);
  });

  it("finaliza o plano quando zera o saldo", () => {
    const r = consume({ totalSessions: 4, usedSessions: 3, status: "ABERTO" });
    expect(r.plan.usedSessions).toBe(4);
    expect(r.plan.status).toBe("FINALIZADO");
    expect(r.finalized).toBe(true);
  });

  it("não permite ultrapassar saldo", () => {
    expect(() => consume({ totalSessions: 4, usedSessions: 4, status: "ABERTO" }))
      .toThrow(/não possui plano pago/);
  });
});
