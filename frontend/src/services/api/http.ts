import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { env } from "./env";
import { normalizeApiError } from "./errors";
import { refreshSession } from "../auth/auth.service";
import { authStore } from "../auth/auth-store";

interface RetryableConfig extends InternalAxiosRequestConfig {
  _kanzlerRetry?: boolean;
}

export const http = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

let refreshPromise: ReturnType<typeof refreshSession> | null = null;

http.interceptors.request.use((config) => {
  const token = authStore.getSnapshot().accessToken;

  if (token) {
    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      throw normalizeApiError(error);
    }

    const status = error.response?.status;
    const config = error.config as RetryableConfig | undefined;

    if (status !== 401 || !config || config._kanzlerRetry) {
      throw normalizeApiError(error);
    }

    config._kanzlerRetry = true;

    let sessao: Awaited<ReturnType<typeof refreshSession>>;

    try {
      refreshPromise ??= refreshSession().finally(() => {
        refreshPromise = null;
      });

      sessao = await refreshPromise;
    } catch (refreshError) {
      // refreshSession já limpa a sessão quando a recusa é definitiva (401);
      // em falha temporária (rede/5xx) o usuário continua logado.
      throw normalizeApiError(refreshError);
    }

    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set("Authorization", `Bearer ${sessao.accessToken}`);

    // Erros do retry (ex.: 500) seguem para quem chamou sem derrubar a sessão.
    return http(config);
  },
);
