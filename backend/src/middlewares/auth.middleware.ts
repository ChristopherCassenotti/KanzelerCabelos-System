import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { AuthService } from "../services/auth.service";

const authService =
  new AuthService();

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const authorization =
    request.headers.authorization;

  if (!authorization) {
    return reply.status(401).send({
      error: "Não autenticado",
    });
  }

  const [tipo, token] =
    authorization.split(" ");

  if (
    tipo !== "Bearer" ||
    !token
  ) {
    return reply.status(401).send({
      error: "Token inválido",
    });
  }

  const usuario =
    await authService.validarToken(
      token,
    );

  if (!usuario) {
    return reply.status(401).send({
      error:
        "Sessão inválida ou expirada",
    });
  }
  request.usuarioId =
  usuario.id;
}