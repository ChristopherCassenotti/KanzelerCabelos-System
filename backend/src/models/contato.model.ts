export interface CriarContatoModel {
  nome: string;
  cidadeId: string;

  telefone: string | null;
  endereco: string | null;
  origem: string | null;

  natural: boolean | null;

  cor: string | null;
  textura: string | null;
  quimica: string | null;

  comprimentoCm: number | null;

  observacoes: string | null;
}

export interface AtualizarContatoModel {
  nome?: string;
  telefone?: string | null;
  cidadeId?: string;
  endereco?: string | null;
  origem?: string | null;
  natural?: boolean | null;
  cor?: string | null;
  textura?: string | null;
  quimica?: string | null;
  comprimentoCm?: number | null;
  observacoes?: string | null;
}