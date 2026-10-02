import "temporal-polyfill/full/global";

import { afterEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { db } from "../prisma/db";
import { ContatoRepository } from "../repositories/contato.repository";
import { CompraRepository } from "../repositories/compra.repository";

describe("CompraRepository - integração", () => {
  const contatoRepository = new ContatoRepository();
  const compraRepository = new CompraRepository();

  let cidadeId: string | null = null;
  let contatoId: string | null = null;

  afterEach(async () => {
    if (contatoId) {
      await db.orm.public.Compra
        .where({
          contatoId,
        })
        .delete();

      await db.orm.public.Contato
        .where({
          id: contatoId,
        })
        .delete();
    }

    if (cidadeId) {
      await db.orm.public.Cidade
        .where({
          id: cidadeId,
        })
        .delete();
    }

    contatoId = null;
    cidadeId = null;
  });

  it("cria a compra e altera o contato para comprado", async () => {
    const cidade = await db.orm.public.Cidade.create({
      nome: `Cidade Teste ${randomUUID()}`,
      uf: "SC",
      lat: null,
      lng: null,
    });

    cidadeId = cidade.id;

    const contato = await contatoRepository.create({
      nome: "Cliente Teste Integração",
      cidadeId: cidade.id,
      telefone: null,
      endereco: null,
      origem: null,
      natural: true,
      cor: "Castanho",
      textura: "Ondulado",
      quimica: "Nenhuma",
      comprimentoCm: 70,
      observacoes: null,
    });

    contatoId = contato.id;

    expect(contato.status).toBe("lead");

    const compra = await compraRepository.registrar({
      contatoId: contato.id,
      dataCorte: "2026-10-02",
      pesoG: 450,
      comprimentoCm: 70,
      cor: "Castanho",
      textura: "Ondulado",
      quimica: "Nenhuma",
      valorPago: "1800.00",
      formaPagamento: "Pix",
    });

    expect(compra).not.toBeNull();

    const contatoAtualizado =
      await contatoRepository.findById(contato.id);

    expect(contatoAtualizado).not.toBeNull();
    expect(contatoAtualizado?.status).toBe("comprado");

    const compras =
      await compraRepository.findByContatoId(contato.id);

    expect(compras).toHaveLength(1);

    expect(compras[0]?.valorPago.toString()).toBe(
      "1800.00",
    );

    expect(compras[0]?.pesoG).toBe(450);
  });

  it("não cria compra para contato inexistente", async () => {
    const contatoInexistenteId = randomUUID();

    const compra = await compraRepository.registrar({
      contatoId: contatoInexistenteId,
      dataCorte: "2026-10-02",
      pesoG: 400,
      comprimentoCm: 65,
      cor: "Castanho",
      textura: "Liso",
      quimica: "Nenhuma",
      valorPago: "1500.00",
      formaPagamento: "Pix",
    });

    expect(compra).toBeNull();

    const compras =
      await compraRepository.findByContatoId(
        contatoInexistenteId,
      );

    expect(compras).toHaveLength(0);
    });
      
    it("não permite registrar compra para contato excluído", async () => {
      const cidade = await db.orm.public.Cidade.create({
        nome: `Cidade Teste ${randomUUID()}`,
        uf: "SC",
        lat: null,
        lng: null,
      });

      cidadeId = cidade.id;

      const contato = await contatoRepository.create({
        nome: "Cliente Excluído Teste",
        cidadeId: cidade.id,
        telefone: null,
        endereco: null,
        origem: null,
        natural: true,
        cor: "Castanho",
        textura: "Liso",
        quimica: "Nenhuma",
        comprimentoCm: 65,
        observacoes: null,
      });

      contatoId = contato.id;

      await contatoRepository.softDelete(contato.id);

      const contatoExcluido =
        await contatoRepository.findById(contato.id);

      expect(contatoExcluido).toBeNull();

      const compra = await compraRepository.registrar({
        contatoId: contato.id,
        dataCorte: "2026-10-02",
        pesoG: 350,
        comprimentoCm: 65,
        cor: "Castanho",
        textura: "Liso",
        quimica: "Nenhuma",
        valorPago: "1200.00",
        formaPagamento: "Dinheiro",
      });

      expect(compra).toBeNull();

      const compras =
        await compraRepository.findByContatoId(contato.id);

      expect(compras).toHaveLength(0);
    });
});