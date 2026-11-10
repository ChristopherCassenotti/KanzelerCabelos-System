export interface DadosCompraModel {
  dataCorte: string;

  pesoG?: number | undefined;
  comprimentoCm?: number | undefined;

  cor?: string | undefined;
  textura?: string | undefined;
  quimica?: string | undefined;

  valorPago: string;
  formaPagamento: "Pix" | "Dinheiro";

  valorRevenda?: string | undefined;
  dataRevenda?: string | undefined;
  comprador?: string | undefined;
}

export interface RegistrarCompraModel extends DadosCompraModel {
  contatoId: string;
  visitaId?: string | undefined;
}
