import "temporal-polyfill/full/global";

import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { db } from "../prisma/db";
import { ContatoRepository } from "../repositories/contato.repository";
import { FuturoCorteRepository } from "../repositories/futuro-corte.repository";
import { routes } from "../routes";
import { AuthService } from "../services/auth.service";

describe("Futuros cortes - endpoints", () => {
  const app = Fastify();
  const contatoRepository = new ContatoRepository();
  const hoje = Temporal.Now.plainDateISO("America/Sao_Paulo");
  const dia = (dias: number) => hoje.add({ days: dias }).toString();

  let cidadeId: string;
  let contatoId: string;
  let diaRotaId: string | null = null;

  async function chamar(
    method: "GET" | "POST" | "PATCH",
    url: string,
    payload?: object,
  ) {
    const resposta = await app.inject({
      method,
      url,
      headers: { authorization: "Bearer teste" },
      ...(payload !== undefined ? { payload } : {}),
    });

    return { status: resposta.statusCode, body: resposta.json() };
  }

  const criar = (dados: object = {}) =>
    chamar("POST", `/contatos/${contatoId}/futuros-cortes`, {
      dataProximoContato: dia(0),
      ...dados,
    });

  const listarCidade = async (query = "") =>
    (await chamar("GET", `/futuros-cortes?cidadeId=${cidadeId}${query}`)).body;

  async function criarRota() {
    // Data aleatória distante: dias_rota.data é única.
    const rota = await db.orm.public.DiaRota.create({
      data: hoje.add({ days: 5000 + Math.floor(Math.random() * 50000) }),
      partidaCidadeId: cidadeId,
    });

    diaRotaId = rota.id;
    return rota.id;
  }

  const compra = (dataCorte: string) =>
    chamar("POST", `/contatos/${contatoId}/compras`, {
      dataCorte,
      valorPago: "1000.00",
      formaPagamento: "Pix",
    });

  beforeAll(async () => {
    vi.spyOn(AuthService.prototype, "validarToken").mockResolvedValue({
      tipo: "sucesso",
      dados: { id: randomUUID() },
    });

    await app.register(routes);
    await app.ready();
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await app.close();
  });

  beforeEach(async () => {
    const cidade = await db.orm.public.Cidade.create({
      nome: `Cidade Teste ${randomUUID()}`,
      uf: "SC",
      lat: null,
      lng: null,
    });

    cidadeId = cidade.id;

    const contato = await contatoRepository.create({
      nome: "Cliente Futuro Corte",
      cidadeId,
      telefone: null,
      endereco: null,
      lat: null,
      lng: null,
      geoFonte: null,
      geoPlaceId: null,
      origem: null,
      indicadoPor: null,
      dataPrimeiroContato: null,
      dataAvaliacao: null,
      natural: true,
      autorizouFoto: false,
      cor: "Castanho",
      textura: "Liso",
      quimica: "Nenhuma",
      comprimentoCm: 50,
      observacoes: null,
    });

    contatoId = contato.id;
  });

  afterEach(async () => {
    await contatoRepository.hardDelete(contatoId);

    if (diaRotaId) {
      await db.orm.public.DiaRota.where({ id: diaRotaId }).delete();
      diaRotaId = null;
    }

    await db.orm.public.Cidade.where({ id: cidadeId }).delete();
  });

  it("exige autenticação", async () => {
    const resposta = await app.inject({
      method: "POST",
      url: `/contatos/${contatoId}/futuros-cortes`,
      payload: {},
    });

    expect(resposta.statusCode).toBe(401);
  });

  it("cria com padrões, sem alterar o status do contato", async () => {
    const { status, body } = await criar({ dataPrevista: dia(60) });

    expect(status).toBe(201);
    expect(body).toMatchObject({
      prioridade: "media",
      status: "acompanhando",
      dataProximoContato: dia(0),
      diasParaContato: 0,
      situacaoContato: "hoje",
      prontoParaContato: true,
    });

    const contato = await contatoRepository.findById(contatoId);
    expect(contato?.status).toBe("lead");
  });

  it("rejeita segundo ativo, mas aceita após descartar", async () => {
    const primeiro = await criar();

    expect((await criar()).status).toBe(409);

    const descartado = await chamar(
      "POST",
      `/futuros-cortes/${primeiro.body.id}/descartar`,
    );
    expect(descartado.body).toMatchObject({
      status: "descartado",
      diasParaContato: null,
      situacaoContato: null,
      prontoParaContato: null,
    });

    expect((await criar()).status).toBe(201);

    const historico = await chamar("GET", `/contatos/${contatoId}/futuros-cortes`);
    expect(historico.body).toHaveLength(2);
  });

  it("o banco impede dois ativos em requisições simultâneas", async () => {
    vi.spyOn(
      FuturoCorteRepository.prototype,
      "findAtivoByContatoId",
    ).mockResolvedValue(null);

    const respostas = await Promise.all([criar(), criar(), criar()]);

    expect(respostas.map((r) => r.status).sort()).toEqual([201, 409, 409]);
    vi.mocked(FuturoCorteRepository.prototype.findAtivoByContatoId).mockRestore();
  });

  it("valida dados, ids e filtros", async () => {
    expect((await criar({ dataProximoContato: "2026-02-31" })).status).toBe(400);
    expect((await criar({ dataProximoContato: undefined })).status).toBe(400);
    expect((await criar({ comprimentoAtualCm: -1 })).status).toBe(400);
    expect((await criar({ prioridade: "urgente" })).status).toBe(400);
    expect((await chamar("PATCH", "/futuros-cortes/abc", { cor: "Loiro" })).status).toBe(400);
    expect((await chamar("GET", "/futuros-cortes?situacao=xyz")).status).toBe(400);
    expect((await chamar("GET", "/futuros-cortes?comprimentoMin=60&comprimentoMax=50")).status).toBe(400);
    expect((await chamar("GET", `/contatos/${randomUUID()}/futuros-cortes`)).status).toBe(404);
    expect((await chamar("PATCH", `/futuros-cortes/${randomUUID()}`, { cor: "Loiro" })).status).toBe(404);
  });

  it("edita, limpa campos com null e ignora status no PATCH", async () => {
    const { body } = await criar({ cor: "Castanho", natural: true });
    const url = `/futuros-cortes/${body.id}`;

    const editado = await chamar("PATCH", url, {
      cor: null,
      dataProximoContato: dia(-4),
      status: "convertido",
    });

    expect(editado.body).toMatchObject({
      cor: null,
      natural: true,
      status: "acompanhando",
      diasParaContato: -4,
      situacaoContato: "atrasado",
    });

    expect((await chamar("PATCH", url, {})).status).toBe(400);

    await chamar("POST", `${url}/converter`);
    expect((await chamar("PATCH", url, { cor: "Loiro" })).status).toBe(409);
    expect((await chamar("POST", `${url}/descartar`)).status).toBe(409);
  });

  it("marca como contatada com nova data e observação", async () => {
    const { body } = await criar({ observacoes: "Inicial" });
    const url = `/futuros-cortes/${body.id}/contatado`;

    expect((await chamar("POST", url, {})).status).toBe(400);
    expect((await chamar("POST", url, { dataProximoContato: dia(-1) })).status).toBe(400);

    const resposta = await chamar("POST", url, {
      dataProximoContato: dia(90),
      observacao: "Pediu para esperar",
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body.diasParaContato).toBe(90);
    expect(resposta.body.ultimoContatoEm).toBeTruthy();
    expect(resposta.body.observacoes).toMatch(
      /^Inicial\n\[\d{2}\/\d{2}\/\d{4}\] Pediu para esperar$/,
    );
  });

  it("agenda pelo fluxo existente e volta a acompanhar se contatada", async () => {
    const { body } = await criar();
    const rotaId = await criarRota();
    const url = `/futuros-cortes/${body.id}`;

    expect(
      (await chamar("POST", `${url}/agendar-avaliacao`, { diaRotaId: randomUUID() })).status,
    ).toBe(404);

    const agendado = await chamar("POST", `${url}/agendar-avaliacao`, {
      diaRotaId: rotaId,
      hora: "10:30",
    });

    expect(agendado.status).toBe(201);
    expect(agendado.body.futuroCorte).toMatchObject({
      status: "agendado",
      prontoParaContato: null,
    });
    expect(agendado.body.visita.contatoId).toBe(contatoId);

    const [salvo] = (await chamar("GET", `/contatos/${contatoId}/futuros-cortes`)).body;
    expect(salvo.status).toBe("agendado");

    // Status do contato muda apenas pelo fluxo de visita já existente.
    expect((await contatoRepository.findById(contatoId))?.status).toBe("avaliacao_agendada");

    const contatado = await chamar("POST", `${url}/contatado`, {
      dataProximoContato: dia(10),
    });
    expect(contatado.body.status).toBe("acompanhando");
  });

  it("contato perdido não agenda e nada é alterado", async () => {
    const { body } = await criar();
    await contatoRepository.updateStatus(contatoId, "perdido", "Teste");

    const resposta = await chamar(
      "POST",
      `/futuros-cortes/${body.id}/agendar-avaliacao`,
      { diaRotaId: await criarRota() },
    );

    expect(resposta.status).toBe(409);
    expect((await listarCidade())[0].status).toBe("acompanhando");
  });

  it("compra converte o ativo; compra retroativa não", async () => {
    await criar();

    expect((await compra(dia(-10))).status).toBe(201);
    expect((await listarCidade())[0].status).toBe("acompanhando");

    expect((await compra(dia(0))).status).toBe(201);
    expect(await listarCidade()).toEqual([]);
    expect(await listarCidade("&status=convertido")).toHaveLength(1);

    // Cliente que já comprou pode ter novo futuro corte.
    expect((await criar()).status).toBe(201);
  });

  it("filtra a listagem", async () => {
    await criar({
      dataProximoContato: dia(5),
      cor: "Loiro",
      textura: "Liso",
      natural: true,
      prioridade: "alta",
      comprimentoAtualCm: 55,
    });

    for (const query of [
      "",
      "&situacao=em_breve",
      "&situacao=proximos_30_dias",
      "&prioridade=alta",
      "&status=acompanhando",
      "&cor=loiro",
      "&textura=Liso",
      "&natural=true",
      "&comprimentoMin=55&comprimentoMax=55",
    ]) {
      expect(await listarCidade(query), query).toHaveLength(1);
    }

    for (const query of [
      "&situacao=atrasado",
      "&situacao=hoje",
      "&prioridade=baixa",
      "&status=agendado",
      "&cor=Preto",
      "&natural=false",
      "&comprimentoMin=56",
      "&comprimentoMax=54",
    ]) {
      expect(await listarCidade(query), query).toHaveLength(0);
    }

    const [item] = await listarCidade();
    expect(item.contato.cidade.id).toBe(cidadeId);
  });

  it("não lista contatos excluídos", async () => {
    const { body } = await criar();
    await contatoRepository.softDelete(contatoId);

    expect(await listarCidade()).toEqual([]);
    expect((await chamar("POST", `/futuros-cortes/${body.id}/converter`)).status).toBe(404);
  });

  it("inclui o resumo no painel", async () => {
    const antes = (await chamar("GET", "/painel/resumo")).body.futurosCortes;
    await criar({ dataProximoContato: dia(-3) });
    const depois = (await chamar("GET", "/painel/resumo")).body.futurosCortes;

    expect(depois).toEqual({
      totalAtivos: antes.totalAtivos + 1,
      proximos30Dias: antes.proximos30Dias + 1,
    });
  });
});
