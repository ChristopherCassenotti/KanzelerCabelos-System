import "dotenv/config";
import { app } from "./app";

const port = Number(process.env["PORT"]) || 3333;

async function start() {
  try {
    await app.listen({
      port,
      host: "0.0.0.0",
    });

    console.log(`API rodando na porta ${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();