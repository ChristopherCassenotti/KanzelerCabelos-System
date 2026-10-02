import "temporal-polyfill/full/global";

import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

const testEnvPath = path.resolve(
  process.cwd(),
  ".env.test",
);

const devEnvPath = path.resolve(
  process.cwd(),
  ".env",
);

if (!fs.existsSync(testEnvPath)) {
  throw new Error(
    "Arquivo .env.test não encontrado",
  );
}

const testEnv = dotenv.parse(
  fs.readFileSync(testEnvPath),
);

const devEnv = fs.existsSync(devEnvPath)
  ? dotenv.parse(fs.readFileSync(devEnvPath))
  : {};

if (!testEnv["DATABASE_URL"]) {
  throw new Error(
    "DATABASE_URL de testes não configurada",
  );
}

if (!testEnv["DIRECT_URL"]) {
  throw new Error(
    "DIRECT_URL de testes não configurada",
  );
}

if (
  devEnv["DATABASE_URL"] &&
  testEnv["DATABASE_URL"] === devEnv["DATABASE_URL"]
) {
  throw new Error(
    "SEGURANÇA: DATABASE_URL de teste é igual ao banco de desenvolvimento",
  );
}

if (
  devEnv["DIRECT_URL"] &&
  testEnv["DIRECT_URL"] === devEnv["DIRECT_URL"]
) {
  throw new Error(
    "SEGURANÇA: DIRECT_URL de teste é igual ao banco de desenvolvimento",
  );
}

dotenv.config({
  path: testEnvPath,
  override: true,
});