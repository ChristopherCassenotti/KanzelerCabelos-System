import { describe, expect, it } from "vitest";
import type { ContactOverview } from "../src/types/contact";
import {
  createEmptyNewFutureCutValues,
  findSimilarContacts,
  formValuesToNewFutureCutPayload,
  futureCutLabel,
} from "../src/utils/future-cut";

describe("futuro corte", () => {
  it.each([
    [87, "Contato em 87 dias"],
    [1, "Contato em 1 dia"],
    [0, "Contato hoje"],
    [-1, "CONTATO ATRASADO HÁ 1 DIA"],
    [-4, "CONTATO ATRASADO HÁ 4 DIAS"],
  ])("selo para %i dias", (diasParaContato, label) => {
    expect(futureCutLabel({ status: "acompanhando", diasParaContato })).toBe(label);
  });

  it("monta contato e acompanhamento sem campos vazios no contato", () => {
    const payload = formValuesToNewFutureCutPayload({
      ...createEmptyNewFutureCutValues(),
      nome: "Maria",
      cidadeId: "c1",
      dataProximoContato: "2027-02-10",
      natural: "false",
      comprimentoAtualCm: "50",
      observacoes: "Obs",
    });

    expect(payload.contato).toEqual({ nome: "Maria", cidadeId: "c1", natural: false, comprimentoCm: 50 });
    expect(payload.futuroCorte).toMatchObject({ dataProximoContato: "2027-02-10", observacoes: "Obs", cor: null });
  });

  it("encontra parecidos por telefone ou nome na mesma cidade", () => {
    const contacts = [{ id: "1", nome: "Márcia Lima", telefone: "49999998888", cidadeId: "c1" }] as ContactOverview[];

    expect(findSimilarContacts(contacts, { nome: "marcia lima", telefone: "", cidadeId: "c1" })).toHaveLength(1);
    expect(findSimilarContacts(contacts, { nome: "marcia lima", telefone: "", cidadeId: "c2" })).toHaveLength(0);
    expect(findSimilarContacts(contacts, { nome: "X", telefone: "(49) 9 9999-8888", cidadeId: "" })).toHaveLength(1);
    expect(findSimilarContacts(contacts, { nome: "", telefone: "", cidadeId: "" })).toHaveLength(0);
  });
});
