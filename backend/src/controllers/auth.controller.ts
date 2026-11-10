import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  AUTH_COOKIE_MAX_AGE_SEGUNDOS,
  AUTH_COOKIE_NAME,
  lerOpcoesCookieAuth,
} from "../config/auth-cookie";
import { loginSchema } from "../schemas/auth.schema";
import { AuthService } from "../services/auth.service";

export class AuthController {
  constructor(
    private readonly authService =
      new AuthService(),
    private readonly opcoesCookie =
      lerOpcoesCookieAuth(),
  ) {}

  private gravarCookie(
    reply: FastifyReply,
    refreshToken: string,
  ) {
    reply.setCookie(
      AUTH_COOKIE_NAME,
      refreshToken,
      {
        ...this.opcoesCookie,
        maxAge: AUTH_COOKIE_MAX_AGE_SEGUNDOS,
      },
    );
  }

  private limparCookie(reply: FastifyReply) {
    // Mesmos atributos da gravação; senão o navegador não remove o cookie.
    reply.clearCookie(
      AUTH_COOKIE_NAME,
      this.opcoesCookie,
    );
  }

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

    this.gravarCookie(
      reply,
      resultado.refreshToken,
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
        AUTH_COOKIE_NAME
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

    if (resultado.tipo === "indisponivel") {
      // Falha temporária do provedor: a sessão continua válida no cookie.
      request.log.warn(
        "auth: refresh indisponível temporariamente",
      );

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
      this.limparCookie(reply);

      return reply.status(401).send({
        error:
          "Sessão inválida ou expirada",
      });
    }

    // Supabase rotaciona o refresh token; a validade do cookie é renovada
    // a cada uso (sessão deslizante).
    this.gravarCookie(
      reply,
      resultado.dados.refreshToken,
    );

    return reply.send({
      usuario: resultado.dados.usuario,

      accessToken:
        resultado.dados.accessToken,

      expiresIn:
        resultado.dados.expiresIn,
    });
  }

  async logout(
    _request: FastifyRequest,
    reply: FastifyReply,
  ) {
    this.limparCookie(reply);

    return reply
      .status(204)
      .send();
  }
}
