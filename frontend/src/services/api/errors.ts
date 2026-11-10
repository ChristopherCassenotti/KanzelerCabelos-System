import axios from "axios";

export interface ApiErrorPayload {
  error?: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly status: number | null;
  readonly details: unknown;
  /** Falha temporária (sem resposta, timeout, 5xx, 429): vale tentar de novo. */
  readonly transient: boolean;

  constructor(message: string, status: number | null = null, details?: unknown, transient = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.transient = transient;
  }
}

function isTransientStatus(status: number | null) {
  return status === null || status === 408 || status === 429 || status >= 500;
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const status = error.response?.status ?? null;
    const payload = error.response?.data;
    const message = payload?.error || error.message || "Erro ao comunicar com a API";

    return new ApiError(message, status, payload?.details, isTransientStatus(status));
  }

  if (error instanceof Error) return new ApiError(error.message);

  return new ApiError("Erro inesperado");
}
