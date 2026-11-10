/**
 * Proteções em memória do assistente: limite de chamadas por usuário e
 * idempotência do cadastro confirmado.
 *
 * Ambas são por processo. Em implantação com várias instâncias, mover para
 * um armazenamento compartilhado (ex.: Redis ou tabela própria).
 */

export class LimiteUsoExcedidoError extends Error {
  constructor(readonly retryAfterSegundos: number) {
    super("Limite de uso do assistente excedido");
    this.name = "LimiteUsoExcedidoError";
  }
}

export interface JanelaLimite {
  /** Duração da janela em milissegundos. */
  janelaMs: number;
  maximo: number;
}

export class LimitadorPorUsuario {
  private readonly registros = new Map<string, number[]>();

  constructor(
    private readonly janelas: JanelaLimite[],
    private readonly agora: () => number = Date.now,
  ) {}

  consumir(chave: string) {
    const agora = this.agora();
    const maiorJanela = Math.max(
      ...this.janelas.map((janela) => janela.janelaMs),
    );

    const recentes = (this.registros.get(chave) ?? []).filter(
      (instante) => agora - instante < maiorJanela,
    );

    for (const janela of this.janelas) {
      const naJanela = recentes.filter(
        (instante) => agora - instante < janela.janelaMs,
      );

      if (naJanela.length >= janela.maximo) {
        const maisAntigo = naJanela[0] ?? agora;

        throw new LimiteUsoExcedidoError(
          Math.max(
            1,
            Math.ceil((maisAntigo + janela.janelaMs - agora) / 1000),
          ),
        );
      }
    }

    recentes.push(agora);
    this.registros.set(chave, recentes);

    if (this.registros.size > 5000) {
      this.limpar(agora, maiorJanela);
    }
  }

  private limpar(agora: number, maiorJanela: number) {
    for (const [chave, instantes] of this.registros) {
      if (instantes.every((instante) => agora - instante >= maiorJanela)) {
        this.registros.delete(chave);
      }
    }
  }
}

export class ChaveIdempotenciaConflitoError extends Error {
  constructor() {
    super(
      "Esta chave de idempotência já foi usada com outros dados",
    );
    this.name = "ChaveIdempotenciaConflitoError";
  }
}

interface EntradaIdempotencia<T> {
  impressao: string;
  promessa: Promise<T>;
  concluido: boolean;
  expiraEm: number;
}

/**
 * Garante que a mesma tentativa (usuário + chave) execute a operação no
 * máximo uma vez. Chamadas concorrentes ou repetidas recebem o mesmo
 * resultado. Falhas liberam a chave para nova tentativa.
 */
export class RegistroIdempotencia<T> {
  private readonly entradas = new Map<string, EntradaIdempotencia<T>>();

  constructor(
    private readonly ttlMs = 24 * 60 * 60 * 1000,
    private readonly agora: () => number = Date.now,
  ) {}

  async executar(
    chave: string,
    impressao: string,
    operacao: () => Promise<T>,
  ): Promise<{ resultado: T; reaproveitado: boolean }> {
    this.removerExpiradas();

    const existente = this.entradas.get(chave);

    if (existente) {
      if (existente.impressao !== impressao) {
        throw new ChaveIdempotenciaConflitoError();
      }

      return {
        resultado: await existente.promessa,
        reaproveitado: true,
      };
    }

    const entrada: EntradaIdempotencia<T> = {
      impressao,
      promessa: operacao(),
      concluido: false,
      expiraEm: this.agora() + this.ttlMs,
    };

    this.entradas.set(chave, entrada);

    try {
      const resultado = await entrada.promessa;
      entrada.concluido = true;

      return {
        resultado,
        reaproveitado: false,
      };
    } catch (error) {
      this.entradas.delete(chave);
      throw error;
    }
  }

  private removerExpiradas() {
    const agora = this.agora();

    for (const [chave, entrada] of this.entradas) {
      if (entrada.concluido && entrada.expiraEm <= agora) {
        this.entradas.delete(chave);
      }
    }
  }
}
