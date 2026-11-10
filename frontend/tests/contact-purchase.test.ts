import { describe, expect, it } from "vitest";
import { contactFormSchema, contactWithPurchaseFormSchema } from "../src/schemas/contact.schema";
import type { AssistantContactDraft } from "../src/types/assistant";
import { draftPurchaseRows } from "../src/utils/assistant-chat";
import {
  createEmptyContactWithPurchaseFormValues,
  formValuesToCreateWithPurchasePayload,
} from "../src/utils/contact-form";

function values(overrides = {}) {
  return {
    ...createEmptyContactWithPurchaseFormValues(),
    nome: "Juliana Ferreira",
    cidadeId: "11111111-1111-4111-8111-111111111111",
    telefone: "42 99999-8888",
    cor: "Castanho",
    comprimentoCm: "60",
    natural: "true" as const,
    dataCorte: "2026-10-20",
    pesoG: "420",
    valorPago: "1850,50",
    formaPagamento: "Dinheiro" as const,
    ...overrides,
  };
}

describe("formulário de contato com compra", () => {
  it("exige os dados da compra na criação", () => {
    const vazio = createEmptyContactWithPurchaseFormValues();
    expect(vazio.formaPagamento).toBe("Pix");
    expect(vazio.dataCorte).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const semValor = contactWithPurchaseFormSchema.safeParse(values({ valorPago: "" }));
    expect(semValor.success).toBe(false);
    expect(semValor.error?.issues.map((issue) => issue.path[0])).toContain("valorPago");

    expect(contactWithPurchaseFormSchema.safeParse(values()).success).toBe(true);
  });

  it("a edição continua validando só o contato", () => {
    expect(contactFormSchema.safeParse(values({ valorPago: "", dataCorte: "" })).success).toBe(true);
  });

  it("monta o payload com contato e compra; o cabelo vai uma vez, no contato", () => {
    const payload = formValuesToCreateWithPurchasePayload(
      values({ valorRevenda: "2500", dataRevenda: "2026-10-22", comprador: "Loja Bella" }),
    );

    expect(payload.contato).toMatchObject({
      nome: "Juliana Ferreira",
      cor: "Castanho",
      comprimentoCm: 60,
      natural: true,
    });
    expect(payload.compra).toEqual({
      dataCorte: "2026-10-20",
      pesoG: 420,
      valorPago: "1850.50",
      formaPagamento: "Dinheiro",
      valorRevenda: "2500",
      dataRevenda: "2026-10-22",
      comprador: "Loja Bella",
    });
    expect(payload.compra).not.toHaveProperty("visitaId");
  });
});

describe("resumo da compra no assistente", () => {
  it("mostra valor, forma, peso e preço por grama", () => {
    const rows = draftPurchaseRows({
      dataCorte: "2026-10-20",
      valorPago: "1850.00",
      formaPagamento: "Pix",
      pesoG: 370,
      valorRevenda: null,
      dataRevenda: null,
      comprador: null,
    } as AssistantContactDraft);

    const map = Object.fromEntries(rows.map((row) => [row.label, row.value]));
    expect(map["Data do corte"]).toBe("20/10/2026");
    expect(map["Forma de pagamento"]).toBe("Pix");
    expect(map["Peso"]).toBe("370 g");
    expect(map["Valor pago"]).toMatch(/1\.850,00/);
    expect(map["Preço por grama"]).toMatch(/5,00\/g/);
    expect(map["Valor de revenda"]).toBeUndefined();
  });
});
