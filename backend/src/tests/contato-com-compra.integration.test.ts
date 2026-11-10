import "temporal-polyfill/full/global";

import { afterEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { db } from "../prisma/db";
import { ContatoRepository } from "../repositories/contato.repository";

/**
 * Integração com o banco de TESTES (.env.test): a criação de contato + compra
 * é atômica e o contato já nasce como "comprado".
 */
describe("ContatoRepository.createComCompra - integração", () => {
  const repository = new ContatoRepository();
  let cidadeId: string | null = null;

  const contatoBase = (cidade: string) => ({
    nome: `Cliente Integração ${randomUUID()}`,
    cidadeId: cidade,
    telefone: null,
    endereco: null,
    lat: null,
    lng: null,
    geoFonte: null,
    geoPlaceId: null,
    origem: null,
    indicadoPor: null,
    dataPrimeiroContato: Temporal.PlainDate.from("2026-10-20"),
    dataAvaliacao: null,
    autorizouFoto: false,
    natural: true,
    cor: "Castanho",
    textura: null,
    quimica: null,
    comprimentoCm: 60,
    observacoes: null,
  });

  afterEach(async () => {
    if (!cidadeId) return;

    const contatos = await db.orm.public.Contato.where({ cidadeId }).all();
    for (const contato of contatos) {
      const compras = await db.orm.public.Compra.where({ contatoId: contato.id }).all();
      for (const compra of compras) {
        await db.orm.public.Auditoria.where({ entidadeId: compra.id }).delete();
        await db.orm.public.Compra.where({ id: compra.id }).delete();
      }
      await db.orm.public.Auditoria.where({ entidadeId: contato.id }).delete();
      await db.orm.public.Contato.where({ id: contato.id }).delete();
    }
    await db.orm.public.Cidade.where({ id: cidadeId }).delete();
    cidadeId = null;
  });

  async function criarCidade() {
    const cidade = await db.orm.public.Cidade.create({ nome: `Cidade Teste ${randomUUID()}`, uf: "SC", lat: null, lng: null });
    cidadeId = cidade.id;
    return cidade.id;
  }

  it("cria contato comprado, compra e auditoria juntos", async () => {
    const cidade = await criarCidade();

    const { contato, compra } = await repository.createComCompra(
      contatoBase(cidade),
      { dataCorte: "2026-10-20", valorPago: "1850.00", formaPagamento: "Pix", pesoG: 420 },
      null,
    );

    expect(contato.status).toBe("comprado");
    expect(compra.contatoId).toBe(contato.id);
    expect(compra.cor).toBe("Castanho");
    expect(compra.comprimentoCm).toBe(60);

    const auditorias = await db.orm.public.Auditoria.where({ entidadeId: contato.id }).all();
    expect(auditorias.map((item) => item.acao)).toContain("contato_criado_com_compra");
  });

  it("se a compra falhar, o contato não é criado (transação)", async () => {
    const cidade = await criarCidade();

    await expect(
      repository.createComCompra(
        contatoBase(cidade),
        { dataCorte: "2026-10-20", valorPago: "valor-invalido", formaPagamento: "Pix" },
        null,
      ),
    ).rejects.toThrow();

    const contatos = await db.orm.public.Contato.where({ cidadeId: cidade }).all();
    expect(contatos).toHaveLength(0);
  });
});
