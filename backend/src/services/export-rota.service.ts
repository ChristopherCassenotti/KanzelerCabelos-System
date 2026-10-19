import ExcelJS = require("exceljs");

import { DiaRotaRepository } from "../repositories/dia-rota.repository";

function criarLinkMapa(
  contato: {
    lat: string | null;
    lng: string | null;
    endereco: string | null;
    cidade: {
      nome: string;
      uf: string;
    };
  },
) {
  let destino = "";

  if (
    contato.lat !== null &&
    contato.lng !== null
  ) {
    destino =
      `${contato.lat},${contato.lng}`;
  } else {
    destino = [
      contato.endereco,
      `${contato.cidade.nome} - ${contato.cidade.uf}`,
    ]
      .filter(Boolean)
      .join(", ");
  }

  if (!destino) {
    return "";
  }

  return (
    "https://www.google.com/maps/search/" +
    "?api=1&query=" +
    encodeURIComponent(destino)
  );
}

export class ExportRotaService {
  constructor(
    private readonly diaRotaRepository =
      new DiaRotaRepository(),
  ) {}

  async gerar(
    diaRotaId: string,
  ) {
    const rota =
      await this.diaRotaRepository
        .findDetailedById(
          diaRotaId,
        );

    if (!rota) {
      return null;
    }

    const workbook =
      new ExcelJS.Workbook();

    workbook.creator =
      "Kanzler Cabelos";

    const planilha =
      workbook.addWorksheet(
        "Rota",
      );

    planilha.columns = [
      {
        header: "Ordem",
        key: "ordem",
        width: 10,
      },
      {
        header: "Horário",
        key: "hora",
        width: 12,
      },
      {
        header: "Tipo",
        key: "tipo",
        width: 14,
      },
      {
        header: "Nome / tarefa",
        key: "nome",
        width: 28,
      },
      {
        header: "Cidade",
        key: "cidade",
        width: 22,
      },
      {
        header: "Endereço",
        key: "endereco",
        width: 35,
      },
      {
        header: "WhatsApp",
        key: "telefone",
        width: 18,
      },
      {
        header: "Status",
        key: "status",
        width: 22,
      },
      {
        header: "Feito",
        key: "feito",
        width: 12,
      },
      {
        header: "Link do mapa",
        key: "mapa",
        width: 50,
      },
    ];

    for (
      const item of rota.itens
    ) {
      if (
        item.tipo === "visita" &&
        item.contato
      ) {
        planilha.addRow({
          ordem:
            item.ordem,

          hora:
            item.hora
              ?.toString()
              .slice(0, 5) ??
            "",

          tipo:
            "Visita",

          nome:
            item.contato.nome,

          cidade:
            item.contato
              .cidade.nome,

          endereco:
            item.contato
              .endereco ?? "",

          telefone:
            item.contato
              .telefone ?? "",

          status:
            item.contato.status,

          feito:
            item.concluido
              ? "Sim"
              : "Não",

          mapa:
            criarLinkMapa(
              item.contato,
            ),
        });

        continue;
      }

      planilha.addRow({
        ordem:
          item.ordem,

        hora:
          item.hora
            ?.toString()
            .slice(0, 5) ??
          "",

        tipo:
          "Tarefa",

        nome:
          item.titulo ?? "",

        cidade: "",
        endereco: "",
        telefone: "",
        status: "",

        feito:
          item.concluido
            ? "Sim"
            : "Não",

        mapa: "",
      });
    }

    planilha.getRow(1).font = {
      bold: true,
    };

    planilha.views = [
      {
        state: "frozen",
        ySplit: 1,
      },
    ];

    planilha.autoFilter = {
      from: "A1",
      to: "J1",
    };

    planilha.addRow([]);

    planilha.addRow([
      "",
      "",
      "Data",
      rota.data.toString(),
    ]);

    planilha.addRow([
      "",
      "",
      "Ponto de saída",
      `${rota.partidaCidade.nome} - ${rota.partidaCidade.uf}`,
    ]);

    planilha.addRow([
      "",
      "",
      "Horário de saída",
      rota.horaSaida
        .toString()
        .slice(0, 5),
    ]);

    planilha.addRow([
      "",
      "",
      "Minutos por visita",
      rota.minutosPorVisita,
    ]);

    const buffer =
      await workbook.xlsx
        .writeBuffer();

    return {
      buffer,
      data:
        rota.data.toString(),
    };
  }
}