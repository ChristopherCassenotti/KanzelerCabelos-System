import { ContatoRepository } from "../repositories/contato.repository";
import { FotoRepository } from "../repositories/foto.repository";
import { StorageService } from "./storage.service";

interface UploadFotoInput {
  contatoId: string;
  buffer: Buffer;
  mimetype: string;
  tipo?: string;
}

export class FotoService {
  constructor(
    private readonly contatoRepository = new ContatoRepository(),
    private readonly fotoRepository = new FotoRepository(),
    private readonly storageService = new StorageService(),
  ) {}

  async upload(data: UploadFotoInput) {
    const contato = await this.contatoRepository.findById(data.contatoId);

    if (!contato) {
      return null;
    }

    const extensions: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const extension = extensions[data.mimetype];

    if (!extension) {
      throw new Error("Formato de imagem não permitido");
    }

    const storage = await this.storageService.uploadImage({
      contatoId: data.contatoId,
      buffer: data.buffer,
      mimetype: data.mimetype,
      extension,
    });

    try {
      return await this.fotoRepository.create({
        contatoId: data.contatoId,
        tipo: data.tipo ?? null,
        url: storage.path,
        thumbUrl: null,
        ordem: 0,
      });
    } catch (error) {
      await this.storageService.deleteImage(storage.path);
      throw error;
    }
  }

    async findByContatoId(contatoId: string) {
      const contato = await this.contatoRepository.findById(contatoId);

      if (!contato) {
        return null;
      }

      const fotos = await this.fotoRepository.findByContatoId(contatoId);

      return Promise.all(
        fotos.map(async (foto) => {
          const signedUrl = await this.storageService.createSignedUrl(
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
      const foto = await this.fotoRepository.findByIdForContato(
        fotoId,
        contatoId,
      );
  
      if (!foto) {
        return null;
      }
  
      await this.storageService.deleteImage(foto.url);
  
      return this.fotoRepository.deleteByIdForContato(
        fotoId,
        contatoId,
      );
    }
}