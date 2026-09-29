import Fastify from "fastify";
import cors from "@fastify/cors";
import { routes } from "./routes";

export const app = Fastify({
  logger: true,
});

app.register(cors, {
  origin: true,
});

app.get("/health", async () => {
  return {
    ok: true,
    message: "Kanzler API funcionando",
  };
});

app.register(routes);