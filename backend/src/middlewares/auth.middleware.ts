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

  const resultado =
    await authService.validarToken(
      token,
    );

  if (resultado.tipo === "indisponivel") {
    // Não responder 401: o frontend trataria como sessão perdida.
    return reply
      .status(503)
      .header("Retry-After", "5")
      .send({
        error:
          "Serviço de autenticação indisponível. Tente novamente em instantes.",
        code: "auth_indisponivel",
      });
  }

  if (resultado.tipo === "invalido") {
    return reply.status(401).send({
      error:
        "Sessão inválida ou expirada",
    });
  }

  request.usuarioId =
    resultado.dados.id;
}