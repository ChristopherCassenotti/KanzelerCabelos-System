import "dotenv/config";
import { db } from "./prisma/db";

const cidades = [
  { nome: "União da Vitória", uf: "PR", lat: "-26.2297", lng: "-51.0867" },
  { nome: "Porto União", uf: "SC", lat: "-26.2378", lng: "-51.0783" },
  { nome: "Caçador", uf: "SC", lat: "-26.7753", lng: "-51.0150" },
  { nome: "Videira", uf: "SC", lat: "-27.0086", lng: "-51.1517" },
  { nome: "Fraiburgo", uf: "SC", lat: "-27.0253", lng: "-50.9208" },
  { nome: "São Bento do Sul", uf: "SC", lat: "-26.2503", lng: "-49.3786" },
  { nome: "Rio Negrinho", uf: "SC", lat: "-26.2544", lng: "-49.5181" },
  { nome: "Mafra", uf: "SC", lat: "-26.1114", lng: "-49.8053" },
  { nome: "Canoinhas", uf: "SC", lat: "-26.1767", lng: "-50.3900" },
  { nome: "Três Barras", uf: "SC", lat: "-26.1064", lng: "-50.3222" },
  { nome: "Irineópolis", uf: "SC", lat: "-26.2422", lng: "-50.7956" },
  { nome: "Chapecó", uf: "SC", lat: "-27.1004", lng: "-52.6152" },
  { nome: "Concórdia", uf: "SC", lat: "-27.2342", lng: "-52.0278" },
  { nome: "Joaçaba", uf: "SC", lat: "-27.1722", lng: "-51.5050" },
  { nome: "Pato Branco", uf: "PR", lat: "-26.2295", lng: "-52.6706" },
  { nome: "Guarapuava", uf: "PR", lat: "-25.3935", lng: "-51.4562" },
  { nome: "General Carneiro", uf: "PR", lat: "-26.4275", lng: "-51.3158" },
  { nome: "Paulo Frontin", uf: "PR", lat: "-26.0367", lng: "-50.8303" },
  { nome: "Mallet", uf: "PR", lat: "-25.8814", lng: "-50.8272" },
  { nome: "São Mateus do Sul", uf: "PR", lat: "-25.8744", lng: "-50.3828" },
];

async function main() {
  for (const cidade of cidades) {
    await db.orm.public.Cidade.upsert({
      create: cidade,
      update: {
        lat: cidade.lat,
        lng: cidade.lng,
      },
      conflictOn: {
        nome: cidade.nome,
        uf: cidade.uf,
      },
    });
  }

  console.log(`${cidades.length} cidades cadastradas com sucesso.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.close();
  });