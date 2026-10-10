import { supabase } from "../config/supabase";

export class AuthService {
  async login(
    email: string,
    senha: string,
  ) {
    const {
      data,
      error,
    } =
      await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

    if (
      error ||
      !data.user ||
      !data.session
    ) {
      return null;
    }

    return {
      usuario: {
        id: data.user.id,
        email: data.user.email,
      },

      accessToken:
        data.session.access_token,

      refreshToken:
        data.session.refresh_token,

      expiresIn:
        data.session.expires_in,
    };
  }

  async refresh(
    refreshToken: string,
  ) {
    const {
      data,
      error,
    } =
      await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

    if (
      error ||
      !data.user ||
      !data.session
    ) {
      return null;
    }

    return {
      usuario: {
        id: data.user.id,
        email: data.user.email,
      },

      accessToken:
        data.session.access_token,

      refreshToken:
        data.session.refresh_token,

      expiresIn:
        data.session.expires_in,
    };
  }

  async validarToken(
    token: string,
  ) {
    const {
      data,
      error,
    } =
      await supabase.auth.getUser(
        token,
      );

    if (
      error ||
      !data.user
    ) {
      return null;
    }

    return data.user;
  }
}