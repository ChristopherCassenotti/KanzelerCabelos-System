import "temporal-polyfill/full/global";
import { db } from "./prisma/db";

async function main() {
  const videira = await db.orm.public.Cidade
    .where({
      nome: "Videira",
      uf: "SC",
    })
    .first();

  const cacador = await db.orm.public.Cidade
    .where({
      nome: "Caçador",
      uf: "SC",
    })
    .first();

  if (!videira || !cacador) {
    throw new Error(
      "Videira ou Caçador não encontrada. Rode primeiro o seed de cidades.",
    );
  }

  console.log("Criando contatos...");

  const maria = await db.orm.public.Contato.create({
    nome: "Maria Teste",
    telefone: "49999990001",
    cidadeId: videira.id,
    endereco: "Rua XV de Novembro, 100",
    status: "lead",
    origem: "Anúncio Meta",
    natural: true,
    cor: "Castanho",
    textura: "Ondulado",
    quimica: "Nenhuma",
    comprimentoCm: 68,
    observacoes: "Cliente fictícia para testes.",
  });

  const juliana = await db.orm.public.Contato.create({
    nome: "Juliana Teste",
    telefone: "49999990002",
    cidadeId: videira.id,
    endereco: "Rua Brasil, 250",
    status: "lead",
    origem: "Instagram",
    natural: true,
    cor: "Castanho claro",
    textura: "Liso",
    quimica: "Nenhuma",
    comprimentoCm: 74,
    observacoes: "Cliente fictícia para testes.",
  });

  const carla = await db.orm.public.Contato.create({
    nome: "Carla Recompra Teste",
    telefone: "49999990003",
    cidadeId: cacador.id,
    endereco: "Avenida Central, 400",
    status: "comprado",
    origem: "Indicação",
    natural: true,
    cor: "Castanho escuro",
    textura: "Liso",
    quimica: "Nenhuma",
    comprimentoCm: 70,
    cicloRecompraMeses: 8,
    observacoes: "Cliente fictícia pronta para recompra.",
  });

  console.log("Criando histórico de compra...");

  await db.orm.public.Compra.create({
    contatoId: carla.id,

    dataCorte: Temporal.PlainDate.from(
      "2026-02-01",
    ),

    pesoG: 420,
    comprimentoCm: 70,
    cor: "Castanho escuro",
    textura: "Liso",
    quimica: "Nenhuma",

    valorPago: "1800.00",
    formaPagamento: "Pix",

    valorRevenda: null,
    dataRevenda: null,
    comprador: null,
  });

  console.log("Criando rotas...");

  const rota1 = await db.orm.public.DiaRota.create({
    data: Temporal.PlainDate.from(
      "2026-10-20",
    ),

    partidaCidadeId: videira.id,

    horaSaida: Temporal.PlainTime.from(
      "08:00",
    ),

    minutosPorVisita: 40,

    custoCombustivel: "150.00",
    custoAlimentacao: "80.00",
    custoHospedagem: "0.00",
    custoOutros: "20.00",
  });

  const rota2 = await db.orm.public.DiaRota.create({
    data: Temporal.PlainDate.from(
      "2026-10-21",
    ),

    partidaCidadeId: videira.id,

    horaSaida: Temporal.PlainTime.from(
      "08:00",
    ),

    minutosPorVisita: 40,

    custoCombustivel: "100.00",
    custoAlimentacao: "60.00",
    custoHospedagem: "0.00",
    custoOutros: "0.00",
  });

  console.log("Criando visitas e tarefas...");

  await db.orm.public.ItemRota.create({
    diaRotaId: rota1.id,
    tipo: "visita",
    contatoId: maria.id,
    titulo: null,
    ordem: 1,
    hora: Temporal.PlainTime.from(
      "09:00",
    ),
    concluido: false,
    resultado: null,
  });

  await db.orm.public.ItemRota.create({
    diaRotaId: rota1.id,
    tipo: "visita",
    contatoId: juliana.id,
    titulo: null,
    ordem: 2,
    hora: Temporal.PlainTime.from(
      "10:00",
    ),
    concluido: false,
    resultado: null,
  });

  await db.orm.public.ItemRota.create({
    diaRotaId: rota1.id,
    tipo: "tarefa",
    contatoId: null,
    titulo: "Abastecer a van",
    ordem: 3,
    hora: Temporal.PlainTime.from(
      "07:30",
    ),
    concluido: false,
    resultado: null,
  });

  console.log("");
  console.log("Seed concluído.");
  console.log("");
  console.log("IDs úteis:");
  console.log({
    contatos: {
      maria: maria.id,
      juliana: juliana.id,
      carla: carla.id,
    },
    rotas: {
      rota20Outubro: rota1.id,
      rota21Outubro: rota2.id,
    },
  });
}

main()
  .then(() => {
    console.log("Dados fictícios criados.");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });