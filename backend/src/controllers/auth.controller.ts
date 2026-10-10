import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { loginSchema } from "../schemas/auth.schema";
import { AuthService } from "../services/auth.service";

const COOKIE_NAME =
  "kanzler_refresh_token";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:
    process.env["NODE_ENV"] ===
    "production",

  sameSite: "lax" as const,
  path: "/",

  maxAge:
    60 * 60 * 24 * 30,
};

export class AuthController {
  constructor(
    private readonly authService =
      new AuthService(),
  ) {}

  async login(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const resultadoSchema =
      loginSchema.safeParse(
        request.body,
      );

    if (!resultadoSchema.success) {
      return reply.status(400).send({
        error: "Dados inválidos",
        details:
          resultadoSchema.error.flatten(),
      });
    }

    const resultado =
      await this.authService.login(
        resultadoSchema.data.email,
        resultadoSchema.data.senha,
      );

    if (!resultado) {
      return reply.status(401).send({
        error:
          "E-mail ou senha inválidos",
      });
    }

    reply.setCookie(
      COOKIE_NAME,
      resultado.refreshToken,
      COOKIE_OPTIONS,
    );

    return reply.send({
      usuario: resultado.usuario,

      accessToken:
        resultado.accessToken,

      expiresIn:
        resultado.expiresIn,
    });
  }

  async refresh(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const refreshToken =
      request.cookies[
        COOKIE_NAME
      ];

    if (!refreshToken) {
      return reply.status(401).send({
        error:
          "Sessão não encontrada",
      });
    }

    const resultado =
      await this.authService.refresh(
        refreshToken,
      );

    if (!resultado) {
      reply.clearCookie(
        COOKIE_NAME,
        {
          path: "/",
        },
      );

      return reply.status(401).send({
        error:
          "Sessão inválida ou expirada",
      });
    }

    // Supabase pode rotacionar
    // o refresh token.
    reply.setCookie(
      COOKIE_NAME,
      resultado.refreshToken,
      COOKIE_OPTIONS,
    );

    return reply.send({
      usuario: resultado.usuario,

      accessToken:
        resultado.accessToken,

      expiresIn:
        resultado.expiresIn,
    });
  }

  async logout(
    _request: FastifyRequest,
    reply: FastifyReply,
  ) {
    reply.clearCookie(
      COOKIE_NAME,
      {
        path: "/",
      },
    );

    return reply
      .status(204)
      .send();
  }
}