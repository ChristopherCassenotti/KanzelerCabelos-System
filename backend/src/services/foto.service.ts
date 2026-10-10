import { ContatoRepository } from "../repositories/contato.repository";
import { CompraRepository } from "../repositories/compra.repository";
import { FotoRepository } from "../repositories/foto.repository";
import { StorageService } from "./storage.service";

interface UploadFotoInput {
  contatoId: string;
  compraId?: string;
  buffer: Buffer;
  mimetype: string;
  tipo?: string;
}

export class FotoService {
  constructor(
    private readonly contatoRepository =
      new ContatoRepository(),

    private readonly fotoRepository =
      new FotoRepository(),

    private readonly storageService =
      new StorageService(),

    private readonly compraRepository =
      new CompraRepository(),
  ) {}

  async upload(data: UploadFotoInput) {
    const contato =
      await this.contatoRepository.findById(
        data.contatoId,
      );

    if (!contato) {
      return {
        tipo: "contato_nao_encontrado" as const,
      };
    }
if (!contato.autorizouFoto) {
  return {
    tipo:
      "foto_nao_autorizada" as const,
  };
}
    if (data.compraId !== undefined) {
      const compra =
        await this.compraRepository.findByIdForContato(
          data.compraId,
          data.contatoId,
        );

      if (!compra) {
        return {
          tipo: "compra_invalida" as const,
        };
      }
    }

    const extensions: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const extension =
      extensions[data.mimetype];

    if (!extension) {
      throw new Error(
        "Formato de imagem não permitido",
      );
    }

    const storage =
      await this.storageService.uploadImage({
        contatoId: data.contatoId,
        buffer: data.buffer,
        mimetype: data.mimetype,
        extension,
      });

    try {
      const foto =
        await this.fotoRepository.create({
          contatoId: data.contatoId,

          ...(data.compraId !== undefined
            ? {
                compraId: data.compraId,
              }
            : {}),

          tipo: data.tipo ?? null,
          url: storage.path,
          thumbUrl: null,
          ordem: 0,
        });

      return {
        tipo: "sucesso" as const,
        foto,
      };
    } catch (error) {
      await this.storageService.deleteImage(
        storage.path,
      );

      throw error;
    }
  }

  async findByContatoId(
    contatoId: string,
  ) {
    const contato =
      await this.contatoRepository.findById(
        contatoId,
      );

    if (!contato) {
      return null;
    }

    const fotos =
      await this.fotoRepository.findByContatoId(
        contatoId,
      );

    return Promise.all(
      fotos.map(async (foto) => {
        const signedUrl =
          await this.storageService.createSignedUrl(
            foto.url,
            3600,
          );

        return {
          ...foto,
          signedUrl,
        };
      }),
    );
  }

  async delete(
    contatoId: string,
    fotoId: string,
  ) {
    const foto =
      await this.fotoRepository.findByIdForContato(
        fotoId,
        contatoId,
      );

    if (!foto) {
      return null;
    }

    await this.storageService.deleteImage(
      foto.url,
    );

    return this.fotoRepository.deleteByIdForContato(
      fotoId,
      contatoId,
    );
  }
}