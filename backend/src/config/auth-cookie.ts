import "dotenv/config";

export const AUTH_COOKIE_NAME = "kanzler_refresh_token";

/**
 * Duração do cookie de sessão. A sessão é "deslizante": cada refresh grava o
 * cookie de novo com esta validade. 400 dias é o máximo aceito pelos
 * navegadores atuais (Chrome limita qualquer cookie a 400 dias).
 */
export const AUTH_COOKIE_MAX_AGE_SEGUNDOS = 400 * 24 * 60 * 60;

type SameSite = "lax" | "strict" | "none";

export interface OpcoesCookieAuth {
  httpOnly: true;
  secure: boolean;
  sameSite: SameSite;
  path: "/";
  domain?: string;
}

function lerSameSite(valor: string | undefined): SameSite | null {
  const normalizado = valor?.trim().toLowerCase();

  return normalizado === "lax" ||
    normalizado === "strict" ||
    normalizado === "none"
    ? normalizado
    : null;
}

/** Origens do frontend autorizadas a usar a API com cookies (CORS). */
export function lerOrigensFrontend(): string[] {
  return (process.env["FRONTEND_ORIGINS"] ?? "")
    .split(",")
    .map((origem) => origem.trim().replace(/\/+$/, ""))
    .filter((origem) => origem.length > 0);
}

export function lerOpcoesCookieAuth(
  env: NodeJS.ProcessEnv = process.env,
): OpcoesCookieAuth {
  const producao = env["NODE_ENV"] === "production";
  const origensConfiguradas = (env["FRONTEND_ORIGINS"] ?? "").trim().length > 0;
  let sameSite = lerSameSite(env["AUTH_COOKIE_SAMESITE"]) ?? "lax";

  if (sameSite === "none" && !origensConfiguradas) {
    console.warn(
      "auth: AUTH_COOKIE_SAMESITE=none ignorado porque FRONTEND_ORIGINS não está definido; usando lax.",
    );
    sameSite = "lax";
  }

  const secureEnv = env["AUTH_COOKIE_SECURE"]?.trim().toLowerCase();
  const secure =
    sameSite === "none" ||
    (secureEnv === undefined || secureEnv === ""
      ? producao
      : secureEnv === "true");

  const domain = env["AUTH_COOKIE_DOMAIN"]?.trim();

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    ...(domain ? { domain } : {}),
  };
}
