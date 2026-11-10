import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import cookie from "@fastify/cookie";

import { routes } from "./routes";
import { authRoutes } from "./routes/auth.routes";
import { lerOrigensFrontend } from "./config/auth-cookie";

export const app = Fastify({
  logger: true,
});

const origensFrontend = lerOrigensFrontend();

app.register(cors, {

  origin:
    origensFrontend.length > 0
      ? origensFrontend
      : true,
  credentials: true,

  methods: [
    "GET",
    "HEAD",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  exposedHeaders: [
    "Content-Disposition",
    "X-Total-Registros",
    "Retry-After",
  ],
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