import {
  isAuthApiError,
  isAuthRetryableFetchError,
  isAuthSessionMissingError,
} from "@supabase/supabase-js";

import { createSupabaseAuthClient } from "../config/supabase";

export interface SessaoAutenticada {
  usuario: {
    id: string;
    email: string | undefined;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Resultado de operações que dependem do Supabase Auth.
 * - `invalido`: a credencial/sessão foi recusada de forma definitiva.
 * - `indisponivel`: falha temporária (rede, 5xx, limite de requisições);
 *   a sessão do usuário NÃO deve ser descartada por causa disso.
 */
export type ResultadoAuth<T> =
  | { tipo: "sucesso"; dados: T }
  | { tipo: "invalido" }
  | { tipo: "indisponivel" };

export function classificarErroAuth(
  error: unknown,
): "invalido" | "indisponivel" {
  if (isAuthRetryableFetchError(error)) return "indisponivel";
  if (isAuthSessionMissingError(error)) return "invalido";

  if (isAuthApiError(error)) {
    return error.status === 429 || error.status >= 500
      ? "indisponivel"
      : "invalido";
  }

  // Respostas inesperadas (HTML de proxy, JSON malformado, timeout etc.).
  return "indisponivel";
}

function paraSessao(data: {
  user: { id: string; email?: string | undefined } | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  } | null;
}): SessaoAutenticada | null {
  if (!data.user || !data.session) return null;

  return {
    usuario: {
      id: data.user.id,
      email: data.user.email,
    },
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in,
  };
}

export class AuthService {
  async login(
    email: string,
    senha: string,
  ) {
    const {
      data,
      error,
    } =
      await createSupabaseAuthClient().auth.signInWithPassword({
        email,
        password: senha,
      });

    if (error) {
      return null;
    }

    return paraSessao(data);
  }

  async refresh(
    refreshToken: string,
  ): Promise<ResultadoAuth<SessaoAutenticada>> {
    try {
      const {
        data,
        error,
      } =
        await createSupabaseAuthClient().auth.refreshSession({
          refresh_token: refreshToken,
        });

      if (error) {
        return { tipo: classificarErroAuth(error) };
      }

      const sessao = paraSessao(data);

      return sessao
        ? { tipo: "sucesso", dados: sessao }
        : { tipo: "invalido" };
    } catch (error) {
      return { tipo: classificarErroAuth(error) };
    }
  }

  async validarToken(
    token: string,
  ): Promise<ResultadoAuth<{ id: string }>> {
    try {
      const {
        data,
        error,
      } =
        await createSupabaseAuthClient().auth.getUser(
          token,
        );

      if (error) {
        return { tipo: classificarErroAuth(error) };
      }

      return data.user
        ? { tipo: "sucesso", dados: { id: data.user.id } }
        : { tipo: "invalido" };
    } catch (error) {
      return { tipo: classificarErroAuth(error) };
    }
  }
}
