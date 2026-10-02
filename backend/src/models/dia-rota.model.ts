export interface CriarDiaRotaModel {
  data: Temporal.PlainDate;
  partidaCidadeId: string;

  horaSaida?: Temporal.PlainTime;
  minutosPorVisita?: number;

  custoCombustivel?: string;
  custoAlimentacao?: string;
  custoHospedagem?: string;
  custoOutros?: string;
}