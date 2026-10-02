import { randomUUID } from "node:crypto";
import { supabase } from "../config/supabase";

const BUCKET = "contatos-fotos";

interface UploadImageParams {
  contatoId: string;
  buffer: Buffer;
  mimetype: string;
  extension: string;
}

export class StorageService {
  async uploadImage({
    contatoId,
    buffer,
    mimetype,
    extension,
  }: UploadImageParams) {
    const fileName = `${randomUUID()}.${extension}`;

    const path = `${contatoId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Erro ao enviar foto: ${error.message}`);
    }

    return {
      path: data.path,
    };
  }

  async deleteImage(path: string) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([path]);

    if (error) {
      throw new Error(`Erro ao remover foto: ${error.message}`);
    }
  }

  async createSignedUrl(path: string, expiresIn = 3600) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Erro ao gerar URL da foto: ${error.message}`);
    }

    return data.signedUrl;
  }
}