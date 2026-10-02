import "dotenv/config";
import { supabase } from "./config/supabase";

async function main() {
  const { data, error } = await supabase.storage.listBuckets();

  if (error) {
    throw error;
  }

  console.log("Conexão com Supabase Storage OK");

  for (const bucket of data) {
    console.log(`- ${bucket.name}`);
  }
}

main().catch((error) => {
  console.error("Erro ao conectar no Storage:");
  console.error(error);
  process.exit(1);
});