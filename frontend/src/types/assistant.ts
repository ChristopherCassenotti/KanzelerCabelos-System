import type { City } from "./contact";

export type AssistantStage =
  | "coletando_dados"
  | "escolher_cidade"
  | "aguardando_confirmacao"
  | "cancelado"
  | "fora_do_escopo"
  | "ajuda";

export type AssistantPendingField = "nome" | "cidade" | "valorPago" | "formaPagamento";

/** Espelha `rascunhoContatoSchema` do backend. */
export interface AssistantContactDraft {
  nome: string | null;
  telefone: string | null;
  cidadeId: string | null;
  cidadeNome: string | null;
  cidadeUf: string | null;
  endereco: string | null;
  origem: string | null;
  indicadoPor: string | null;
  dataPrimeiroContato: string | null;
  dataAvaliacao: string | null;
  natural: boolean | null;
  cor: string | null;
  textura: string | null;
  quimica: string | null;
  comprimentoCm: number | null;
  observacoes: string | null;
  autorizouFoto: boolean;
  // Compra (o contato só é cadastrado junto com a compra).
  dataCorte: string | null;
  pesoG: number | null;
  valorPago: string | null;
  formaPagamento: "Pix" | "Dinheiro" | null;
  valorRevenda: string | null;
  dataRevenda: string | null;
  comprador: string | null;
}

export interface AssistantDuplicate {
  id: string;
  nome: string;
  telefone: string | null;
  cidade: { nome: string; uf: string } | null;
  motivo: "telefone" | "nome_cidade";
}

export type AssistantCity = Pick<City, "id" | "nome" | "uf">;

export interface AssistantHistoryItem {
  papel: "usuario" | "assistente";
  texto: string;
}

export interface AssistantMessagePayload {
  mensagem?: string;
  cidadeEscolhidaId?: string;
  historico: AssistantHistoryItem[];
  rascunho: AssistantContactDraft | null;
}

export interface AssistantMessageResponse {
  resposta: string;
  estado: AssistantStage;
  rascunho: AssistantContactDraft | null;
  pendencias: AssistantPendingField[];
  cidadeOpcoes: AssistantCity[];
  possiveisDuplicados: AssistantDuplicate[];
  avisos: string[];
}

export interface AssistantConfirmPayload {
  idempotencyKey: string;
  rascunho: AssistantContactDraft;
  ignorarDuplicidade: boolean;
  /** Com fotos o contato é criado com `autorizouFoto = true`; sem fotos, `false`. */
  quantidadeFotos: number;
}

/** Foto anexada no chat. Fica só no navegador até o contato ser criado. */
export interface AssistantPhoto {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "uploading" | "uploaded" | "failed";
}

export interface AssistantCreatedContact {
  id: string;
  nome: string;
  status: string;
  cidade: AssistantCity;
}

export interface AssistantCreatedPurchase {
  id: string;
  dataCorte: string;
  valorPago: string;
}

export interface AssistantConfirmResponse {
  contato: AssistantCreatedContact;
  compra: AssistantCreatedPurchase;
  reaproveitado: boolean;
}
