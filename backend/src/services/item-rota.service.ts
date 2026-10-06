import type { ConcluirItemRotaInput } from "../schemas/concluir-item-rota.schema";
import { ItemRotaRepository } from "../repositories/item-rota.repository";

export class ItemRotaService {
  constructor(
    private readonly itemRotaRepository =
      new ItemRotaRepository(),
  ) {}

  async concluir(
    diaRotaId: string,
    itemId: string,
    data: ConcluirItemRotaInput,
  ) {
    const item =
      await this.itemRotaRepository.findById(
        itemId,
      );

    if (
      !item ||
      item.diaRotaId !== diaRotaId
    ) {
      return {
        tipo: "item_nao_encontrado" as const,
      };
    }

    if (item.concluido) {
      return {
        tipo: "item_ja_concluido" as const,
      };
    }

    if (
      item.tipo === "visita" &&
      data.resultado === undefined
    ) {
      return {
        tipo: "resultado_obrigatorio" as const,
      };
    }

    const resultado =
      item.tipo === "visita"
        ? data.resultado!
        : null;

    const atualizado =
      await this.itemRotaRepository.concluir(
        itemId,
        resultado,
      );

    return {
      tipo: "sucesso" as const,
      item: atualizado,

      exigeRegistroCompra:
        item.tipo === "visita" &&
        resultado === "comprou",
    };
  }

  async remover(
      diaRotaId: string,
      itemId: string,
    ) {
      const item =
        await this.itemRotaRepository.findById(
          itemId,
        );
    
      if (
        !item ||
        item.diaRotaId !== diaRotaId
      ) {
        return {
          tipo: "item_nao_encontrado" as const,
        };
      }
  
      await this.itemRotaRepository.delete(
        itemId,
      );
  
      return {
        tipo: "sucesso" as const,
      };
    }
}