import "dotenv/config";
import { app } from "./app";

async function start() {
  try {
    await app.listen({
      port: 3333,
      host: "0.0.0.0",
    });

    console.log("API rodando em http://localhost:3333");
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();