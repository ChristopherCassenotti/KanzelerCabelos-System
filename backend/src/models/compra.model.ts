export interface RegistrarCompraModel {
  contatoId: string;
  dataCorte: string;

  pesoG?: number;
  comprimentoCm?: number;

  cor?: string;
  textura?: string;
  quimica?: string;

  valorPago: string;
  formaPagamento: "Pix" | "Dinheiro";
}