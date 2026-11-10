import "temporal-polyfill/full/global";

import { lerConfiguracaoAssistente } from "../config/openai";
import { ContatoRepository } from "../repositories/contato.repository";
import { AuditoriaRepository } from "../repositories/auditoria.repository";
import {
  LIMITE_HISTORICO,
  type AssistenteMensagemInput,
  type ConfirmarContatoAssistenteInput,
  type InterpretacaoIA,
  type MensagemHistorico,
  type RascunhoContato,
} from "../schemas/assistente.schema";
import { criarContatoComCompraSchema } from "../schemas/contato.schema";
import { AssistenteError } from "./assistente.errors";
import {
  OpenAIInterpretadorService,
  type InterpretadorMensagem,
} from "./assistente-interpretador.service";
import {
  ChaveIdempotenciaConflitoError,
  LimitadorPorUsuario,
  LimiteUsoExcedidoError,
  RegistroIdempotencia,
} from "./assistente-protecao";
import {
  aplicarInterpretacao,
  calcularPendencias,
  criarRascunhoVazio,
  rascunhoParaContextoIA,
  rascunhoParaCadastroComCompra,
  rascunhoTemDados,
  type CampoPendente,
} from "./assistente-rascunho.rules";
import {
  CidadeService,
  normalizarNomeCidade,
  type CidadeResumo,
} from "./cidade.service";
import { ContatoService } from "./contato.service";

export type EstadoAssistente =
  | "coletando_dados"
  | "escolher_cidade"
  | "aguardando_confirmacao"
  | "cancelado"
  | "fora_do_escopo"
  | "ajuda";

export interface PossivelDuplicado {
  id: string;
  nome: string;
  telefone: string | null;
  cidade: {
    nome: string;
    uf: string;
  } | null;
  motivo: "telefone" | "nome_cidade";
}

export interface RespostaAssistente {
  resposta: string;
  estado: EstadoAssistente;
  rascunho: RascunhoContato | null;
  pendencias: CampoPendente[];
  cidadeOpcoes: CidadeResumo[];
  possiveisDuplicados: PossivelDuplicado[];
  avisos: string[];
}

export interface CadastroAssistente {
  contato: {
    id: string;
    nome: string;
    status: string;
    cidade: CidadeResumo;
  };
  compra: {
    id: string;
    dataCorte: string;
    valorPago: string;
  };
}

export interface ContatoCriadoAssistente extends CadastroAssistente {
  reaproveitado: boolean;
}

function hojeSaoPaulo() {
  return Temporal.Now.plainDateISO("America/Sao_Paulo").toString();
}

const ROTULOS_PENDENCIA: Record<CampoPendente, string> = {
  nome: "o nome",
  cidade: "a cidade",
  valorPago: "o valor pago",
  formaPagamento: "a forma de pagamento (Pix ou dinheiro)",
};

function listarEmPortugues(itens: string[]) {
  return itens.length <= 1
    ? (itens[0] ?? "")
    : `${itens.slice(0, -1).join(", ")} e ${itens.at(-1)}`;
}

const LIMITE_TEXTO_HISTORICO_IA = 600;

const MENSAGEM_FORA_ESCOPO =
  "Por enquanto eu consigo apenas cadastrar novas clientes junto com a compra do cabelo. " +
  "Para editar, excluir, mudar status, registrar compra de cliente já cadastrada ou agendar visitas, use as telas do sistema.";

const MENSAGEM_AJUDA =
  "Eu cadastro a cliente junto com a compra do cabelo a partir de uma mensagem. Exemplo: " +
  "\"Comprei o cabelo da Juliana Ferreira, de União da Vitória, telefone 42999998888, castanho, natural, 60 cm, 420 g, paguei 1.850 no Pix\". " +
  "São obrigatórios: nome, cidade, valor pago e forma de pagamento (a data do corte é hoje, se não for informada). Antes de salvar, eu mostro um resumo para você confirmar.";

function nomeCurto(nome: string | null) {
  return nome?.split(" ")[0] ?? "contato";
}

function somenteDigitos(valor: string | null | undefined) {
  return (valor ?? "").replace(/\D/g, "");
}

/** Últimos 8 dígitos identificam o número independente de DDI/DDD. */
function chaveTelefone(valor: string | null | undefined) {
  const digitos = somenteDigitos(valor);

  return digitos.length >= 8 ? digitos.slice(-8) : null;
}

export function limitarHistorico(
  historico: MensagemHistorico[],
): MensagemHistorico[] {
  return historico.slice(-LIMITE_HISTORICO).map((item) => ({
    papel: item.papel,
    texto: item.texto.slice(0, LIMITE_TEXTO_HISTORICO_IA),
  }));
}

function impressaoRascunho(rascunho: RascunhoContato) {
  const ordenado = Object.fromEntries(
    Object.entries(rascunho).sort(([a], [b]) => a.localeCompare(b)),
  );

  return JSON.stringify(ordenado);
}

export class AssistenteService {
  constructor(
    private readonly interpretador: InterpretadorMensagem = new OpenAIInterpretadorService(),
    private readonly cidadeService = new CidadeService(),
    private readonly contatoService = new ContatoService(),
    private readonly contatoRepository = new ContatoRepository(),
    private readonly auditoriaRepository = new AuditoriaRepository(),
    private readonly limitadorMensagens = criarLimitadorMensagens(),
    private readonly limitadorConfirmacoes = new LimitadorPorUsuario([
      { janelaMs: 60_000, maximo: 20 },
    ]),
    private readonly idempotencia = new RegistroIdempotencia<CadastroAssistente>(),
  ) {}

  async processarMensagem(
    usuarioId: string,
    input: AssistenteMensagemInput,
  ): Promise<RespostaAssistente> {
    this.consumirLimite(this.limitadorMensagens, usuarioId);

    // O consentimento de fotos só é definido na confirmação (pelas fotos anexadas).
    const rascunhoRecebido = input.rascunho
      ? {
          ...(await this.revalidarCidade(input.rascunho)),
          autorizouFoto: false,
        }
      : null;

    if (input.cidadeEscolhidaId !== undefined) {
      return this.escolherCidade(
        rascunhoRecebido,
        input.cidadeEscolhidaId,
      );
    }

    const mensagem = input.mensagem ?? "";
    const hoje = hojeSaoPaulo();

    const interpretacao = await this.interpretador.interpretar({
      mensagem,
      historico: limitarHistorico(input.historico),
      rascunho: rascunhoParaContextoIA(rascunhoRecebido),
      hoje,
      usuarioId,
    });

    return this.aplicarIntencao(
      rascunhoRecebido,
      interpretacao,
      hoje,
    );
  }

  async confirmarContato(
    usuarioId: string,
    input: ConfirmarContatoAssistenteInput,
  ): Promise<ContatoCriadoAssistente> {
    this.consumirLimite(this.limitadorConfirmacoes, usuarioId);

    // Enviar fotos junto do cadastro é o consentimento; sem fotos, sem consentimento.
    const rascunho: RascunhoContato = {
      ...input.rascunho,
      autorizouFoto: input.quantidadeFotos > 0,
    };

    try {
      const { resultado, reaproveitado } =
        await this.idempotencia.executar(
          `${usuarioId}:${input.idempotencyKey}`,
          impressaoRascunho(rascunho),
          () =>
            this.criarContato(
              usuarioId,
              rascunho,
              input.ignorarDuplicidade,
            ),
        );

      return {
        ...resultado,
        reaproveitado,
      };
    } catch (error) {
      if (error instanceof ChaveIdempotenciaConflitoError) {
        throw new AssistenteError(
          "chave_reutilizada",
          "Esta confirmação já foi usada com outros dados. Revise o resumo e confirme novamente.",
          409,
        );
      }

      throw error;
    }
  }

  private async criarContato(
    usuarioId: string,
    rascunho: RascunhoContato,
    ignorarDuplicidade: boolean,
  ): Promise<CadastroAssistente> {
    const cidade = rascunho.cidadeId
      ? await this.cidadeService.findById(rascunho.cidadeId)
      : null;

    if (!cidade) {
      throw new AssistenteError(
        "cidade_invalida",
        "A cidade do contato não foi encontrada no cadastro. Informe uma cidade válida.",
        422,
      );
    }

    const validado = criarContatoComCompraSchema.safeParse(
      rascunhoParaCadastroComCompra(rascunho, hojeSaoPaulo()),
    );

    if (!validado.success) {
      throw new AssistenteError(
        "dados_invalidos",
        "Os dados do contato ou da compra são inválidos. Revise as informações.",
        400,
        validado.error.flatten(),
      );
    }

    if (!ignorarDuplicidade) {
      const duplicados = await this.buscarPossiveisDuplicados(rascunho);

      if (duplicados.length > 0) {
        throw new AssistenteError(
          "possivel_duplicidade",
          "Encontrei contatos parecidos já cadastrados. Confira antes de criar outro.",
          409,
          { possiveisDuplicados: duplicados },
        );
      }
    }

    // Contato (já "comprado"), compra e auditoria em uma única transação.
    const { contato, compra } = await this.contatoService.createComCompra(
      validado.data,
      usuarioId,
    );

    try {
      await this.auditoriaRepository.create({
        usuarioId,
        acao: "contato_criado_assistente",
        entidade: "contato",
        entidadeId: contato.id,
        detalhes: null,
      });
    } catch {
      // A auditoria não pode desfazer nem mascarar um cadastro já gravado.
      console.warn("assistente: falha ao registrar auditoria do cadastro");
    }

    return {
      contato: {
        id: contato.id,
        nome: contato.nome,
        status: contato.status,
        cidade,
      },
      compra: {
        id: compra.id,
        dataCorte: validado.data.compra.dataCorte,
        valorPago: validado.data.compra.valorPago,
      },
    };
  }

  private consumirLimite(
    limitador: LimitadorPorUsuario,
    usuarioId: string,
  ) {
    try {
      limitador.consumir(usuarioId);
    } catch (error) {
      if (error instanceof LimiteUsoExcedidoError) {
        throw new AssistenteError(
          "limite_excedido",
          "Muitas mensagens em pouco tempo. Aguarde um instante e tente novamente.",
          429,
          { retryAfterSegundos: error.retryAfterSegundos },
        );
      }

      throw error;
    }
  }

  /** O rascunho vem do navegador: a cidadeId precisa existir de verdade. */
  private async revalidarCidade(
    rascunho: RascunhoContato,
  ): Promise<RascunhoContato> {
    if (!rascunho.cidadeId) return rascunho;

    const cidade = await this.cidadeService.findById(rascunho.cidadeId);

    if (!cidade) {
      return {
        ...rascunho,
        cidadeId: null,
      };
    }

    return {
      ...rascunho,
      cidadeId: cidade.id,
      cidadeNome: cidade.nome,
      cidadeUf: cidade.uf,
    };
  }

  private async escolherCidade(
    rascunho: RascunhoContato | null,
    cidadeId: string,
  ): Promise<RespostaAssistente> {
    const cidade = await this.cidadeService.findById(cidadeId);
    const base = rascunho ?? criarRascunhoVazio();

    if (!cidade) {
      return this.montarResposta(
        { ...base, cidadeId: null },
        ["A cidade escolhida não foi encontrada no cadastro."],
        [],
      );
    }

    return this.montarResposta(
      {
        ...base,
        cidadeId: cidade.id,
        cidadeNome: cidade.nome,
        cidadeUf: cidade.uf,
      },
      [],
      [],
    );
  }

  private async aplicarIntencao(
    rascunhoAtual: RascunhoContato | null,
    interpretacao: InterpretacaoIA,
    hoje: string,
  ): Promise<RespostaAssistente> {
    const { intencao, campos, camposRemovidos } = interpretacao;

    if (intencao === "fora_do_escopo") {
      return this.respostaSemAlteracao(
        rascunhoAtual,
        "fora_do_escopo",
        MENSAGEM_FORA_ESCOPO,
      );
    }

    if (intencao === "ajuda") {
      return this.respostaSemAlteracao(
        rascunhoAtual,
        "ajuda",
        MENSAGEM_AJUDA,
      );
    }

    if (intencao === "cancelar") {
      return {
        resposta:
          "Tudo bem, cancelei este cadastro. Nada foi salvo. Quando quiser, é só me dizer quem cadastrar.",
        estado: "cancelado",
        rascunho: null,
        pendencias: [],
        cidadeOpcoes: [],
        possiveisDuplicados: [],
        avisos: [],
      };
    }

    if (intencao === "confirmar") {
      if (!rascunhoAtual) {
        return this.respostaSemAlteracao(null, "ajuda", MENSAGEM_AJUDA);
      }

      const resposta = await this.montarResposta(rascunhoAtual, [], []);

      if (resposta.estado === "aguardando_confirmacao") {
        resposta.resposta =
          "Para salvar, confira o resumo e use o botão \"Confirmar cadastro\".";
      }

      return resposta;
    }

    // Um novo cadastro só descarta o rascunho atual quando traz outro nome.
    const iniciaNovo =
      intencao === "criar_contato" &&
      campos.nome !== null &&
      rascunhoAtual?.nome != null &&
      normalizarNomeCidade(campos.nome) !==
        normalizarNomeCidade(rascunhoAtual.nome);

    const base =
      iniciaNovo || !rascunhoAtual
        ? criarRascunhoVazio()
        : rascunhoAtual;

    const aplicado = aplicarInterpretacao(
      base,
      campos,
      camposRemovidos,
      hoje,
    );

    if (
      !rascunhoTemDados(aplicado.rascunho) &&
      aplicado.avisos.length === 0
    ) {
      return this.respostaSemAlteracao(
        rascunhoAtual,
        "ajuda",
        MENSAGEM_AJUDA,
      );
    }

    let rascunho = aplicado.rascunho;
    const avisos = [...aplicado.avisos];
    let cidadeOpcoes: CidadeResumo[] = [];

    if (aplicado.cidadeAlterada && rascunho.cidadeNome) {
      const resolucao = await this.cidadeService.resolverPorNome(
        rascunho.cidadeNome,
        rascunho.cidadeUf,
      );

      if (resolucao.tipo === "encontrada") {
        rascunho = {
          ...rascunho,
          cidadeId: resolucao.cidade.id,
          cidadeNome: resolucao.cidade.nome,
          cidadeUf: resolucao.cidade.uf,
        };
      } else if (resolucao.tipo === "ambigua") {
        cidadeOpcoes = resolucao.opcoes;
      } else {
        avisos.push(
          `Não encontrei a cidade "${rascunho.cidadeNome}" no cadastro. Informe uma cidade cadastrada.`,
        );

        rascunho = {
          ...rascunho,
          cidadeNome: null,
          cidadeUf: null,
          cidadeId: null,
        };
      }
    }

    return this.montarResposta(rascunho, avisos, cidadeOpcoes);
  }

  private async respostaSemAlteracao(
    rascunho: RascunhoContato | null,
    estado: EstadoAssistente,
    resposta: string,
  ): Promise<RespostaAssistente> {
    const pendencias = rascunho ? calcularPendencias(rascunho) : [];

    return {
      resposta: rascunho
        ? `${resposta} O cadastro em andamento foi mantido.`
        : resposta,
      estado,
      rascunho,
      pendencias,
      cidadeOpcoes: [],
      possiveisDuplicados:
        rascunho && pendencias.length === 0
          ? await this.buscarPossiveisDuplicados(rascunho)
          : [],
      avisos: [],
    };
  }

  private async montarResposta(
    rascunho: RascunhoContato,
    avisos: string[],
    cidadeOpcoes: CidadeResumo[],
  ): Promise<RespostaAssistente> {
    const pendencias = calcularPendencias(rascunho);
    const nome = nomeCurto(rascunho.nome);

    if (cidadeOpcoes.length > 0) {
      return {
        resposta:
          cidadeOpcoes.length === 1
            ? `Você quis dizer ${cidadeOpcoes[0]!.nome} - ${cidadeOpcoes[0]!.uf}? Selecione para confirmar a cidade.`
            : `Encontrei mais de uma cidade para "${rascunho.cidadeNome}". Qual delas?`,
        estado: "escolher_cidade",
        rascunho,
        pendencias,
        cidadeOpcoes,
        possiveisDuplicados: [],
        avisos,
      };
    }

    if (pendencias.length > 0) {
      const pergunta =
        pendencias.length === 1 && pendencias[0] === "cidade" && rascunho.nome
          ? `Qual é a cidade de ${nome}?`
          : pendencias.length === 1 && pendencias[0] === "nome"
            ? "Qual é o nome da cliente?"
            : `Para cadastrar ${rascunho.nome ? nome : "a cliente"} com a compra, ainda falta informar ${listarEmPortugues(
                pendencias.map((campo) => ROTULOS_PENDENCIA[campo]),
              )}.`;

      return {
        resposta: pergunta,
        estado: "coletando_dados",
        rascunho,
        pendencias,
        cidadeOpcoes: [],
        possiveisDuplicados: [],
        avisos,
      };
    }

    const possiveisDuplicados =
      await this.buscarPossiveisDuplicados(rascunho);

    return {
      resposta:
        possiveisDuplicados.length > 0
          ? "Confira os dados. Atenção: encontrei contatos parecidos já cadastrados."
          : "Confira os dados da cliente e da compra. Posso cadastrar?",
      estado: "aguardando_confirmacao",
      rascunho,
      pendencias,
      cidadeOpcoes: [],
      possiveisDuplicados,
      avisos,
    };
  }

  /**
   * Aviso de possível duplicidade: mesmo telefone, ou mesmo nome na mesma
   * cidade. Nunca exclui ou mescla nada automaticamente.
   */
  private async buscarPossiveisDuplicados(
    rascunho: RascunhoContato,
  ): Promise<PossivelDuplicado[]> {
    const telefone = chaveTelefone(rascunho.telefone);
    const nome = normalizarNomeCidade(rascunho.nome);

    if (!telefone && !nome) return [];

    const contatos = await this.contatoRepository.findAllComCidade();
    const encontrados: PossivelDuplicado[] = [];

    for (const contato of contatos) {
      const mesmoTelefone =
        telefone !== null && chaveTelefone(contato.telefone) === telefone;

      const mesmoNomeCidade =
        nome.length > 0 &&
        normalizarNomeCidade(contato.nome) === nome &&
        contato.cidadeId === rascunho.cidadeId;

      if (mesmoTelefone || mesmoNomeCidade) {
        encontrados.push({
          id: contato.id,
          nome: contato.nome,
          telefone: contato.telefone,
          cidade: contato.cidade
            ? { nome: contato.cidade.nome, uf: contato.cidade.uf }
            : null,
          motivo: mesmoTelefone ? "telefone" : "nome_cidade",
        });
      }

      if (encontrados.length >= 5) break;
    }

    return encontrados;
  }
}

function criarLimitadorMensagens() {
  const config = lerConfiguracaoAssistente();

  return new LimitadorPorUsuario([
    { janelaMs: 60_000, maximo: config.limitePorMinuto },
    { janelaMs: 60 * 60_000, maximo: config.limitePorHora },
  ]);
}
