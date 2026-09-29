import "dotenv/config";
import { db } from "./prisma/db";

async function main() {
  const query = db.sql.public.cidades
    .select("id", "nome", "uf")
    .build();

  const cidades = await db.runtime().query(query);

  console.log("Conexão OK");
  console.log(cidades);

  await db.close();
}

main().catch((error) => {
  console.error("Erro ao consultar banco:");
  console.error(error);
  process.exit(1);
});