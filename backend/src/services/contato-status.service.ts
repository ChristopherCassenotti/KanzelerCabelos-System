import { ContatoRepository } from "../repositories/contato.repository";

import {
  podeAlterarStatus,
  type StatusContato,
} from "./contato-status.rules";

export class ContatoStatusService {
  constructor(
    private readonly contatoRepository =
      new ContatoRepository(),
  ) {}

  async alterar(
    contatoId: string,
    novoStatus: StatusContato,
    motivoPerda?: string,
  ) {
    const contato =
      await this.contatoRepository.findById(
        contatoId,
      );

    if (!contato) {
      return {
        tipo: "nao_encontrado" as const,
      };
    }

    const statusAtual =
      contato.status as StatusContato;

    if (
      !podeAlterarStatus(
        statusAtual,
        novoStatus,
      )
    ) {
      return {
        tipo: "transicao_invalida" as const,
        statusAtual,
        novoStatus,
      };
    }

    if (
      novoStatus === "perdido" &&
      !motivoPerda?.trim()
    ) {
      return {
        tipo: "motivo_obrigatorio" as const,
      };
    }

    const atualizado =
      await this.contatoRepository.updateStatus(
        contatoId,
        novoStatus,

        novoStatus === "perdido"
          ? motivoPerda!.trim()
          : null,
      );

    return {
      tipo: "sucesso" as const,
      contato: atualizado,
    };
  }
}