import { DiaRotaRepository } from "../repositories/dia-rota.repository";

export class MapaRotaService {
  constructor(
    private readonly diaRotaRepository =
      new DiaRotaRepository(),
  ) {}

  async buscar(diaRotaId: string) {
    const rota =
      await this.diaRotaRepository.findDetailedById(
        diaRotaId,
      );

    if (!rota) {
      return null;
    }

    const partida = {
      cidadeId: rota.partidaCidade.id,
      nome: rota.partidaCidade.nome,
      uf: rota.partidaCidade.uf,

      lat:
        rota.partidaCidade.lat !== null
          ? Number(rota.partidaCidade.lat)
          : null,

      lng:
        rota.partidaCidade.lng !== null
          ? Number(rota.partidaCidade.lng)
          : null,
    };

    const paradas = rota.itens
      .filter(
        (item) =>
          item.tipo === "visita" &&
          item.contato !== null,
      )
      .map((item) => ({
        itemId: item.id,
        ordem: item.ordem,

        hora:
          item.hora?.toString() ?? null,

        concluido: item.concluido,
        resultado: item.resultado,

        contato: {
          id: item.contato!.id,
          nome: item.contato!.nome,
          endereco:
            item.contato!.endereco,

          lat:
            item.contato!.lat !== null
              ? Number(item.contato!.lat)
              : null,

          lng:
            item.contato!.lng !== null
              ? Number(item.contato!.lng)
              : null,

          cidade: {
            id: item.contato!.cidade.id,
            nome:
              item.contato!.cidade.nome,
            uf: item.contato!.cidade.uf,
          },
        },
      }));

    return {
      id: rota.id,
      data: rota.data.toString(),

      horaSaida:
        rota.horaSaida.toString(),

      partida,

      distanciaKm:
        rota.distanciaKm !== null
          ? Number(rota.distanciaKm)
          : null,

      duracaoMin:
        rota.duracaoMin,

      rotaPolyline:
        rota.rotaPolyline,

      paradas,
    };
  }
}