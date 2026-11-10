export type AcaoAuditoria =
  | "compra_registrada"
  | "contato_excluido"
  | "contato_excluido_definitivo"
  | "contato_criado_assistente"
  | "contato_criado_com_compra";

export type EntidadeAuditoria =
  | "compra"
  | "contato";

export interface CriarAuditoriaModel {
  usuarioId: string | null;

  acao: AcaoAuditoria;

  entidade: EntidadeAuditoria;

  entidadeId: string;

  detalhes: string | null;
}