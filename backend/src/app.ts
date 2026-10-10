import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import cookie from "@fastify/cookie";

import { routes } from "./routes";
import { authRoutes } from "./routes/auth.routes";

export const app = Fastify({
  logger: true,
});

app.register(cors, {
  origin: true,
  credentials: true,
});

app.register(cookie);

app.register(multipart, {
  limits: {
    files: 4,
    fileSize: 10 * 1024 * 1024,
  },
});

app.get("/health", async () => {
  return {
    ok: true,
    message: "Kanzler API funcionando",
  };
});

app.register(authRoutes, {
  prefix: "/auth",
});

app.register(routes);