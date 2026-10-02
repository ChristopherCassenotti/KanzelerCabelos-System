import type { CriarContatoInput, AtualizarContatoInput } from "../schemas/contato.schema";
import { ContatoRepository } from "../repositories/contato.repository";
import type { CriarContatoModel, AtualizarContatoModel } from "../models/contato.model";
import { FotoRepository } from "../repositories/foto.repository";
import { StorageService } from "./storage.service";
import { CompraRepository } from "../repositories/compra.repository";
import { RecompraService } from "./recompra.service";

export class ContatoService {
  constructor(
    private readonly contatoRepository = new ContatoRepository(),
    private readonly fotoRepository = new FotoRepository(),
    private readonly compraRepository = new CompraRepository(),
    private readonly storageService = new StorageService(),
    private readonly recompraService = new RecompraService(),
  ) {}

  async create(data: CriarContatoInput) {
    const contato: CriarContatoModel = {
      nome: data.nome,
      cidadeId: data.cidadeId,

      telefone: data.telefone ?? null,
      endereco: data.endereco ?? null,
      origem: data.origem ?? null,

      natural: data.natural ?? null,

      cor: data.cor ?? null,
      textura: data.textura ?? null,
      quimica: data.quimica ?? null,

      comprimentoCm: data.comprimentoCm ?? null,

      observacoes: data.observacoes ?? null,
    };

    return this.contatoRepository.create(contato);
  }

  async findAll() {
    return this.contatoRepository.findAll();
  }

  async findById(id: string) {
    const contato = await this.contatoRepository.findById(id);
  
    if (!contato) {
      return null;
    }
  
    const [fotos, compras, recompra] = await Promise.all([
      this.fotoRepository.findByContatoId(id),
      this.compraRepository.findByContatoId(id),
    
      contato.status === "comprado"
        ? this.recompraService.calcular(
            id,
            contato.cicloRecompraMeses,
          )
        : Promise.resolve(null),
    ]);
  
    const fotosComUrl = await Promise.all(
      fotos.map(async (foto) => ({
        ...foto,
        signedUrl: await this.storageService.createSignedUrl(
          foto.url,
          3600,
        ),
      })),
    );
    
  
    return {
      ...contato,
      fotos: fotosComUrl,
      compras,
      recompra,
    };
  }

  async update(id: string, data: AtualizarContatoInput) {
    const contato: AtualizarContatoModel = {};

    if (data.nome !== undefined) {
      contato.nome = data.nome;
    }

    if (data.telefone !== undefined) {
      contato.telefone = data.telefone;
    }

    if (data.cidadeId !== undefined) {
      contato.cidadeId = data.cidadeId;
    }

    if (data.endereco !== undefined) {
      contato.endereco = data.endereco;
    }

    if (data.origem !== undefined) {
      contato.origem = data.origem;
    }

    if (data.natural !== undefined) {
      contato.natural = data.natural;
    }

    if (data.cor !== undefined) {
      contato.cor = data.cor;
    }

    if (data.textura !== undefined) {
      contato.textura = data.textura;
    }

    if (data.quimica !== undefined) {
      contato.quimica = data.quimica;
    }

    if (data.comprimentoCm !== undefined) {
      contato.comprimentoCm = data.comprimentoCm;
    }

    if (data.observacoes !== undefined) {
      contato.observacoes = data.observacoes;
    }

    return this.contatoRepository.update(id, contato);
  }

  async delete(id: string) {
    return this.contatoRepository.softDelete(id);
  }
}

