import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";

import { ContatoController } from "../controllers/contato.controller";
import { montarCompra } from "../repositories/compra.repository";
import { registrarCompraSchema } from "../schemas/compra.schema";
import { criarContatoComCompraSchema } from "../schemas/contato.schema";
import { ContatoService } from "../services/contato.service";

import type { ContatoRepository } from "../repositories/contato.repository";
import type { CidadeRepository } from "../repositories/cidade.repository";
import type { GeocodingService } from "../services/geocoding.service";
import type { CidadeService } from "../services/cidade.service";

const CIDADE = "11111111-1111-4111-8111-111111111111";

const CADASTRO = {
  contato: {
    nome: "Juliana Ferreira",
    cidadeId: CIDADE,
    endereco: "Rua A, 10",
    cor: "Castanho",
    comprimentoCm: 60,
  },
  compra: {
    dataCorte: "2026-10-20",
    pesoG: 420,
    valorPago: "1850.00",
    formaPagamento: "Pix" as const,
    valorRevenda: "2500.00",
    dataRevenda: "2026-10-22",
    comprador: "Loja Bella",
  },
};

function servico() {
  const createComCompra = vi.fn(async () => ({
    contato: { id: "contato-1", status: "comprado" },
    compra: { id: "compra-1" },
  }));

  const buscarEndereco = vi.fn(async () => ({ lat: -26.2, lng: -51.08, geoPlaceId: "place-1" }));

  const service = new ContatoService(
    { createComCompra } as unknown as ContatoRepository,
    undefined,
    undefined,
    undefined,
    undefined,
    { findById: vi.fn(async () => ({ id: CIDADE, nome: "União da Vitória", uf: "PR" })) } as unknown as CidadeRepository,
    { buscarEndereco } as unknown as GeocodingService,
  );

  return { service, createComCompra, buscarEndereco };
}

describe("ContatoService.createComCompra", () => {
  it("reaproveita as regras do cadastro (geocoding, padrões) e grava tudo numa operação", async () => {
    const { service, createComCompra, buscarEndereco } = servico();

    const resultado = await service.createComCompra(criarContatoComCompraSchema.parse(CADASTRO), "usuario-1");

    expect(resultado).toEqual({ contato: { id: "contato-1", status: "comprado" }, compra: { id: "compra-1" } });
    expect(buscarEndereco).toHaveBeenCalledWith("Rua A, 10, União da Vitória - PR, Brasil");
    expect(createComCompra).toHaveBeenCalledTimes(1);

    const [contatoModel, compra, usuarioId] = createComCompra.mock.calls[0] as unknown as [
      Record<string, unknown>,
      Record<string, unknown>,
      string,
    ];
    expect(contatoModel).toMatchObject({
      nome: "Juliana Ferreira",
      cidadeId: CIDADE,
      lat: "-26.2",
      geoFonte: "geoapify",
      autorizouFoto: false,
      telefone: null,
    });
    // Data do primeiro contato padrão = hoje.
    expect(String(contatoModel["dataPrimeiroContato"])).toBe(
      Temporal.Now.plainDateISO("America/Sao_Paulo").toString(),
    );
    expect(compra).toMatchObject(CADASTRO.compra);
    expect(usuarioId).toBe("usuario-1");
  });
});

describe("POST /contatos/com-compra", () => {
  async function servidor(cidadeExiste = true) {
    const createComCompra = vi.fn(async () => ({
      contato: { id: "contato-1", status: "comprado" },
      compra: { id: "compra-1" },
    }));

    const controller = new ContatoController(
      { createComCompra } as unknown as ContatoService,
      { findById: vi.fn(async () => (cidadeExiste ? { id: CIDADE, nome: "X", uf: "PR" } : null)) } as unknown as CidadeService,
    );

    const app = Fastify();
    app.decorateRequest("usuarioId", null);
    app.addHook("preHandler", async (req) => {
      req.usuarioId = "usuario-1";
    });
    app.post("/contatos/com-compra", (req, reply) => controller.createComCompra(req, reply));
    await app.ready();

    return { app, createComCompra };
  }

  it("cria contato + compra e responde 201", async () => {
    const { app, createComCompra } = await servidor();
    const resposta = await app.inject({ method: "POST", url: "/contatos/com-compra", payload: CADASTRO });

    expect(resposta.statusCode).toBe(201);
    expect(resposta.json()).toMatchObject({ contato: { status: "comprado" }, compra: { id: "compra-1" } });
    expect(createComCompra).toHaveBeenCalledWith(expect.objectContaining({ compra: expect.objectContaining({ valorPago: "1850.00" }) }), "usuario-1");
    await app.close();
  });

  it("sem dados da compra não cria nada (400)", async () => {
    const { app, createComCompra } = await servidor();

    for (const payload of [
      { contato: CADASTRO.contato },
      { contato: CADASTRO.contato, compra: { ...CADASTRO.compra, valorPago: "abc" } },
      { contato: CADASTRO.contato, compra: { ...CADASTRO.compra, formaPagamento: "Cheque" } },
      { contato: { ...CADASTRO.contato, nome: "" }, compra: CADASTRO.compra },
    ]) {
      const resposta = await app.inject({ method: "POST", url: "/contatos/com-compra", payload });
      expect(resposta.statusCode).toBe(400);
    }

    expect(createComCompra).not.toHaveBeenCalled();
    await app.close();
  });

  it("cidade inexistente responde 422 sem gravar", async () => {
    const { app, createComCompra } = await servidor(false);
    const resposta = await app.inject({ method: "POST", url: "/contatos/com-compra", payload: CADASTRO });

    expect(resposta.statusCode).toBe(422);
    expect(createComCompra).not.toHaveBeenCalled();
    await app.close();
  });
});

describe("compra: campos de revenda", () => {
  it("o registro de compra existente aceita revenda (antes era descartada)", () => {
    const resultado = registrarCompraSchema.parse({
      dataCorte: "2026-10-20",
      valorPago: "100",
      formaPagamento: "Pix",
      valorRevenda: "150.5",
      dataRevenda: "2026-10-21",
      comprador: "Loja",
    });

    expect(resultado).toMatchObject({ valorRevenda: "150.5", dataRevenda: "2026-10-21", comprador: "Loja" });
  });

  it("montarCompra herda o cabelo do contato quando a compra não informa", () => {
    const linha = montarCompra(
      { dataCorte: "2026-10-20", valorPago: "100.00", formaPagamento: "Dinheiro", cor: "Loiro", dataRevenda: "2026-10-22", valorRevenda: "200.00" },
      { comprimentoCm: 60, cor: "Castanho", textura: "Liso", quimica: null },
    );

    expect(linha).toMatchObject({
      comprimentoCm: 60,
      cor: "Loiro",
      textura: "Liso",
      quimica: null,
      pesoG: null,
      valorRevenda: "200.00",
      comprador: null,
    });
    expect(String(linha.dataCorte)).toBe("2026-10-20");
    expect(String(linha.dataRevenda)).toBe("2026-10-22");
  });
});
