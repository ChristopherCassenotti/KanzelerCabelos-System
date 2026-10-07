import type { RegistrarCompraInput } from "../schemas/compra.schema";
import type { RegistrarCompraModel } from "../models/compra.model";
import { CompraRepository } from "../repositories/compra.repository";
import { ContatoRepository } from "../repositories/contato.repository";
import { ItemRotaRepository } from "../repositories/item-rota.repository";

export class CompraService {
  constructor(
    private readonly compraRepository =
      new CompraRepository(),

    private readonly contatoRepository =
      new ContatoRepository(),

    private readonly itemRotaRepository =
      new ItemRotaRepository(),
  ) {}
  
async registrar(
  contatoId: string,
  data: RegistrarCompraInput,
) {
  if (data.visitaId !== undefined) {
    const visita =
      await this.itemRotaRepository.findById(
        data.visitaId,
      );

    if (
      !visita ||
      visita.tipo !== "visita" ||
      visita.contatoId !== contatoId
    ) {
      return {
        tipo: "visita_invalida" as const,
      };
    }
  }

  const compra: RegistrarCompraModel = {
    contatoId,
    dataCorte: data.dataCorte,
    valorPago: data.valorPago,
    formaPagamento: data.formaPagamento,

    ...(data.visitaId !== undefined
      ? { visitaId: data.visitaId }
      : {}),

    ...(data.pesoG !== undefined
      ? { pesoG: data.pesoG }
      : {}),

    ...(data.comprimentoCm !== undefined
      ? {
          comprimentoCm:
            data.comprimentoCm,
        }
      : {}),

    ...(data.cor !== undefined
      ? { cor: data.cor }
      : {}),

    ...(data.textura !== undefined
      ? { textura: data.textura }
      : {}),

    ...(data.quimica !== undefined
      ? { quimica: data.quimica }
      : {}),
  };

  const registrada =
    await this.compraRepository.registrar(
      compra,
    );

  if (!registrada) {
    return {
      tipo: "contato_nao_encontrado" as const,
    };
  }

  return {
    tipo: "sucesso" as const,
    compra: registrada,
  };
}

    async findByContatoId(contatoId: string) {
      const contato = await this.contatoRepository.findById(contatoId);

      if (!contato) {
        return null;
      }

      return this.compraRepository.findByContatoId(contatoId);
    }
}

