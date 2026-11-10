import { describe, expect, it } from "vitest";

import {
  ChaveIdempotenciaConflitoError,
  LimitadorPorUsuario,
  LimiteUsoExcedidoError,
  RegistroIdempotencia,
} from "../services/assistente-protecao";
import { CidadeService } from "../services/cidade.service";
import type { CidadeRepository } from "../repositories/cidade.repository";

describe("LimitadorPorUsuario", () => {
  it("bloqueia acima do limite e libera após a janela", () => {
    let agora = 0;
    const limitador = new LimitadorPorUsuario([{ janelaMs: 1000, maximo: 2 }], () => agora);

    limitador.consumir("u1");
    limitador.consumir("u1");
    limitador.consumir("u2");

    expect(() => limitador.consumir("u1")).toThrow(LimiteUsoExcedidoError);

    agora = 1001;
    expect(() => limitador.consumir("u1")).not.toThrow();
  });
});

describe("RegistroIdempotencia", () => {
  it("expira entradas concluídas após o TTL", async () => {
    let agora = 0;
    let execucoes = 0;
    const registro = new RegistroIdempotencia<number>(1000, () => agora);
    const operacao = async () => ++execucoes;

    await registro.executar("k", "a", operacao);
    await registro.executar("k", "a", operacao);
    expect(execucoes).toBe(1);

    await expect(registro.executar("k", "b", operacao)).rejects.toBeInstanceOf(
      ChaveIdempotenciaConflitoError,
    );

    agora = 2000;
    await registro.executar("k", "b", operacao);
    expect(execucoes).toBe(2);
  });
});

describe("CidadeService.resolverPorNome", () => {
  const service = new CidadeService({
    findAll: async () => [
      { id: "1", nome: "União da Vitória", uf: "PR", lat: null, lng: null },
      { id: "2", nome: "Porto União", uf: "SC", lat: null, lng: null },
      { id: "3", nome: "São Bento do Sul", uf: "SC", lat: null, lng: null },
    ],
  } as unknown as CidadeRepository);

  it("encontra correspondência exata sem acento", async () => {
    await expect(service.resolverPorNome("SAO BENTO DO SUL")).resolves.toMatchObject({
      tipo: "encontrada",
      cidade: { id: "3" },
    });
  });

  it("correspondência parcial vira opção para escolha, nunca seleção automática", async () => {
    const resultado = await service.resolverPorNome("União");

    expect(resultado.tipo).toBe("ambigua");
    if (resultado.tipo === "ambigua") {
      expect(resultado.opcoes.map((cidade) => cidade.id).sort()).toEqual(["1", "2"]);
    }
  });

  it("respeita a UF informada e rejeita cidade inexistente", async () => {
    await expect(service.resolverPorNome("União da Vitória", "SC")).resolves.toMatchObject({
      tipo: "nao_encontrada",
    });
    await expect(service.resolverPorNome("Curitiba")).resolves.toMatchObject({
      tipo: "nao_encontrada",
    });
  });
});
