import "temporal-polyfill/full/global";

import type {
  CampoRemovivel,
  CamposInterpretados,
  RascunhoContato,
} from "../schemas/assistente.schema";
import type { DadosCompraInput } from "../schemas/compra.schema";
import type { CriarContatoInput } from "../schemas/contato.schema";

export type CampoPendente =
  | "nome"
  | "cidade"
  | "valorPago"
  | "formaPagamento";

const VALOR_MAXIMO_REAIS = 1_000_000;
const PESO_MAXIMO_G = 20_000;

export interface ResultadoAplicacao {
  rascunho: RascunhoContato;
  avisos: string[];
  cidadeAlterada: boolean;
}

const LIMITES_TEXTO = {
  nome: 150,
  endereco: 250,
  indicadoPor: 150,
  observacoes: 3000,
} as const;

export function criarRascunhoVazio(): RascunhoContato {
  return {
    nome: null,
    telefone: null,
    cidadeId: null,
    cidadeNome: null,
    cidadeUf: null,
    endereco: null,
    origem: null,
    indicadoPor: null,
    dataPrimeiroContato: null,
    dataAvaliacao: null,
    natural: null,
    cor: null,
    textura: null,
    quimica: null,
    comprimentoCm: null,
    observacoes: null,
    autorizouFoto: false,
    dataCorte: null,
    pesoG: null,
    valorPago: null,
    formaPagamento: null,
    valorRevenda: null,
    dataRevenda: null,
    comprador: null,
  };
}

/** Converte reais (número) para o formato da API ("1850.00"). */
export function normalizarValorReais(valor: number) {
  if (!Number.isFinite(valor) || valor <= 0 || valor > VALOR_MAXIMO_REAIS) {
    return null;
  }

  return (Math.round(valor * 100) / 100).toFixed(2);
}

function textoLimpo(
  valor: string | null,
  max: number,
) {
  if (valor === null) return null;

  const limpo = valor.replace(/\s+/g, " ").trim();

  if (limpo.length === 0) return null;

  return limpo.slice(0, max);
}

export function normalizarTelefone(valor: string) {
  const digitos = valor.replace(/\D/g, "");

  // 10/11 dígitos (DDD + número) ou com DDI 55 na frente.
  if (digitos.length >= 10 && digitos.length <= 13) {
    return digitos;
  }

  return null;
}

export function validarDataISO(valor: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;

  try {
    return Temporal.PlainDate.from(valor, {
      overflow: "reject",
    }).toString();
  } catch {
    return null;
  }
}

/**
 * Mescla os campos interpretados pela IA no rascunho atual. Apenas campos
 * informados (não nulos) sobrescrevem valores; o restante é preservado.
 * `autorizouFoto` não vem do texto: é definido na confirmação pelo envio de fotos.
 */
export function aplicarInterpretacao(
  atual: RascunhoContato,
  campos: CamposInterpretados,
  camposRemovidos: readonly CampoRemovivel[],
  /** Hoje em America/Sao_Paulo (YYYY-MM-DD): o corte não pode ser futuro. */
  hoje: string,
): ResultadoAplicacao {
  const rascunho: RascunhoContato = { ...atual };
  const avisos: string[] = [];
  let cidadeAlterada = false;

  for (const campo of camposRemovidos) {
    rascunho[campo] = null;
  }

  const nome = textoLimpo(campos.nome, LIMITES_TEXTO.nome);

  if (nome !== null) {
    if (nome.length >= 2) {
      rascunho.nome = nome;
    } else {
      avisos.push("O nome informado é muito curto.");
    }
  }

  if (campos.telefone !== null) {
    const telefone = normalizarTelefone(campos.telefone);

    if (telefone) {
      rascunho.telefone = telefone;
    } else {
      avisos.push(
        "O telefone informado não parece válido (use DDD + número) e não foi incluído.",
      );
    }
  }

  const cidade = textoLimpo(campos.cidade, 120);

  if (cidade !== null) {
    const uf = textoLimpo(campos.uf, 2)?.toUpperCase() ?? null;

    const mudou =
      cidade !== rascunho.cidadeNome ||
      uf !== rascunho.cidadeUf ||
      rascunho.cidadeId === null;

    if (mudou) {
      rascunho.cidadeNome = cidade;
      rascunho.cidadeUf = uf && /^[A-Z]{2}$/.test(uf) ? uf : null;
      rascunho.cidadeId = null;
      cidadeAlterada = true;
    }
  }

  const endereco = textoLimpo(campos.endereco, LIMITES_TEXTO.endereco);
  if (endereco !== null) rascunho.endereco = endereco;

  if (campos.origem !== null) rascunho.origem = campos.origem;

  const indicadoPor = textoLimpo(
    campos.indicadoPor,
    LIMITES_TEXTO.indicadoPor,
  );
  if (indicadoPor !== null) rascunho.indicadoPor = indicadoPor;

  for (const campoData of [
    "dataPrimeiroContato",
    "dataAvaliacao",
  ] as const) {
    const valor = campos[campoData];

    if (valor === null) continue;

    const data = validarDataISO(valor.trim());

    if (data) {
      rascunho[campoData] = data;
    } else {
      avisos.push(
        campoData === "dataAvaliacao"
          ? "A data de avaliação não foi reconhecida e não foi incluída."
          : "A data do primeiro contato não foi reconhecida e não foi incluída.",
      );
    }
  }

  if (campos.natural !== null) rascunho.natural = campos.natural;
  if (campos.cor !== null) rascunho.cor = campos.cor;
  if (campos.textura !== null) rascunho.textura = campos.textura;
  if (campos.quimica !== null) rascunho.quimica = campos.quimica;

  if (campos.comprimentoCm !== null) {
    const comprimento = Math.round(campos.comprimentoCm);

    if (
      Number.isFinite(comprimento) &&
      comprimento > 0 &&
      comprimento <= 300
    ) {
      rascunho.comprimentoCm = comprimento;
    } else {
      avisos.push(
        "O comprimento informado não é válido e não foi incluído.",
      );
    }
  }

  const observacoes = textoLimpo(
    campos.observacoes,
    LIMITES_TEXTO.observacoes,
  );
  if (observacoes !== null) rascunho.observacoes = observacoes;

  aplicarCompra(rascunho, campos, avisos, hoje);

  return {
    rascunho,
    avisos,
    cidadeAlterada,
  };
}

function aplicarCompra(
  rascunho: RascunhoContato,
  campos: CamposInterpretados,
  avisos: string[],
  hoje: string,
) {
  if (campos.dataCorte !== null) {
    const data = validarDataISO(campos.dataCorte.trim());

    if (data && data <= hoje) {
      rascunho.dataCorte = data;
    } else {
      avisos.push(
        data
          ? "A data do corte não pode ser futura e não foi incluída."
          : "A data do corte não foi reconhecida e não foi incluída.",
      );
    }
  }

  if (campos.pesoG !== null) {
    const peso = Math.round(campos.pesoG);

    if (Number.isFinite(peso) && peso > 0 && peso <= PESO_MAXIMO_G) {
      rascunho.pesoG = peso;
    } else {
      avisos.push("O peso informado não é válido e não foi incluído.");
    }
  }

  if (campos.valorPago !== null) {
    const valor = normalizarValorReais(campos.valorPago);

    if (valor) {
      rascunho.valorPago = valor;
    } else {
      avisos.push("O valor pago não é válido e não foi incluído.");
    }
  }

  if (campos.formaPagamento !== null) {
    rascunho.formaPagamento = campos.formaPagamento;
  }

  if (campos.valorRevenda !== null) {
    const valor = normalizarValorReais(campos.valorRevenda);

    if (valor) {
      rascunho.valorRevenda = valor;
    } else {
      avisos.push("O valor de revenda não é válido e não foi incluído.");
    }
  }

  if (campos.dataRevenda !== null) {
    const data = validarDataISO(campos.dataRevenda.trim());

    if (data) {
      rascunho.dataRevenda = data;
    } else {
      avisos.push("A data da revenda não foi reconhecida e não foi incluída.");
    }
  }

  const comprador = textoLimpo(campos.comprador, 150);
  if (comprador !== null) rascunho.comprador = comprador;
}

export function calcularPendencias(
  rascunho: RascunhoContato,
): CampoPendente[] {
  const pendencias: CampoPendente[] = [];

  if (!rascunho.nome || rascunho.nome.trim().length < 2) {
    pendencias.push("nome");
  }

  if (!rascunho.cidadeId) {
    pendencias.push("cidade");
  }

  if (!rascunho.valorPago) {
    pendencias.push("valorPago");
  }

  if (!rascunho.formaPagamento) {
    pendencias.push("formaPagamento");
  }

  return pendencias;
}

export function rascunhoTemDados(rascunho: RascunhoContato) {
  const vazio = criarRascunhoVazio();

  return (Object.keys(vazio) as Array<keyof RascunhoContato>).some(
    (campo) => rascunho[campo] !== vazio[campo],
  );
}

/**
 * Converte o rascunho no payload aceito por `criarContatoSchema`, omitindo
 * campos não informados para que os padrões do `ContatoService` valham
 * (status inicial, data do primeiro contato = hoje em America/Sao_Paulo).
 */
export function rascunhoParaCriarContato(
  rascunho: RascunhoContato,
): Partial<CriarContatoInput> {
  const payload: Partial<CriarContatoInput> = {};

  if (rascunho.nome !== null) payload.nome = rascunho.nome;
  if (rascunho.cidadeId !== null) payload.cidadeId = rascunho.cidadeId;
  if (rascunho.telefone !== null) payload.telefone = rascunho.telefone;
  if (rascunho.endereco !== null) payload.endereco = rascunho.endereco;
  if (rascunho.origem !== null) payload.origem = rascunho.origem;
  if (rascunho.indicadoPor !== null) payload.indicadoPor = rascunho.indicadoPor;
  if (rascunho.dataPrimeiroContato !== null) {
    payload.dataPrimeiroContato = rascunho.dataPrimeiroContato;
  }
  if (rascunho.dataAvaliacao !== null) {
    payload.dataAvaliacao = rascunho.dataAvaliacao;
  }
  if (rascunho.natural !== null) payload.natural = rascunho.natural;
  if (rascunho.cor !== null) payload.cor = rascunho.cor;
  if (rascunho.textura !== null) payload.textura = rascunho.textura;
  if (rascunho.quimica !== null) payload.quimica = rascunho.quimica;
  if (rascunho.comprimentoCm !== null) {
    payload.comprimentoCm = rascunho.comprimentoCm;
  }
  if (rascunho.observacoes !== null) payload.observacoes = rascunho.observacoes;

  payload.autorizouFoto = rascunho.autorizouFoto;

  return payload;
}

/**
 * Converte o rascunho no payload de `criarContatoComCompraSchema`. A data
 * do corte não informada é hoje (America/Sao_Paulo).
 */
export function rascunhoParaCadastroComCompra(
  rascunho: RascunhoContato,
  hoje: string,
): {
  contato: Partial<CriarContatoInput>;
  compra: Partial<DadosCompraInput>;
} {
  const compra: Partial<DadosCompraInput> = {
    dataCorte: rascunho.dataCorte ?? hoje,
  };

  if (rascunho.valorPago !== null) compra.valorPago = rascunho.valorPago;
  if (rascunho.formaPagamento !== null) {
    compra.formaPagamento = rascunho.formaPagamento;
  }
  if (rascunho.pesoG !== null) compra.pesoG = rascunho.pesoG;
  if (rascunho.valorRevenda !== null) compra.valorRevenda = rascunho.valorRevenda;
  if (rascunho.dataRevenda !== null) compra.dataRevenda = rascunho.dataRevenda;
  if (rascunho.comprador !== null) compra.comprador = rascunho.comprador;

  // Cor, textura, química e comprimento da compra herdam os do contato
  // (mesma regra do registro de compra existente).
  return {
    contato: rascunhoParaCriarContato(rascunho),
    compra,
  };
}

/** Visão do rascunho enviada ao modelo: sem IDs internos. */
export function rascunhoParaContextoIA(
  rascunho: RascunhoContato | null,
) {
  if (!rascunho) return null;

  const { cidadeId: _cidadeId, ...semIds } = rascunho;

  return {
    ...semIds,
    cidadeConfirmada: rascunho.cidadeId !== null,
  };
}
