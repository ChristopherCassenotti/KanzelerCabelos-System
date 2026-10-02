import type { RegistrarCompraInput } from "../schemas/compra.schema";
import type { RegistrarCompraModel } from "../models/compra.model";
import { CompraRepository } from "../repositories/compra.repository";
import { ContatoRepository } from "../repositories/contato.repository";

export class CompraService {
  constructor(
    private readonly compraRepository = new CompraRepository(),
    private readonly contatoRepository = new ContatoRepository(),
  ) {}

  async registrar(
    contatoId: string,
    data: RegistrarCompraInput,
  ) {
    const compra: RegistrarCompraModel = {
      contatoId,
      dataCorte: data.dataCorte,
      valorPago: data.valorPago,
      formaPagamento: data.formaPagamento,

      ...(data.pesoG !== undefined
        ? { pesoG: data.pesoG }
        : {}),

      ...(data.comprimentoCm !== undefined
        ? { comprimentoCm: data.comprimentoCm }
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

    return this.compraRepository.registrar(compra);
  }

    async findByContatoId(contatoId: string) {
      const contato = await this.contatoRepository.findById(contatoId);

      if (!contato) {
        return null;
      }

      return this.compraRepository.findByContatoId(contatoId);
    }
}

