import ExcelJS = require("exceljs");

import { ContatoRepository } from "../repositories/contato.repository";

import type {
  ExportContatosQuery,
} from "../schemas/export-contatos.schema";

export class ExportContatosService {
  constructor(
    private readonly contatoRepository =
      new ContatoRepository(),
  ) {}

  async gerar(
    filtros: ExportContatosQuery = {},
  ) {
    const contatos =
      await this.contatoRepository
        .findAllParaExportacao();

    const filtrados =
      contatos.filter(
        (contato) => {
          if (
            filtros.status &&
            contato.status !==
              filtros.status
          ) {
            return false;
          }

          if (
            filtros.cidadeId &&
            contato.cidadeId !==
              filtros.cidadeId
          ) {
            return false;
          }

          if (
            filtros.origem &&
            contato.origem !==
              filtros.origem
          ) {
            return false;
          }

          if (
            filtros.natural !==
              undefined &&
            contato.natural !==
              filtros.natural
          ) {
            return false;
          }

          return true;
        },
      );

    const workbook =
      new ExcelJS.Workbook();

    const planilha =
      workbook.addWorksheet(
        "Contatos",
      );

    planilha.columns = [
      {
        header: "Nome",
        key: "nome",
        width: 28,
      },
      {
        header: "WhatsApp",
        key: "telefone",
        width: 18,
      },
      {
        header: "Cidade",
        key: "cidade",
        width: 22,
      },
      {
        header: "UF",
        key: "uf",
        width: 8,
      },
      {
        header: "Endereço",
        key: "endereco",
        width: 35,
      },
      {
        header: "Status",
        key: "status",
        width: 22,
      },
      {
        header: "Origem",
        key: "origem",
        width: 20,
      },
      {
        header: "Indicada por",
        key: "indicadoPor",
        width: 24,
      },
      {
        header: "Primeiro contato",
        key: "dataPrimeiroContato",
        width: 18,
      },
      {
        header: "Data avaliação",
        key: "dataAvaliacao",
        width: 18,
      },
      {
        header: "Data corte",
        key: "dataCorte",
        width: 16,
      },
      {
        header: "Natural",
        key: "natural",
        width: 12,
      },
      {
        header: "Cor",
        key: "cor",
        width: 18,
      },
      {
        header: "Textura",
        key: "textura",
        width: 18,
      },
      {
        header: "Química",
        key: "quimica",
        width: 18,
      },
      {
        header: "Comprimento",
        key: "comprimento",
        width: 16,
      },
      {
        header: "Peso",
        key: "peso",
        width: 12,
      },
      {
        header: "Valor pago",
        key: "valorPago",
        width: 16,
      },
      {
        header: "R$/g",
        key: "valorPorGrama",
        width: 14,
      },
      {
        header: "Pagamento",
        key: "formaPagamento",
        width: 18,
      },
      {
        header: "Revenda",
        key: "valorRevenda",
        width: 16,
      },
      {
        header: "Próxima recompra",
        key: "proximaRecompra",
        width: 20,
      },
      {
        header: "Motivo perda",
        key: "motivoPerda",
        width: 24,
      },
      {
        header: "Nº fotos",
        key: "numeroFotos",
        width: 12,
      },
      {
        header: "Observações",
        key: "observacoes",
        width: 40,
      },
      {
        header: "Latitude",
        key: "lat",
        width: 16,
      },
      {
        header: "Longitude",
        key: "lng",
        width: 16,
      },
    ];

    for (
      const contato of filtrados
    ) {
      const ultimaCompra =
        contato.compras[0] ?? null;
        const proximaRecompra =
  ultimaCompra
    ? ultimaCompra.dataCorte.add({
        months:
          contato.cicloRecompraMeses,
      })
    : null;
      const peso =
        ultimaCompra?.pesoG ??
        null;

      const valorPago =
        ultimaCompra?.valorPago ??
        null;

      const valorPorGrama =
        peso &&
        Number(peso) > 0 &&
        valorPago !== null
          ? Number(valorPago) /
            Number(peso)
          : null;

      planilha.addRow({
        nome:
          contato.nome,

        telefone:
          contato.telefone ?? "",

        cidade:
          contato.cidade.nome,

        uf:
          contato.cidade.uf,

        endereco:
          contato.endereco ?? "",

        status:
          contato.status,

        origem:
          contato.origem ?? "",

        indicadoPor:
          contato.indicadoPor ?? "",

        dataPrimeiroContato:
          contato
            .dataPrimeiroContato
            ?.toString() ?? "",

        dataAvaliacao:
          contato
            .dataAvaliacao
            ?.toString() ?? "",

        dataCorte:
          ultimaCompra
            ?.dataCorte
            .toString() ?? "",

        natural:
          contato.natural === null
            ? ""
            : contato.natural
              ? "Sim"
              : "Não",

        cor:
          ultimaCompra?.cor ??
          contato.cor ??
          "",

        textura:
          ultimaCompra?.textura ??
          contato.textura ??
          "",

        quimica:
          ultimaCompra?.quimica ??
          contato.quimica ??
          "",

        comprimento:
          ultimaCompra
            ?.comprimentoCm ??
          contato.comprimentoCm ??
          "",

        peso:
          peso ?? "",

        valorPago:
          valorPago !== null
            ? Number(valorPago)
            : "",

        valorPorGrama:
          valorPorGrama !== null
            ? Math.round(
                valorPorGrama * 100,
              ) / 100
            : "",

        formaPagamento:
          ultimaCompra
            ?.formaPagamento ??
          "",

        valorRevenda:
          ultimaCompra
            ?.valorRevenda !== null &&
          ultimaCompra
            ?.valorRevenda !==
            undefined
            ? Number(
                ultimaCompra
                  .valorRevenda,
              )
            : "",
        proximaRecompra:
              proximaRecompra
                ?.toString() ?? "",    

        motivoPerda:
          contato.motivoPerda ??
          "",

        numeroFotos:
          contato.fotos.length,

        observacoes:
          contato.observacoes ??
          "",

        lat:
          contato.lat !== null
            ? Number(contato.lat)
            : "",

        lng:
          contato.lng !== null
            ? Number(contato.lng)
            : "",
      });
    }

    planilha.views = [
      {
        state: "frozen",
        ySplit: 1,
      },
    ];

    planilha.autoFilter = {
      from: "A1",
      to: "AA1",
    };

    planilha.getRow(1).font = {
      bold: true,
    };

    const buffer =
      await workbook.xlsx
        .writeBuffer();

    return {
      buffer,
      total:
        filtrados.length,
    };
  }
}