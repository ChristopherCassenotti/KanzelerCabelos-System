import type { FastifyReply, FastifyRequest } from "fastify";
import { FotoService } from "../services/foto.service";

export class FotoController {
  constructor(
    private readonly fotoService = new FotoService(),
  ) {}

  async upload(
    request: FastifyRequest<{
      Params: {
        contatoId: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    let arquivo: {
      buffer: Buffer;
      mimetype: string;
    } | null = null;

    let tipo: string | undefined;

    for await (const part of request.parts()) {
      if (part.type === "file") {
        if (arquivo) {
          return reply.status(400).send({
            error: "Envie apenas uma foto por requisição",
          });
        }

        arquivo = {
          buffer: await part.toBuffer(),
          mimetype: part.mimetype,
        };
      } else if (part.fieldname === "tipo") {
        tipo = String(part.value);
      }
    }

    if (!arquivo) {
      return reply.status(400).send({
        error: "Foto não enviada",
      });
    }

    try {
        const foto = await this.fotoService.upload({
          contatoId: request.params.contatoId,
          buffer: arquivo.buffer,
          mimetype: arquivo.mimetype,
          ...(tipo !== undefined ? { tipo } : {}),
        });

      if (!foto) {
        return reply.status(404).send({
          error: "Contato não encontrado",
        });
      }

      return reply.status(201).send(foto);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao enviar foto";

      return reply.status(400).send({
        error: message,
      });
        }
      }

    async index(
      request: FastifyRequest<{
        Params: {
          contatoId: string;
        };
      }>,
      reply: FastifyReply,
    ) {
      const fotos = await this.fotoService.findByContatoId(
        request.params.contatoId,
      );
    
      if (!fotos) {
        return reply.status(404).send({
          error: "Contato não encontrado",
        });
      }
    
      return reply.send(fotos);
    }

    async delete(
      request: FastifyRequest<{
        Params: {
          contatoId: string;
          fotoId: string;
        };
      }>,
      reply: FastifyReply,
    ) {
      const foto = await this.fotoService.delete(
        request.params.contatoId,
        request.params.fotoId,
      );

      if (!foto) {
        return reply.status(404).send({
          error: "Foto não encontrada",
        });
      }

      return reply.status(204).send();
    }
}