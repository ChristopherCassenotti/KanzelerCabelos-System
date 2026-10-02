import {
  describe,
  expect,
  it,
} from "vitest";

import {
  podeAlterarStatus,
} from "../services/contato-status.rules";

describe("Regras de status do contato", () => {
  it("permite lead virar avaliação agendada", () => {
    expect(
      podeAlterarStatus(
        "lead",
        "avaliacao_agendada",
      ),
    ).toBe(true);
  });

  it("permite lead virar perdido", () => {
    expect(
      podeAlterarStatus(
        "lead",
        "perdido",
      ),
    ).toBe(true);
  });

  it("permite avaliação agendada virar comprado", () => {
    expect(
      podeAlterarStatus(
        "avaliacao_agendada",
        "comprado",
      ),
    ).toBe(true);
  });

  it("permite perdido voltar para lead", () => {
    expect(
      podeAlterarStatus(
        "perdido",
        "lead",
      ),
    ).toBe(true);
  });

  it("não permite lead virar comprado diretamente", () => {
    expect(
      podeAlterarStatus(
        "lead",
        "comprado",
      ),
    ).toBe(false);
  });

  it("não permite comprado virar perdido diretamente", () => {
    expect(
      podeAlterarStatus(
        "comprado",
        "perdido",
      ),
    ).toBe(false);
  });
});