export interface CriarFotoModel {
  contatoId: string;
  compraId?: string;
  tipo: string | null;
  url: string;
  thumbUrl: string | null;
  ordem: number;
}