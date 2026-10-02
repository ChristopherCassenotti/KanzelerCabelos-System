import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { routes } from "./routes";

export const app = Fastify({
  logger: true,
});

app.register(cors, {
  origin: true,
});

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

app.register(routes);