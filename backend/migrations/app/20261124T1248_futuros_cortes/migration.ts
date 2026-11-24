#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/75e96bf614b7660eb8b37c8b33bcac4739b65928ea9f0e106bfaf724abc2de92/contract';
import startContract from '../../snapshots/75e96bf614b7660eb8b37c8b33bcac4739b65928ea9f0e106bfaf724abc2de92/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/bd60ac491bcc221e19218b34eb9bff99adf86ace0347ed2a5ddeab375fc6c3e8/contract';
import endContract from '../../snapshots/bd60ac491bcc221e19218b34eb9bff99adf86ace0347ed2a5ddeab375fc6c3e8/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'futuros_cortes',
        columns: [
          col('comprimento_atual_cm', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('comprimento_desejado_cm', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('contato_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('cor', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('data_prevista', 'date', { codecRef: { codecId: 'pg/date-temporal@1' } }),
          col('data_proximo_contato', 'date', {
            notNull: true,
            codecRef: { codecId: 'pg/date-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('natural', 'bool', { codecRef: { codecId: 'pg/bool@1' } }),
          col('observacoes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('prioridade', 'text', {
            notNull: true,
            default: lit('media'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('quimica', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('acompanhando'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('textura', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('ultimo_contato_em', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'futuros_cortes_prioridade_check_51e8ba68',
            "\"prioridade\" IN ('baixa', 'media', 'alta')",
          ),
          checkExpression(
            'futuros_cortes_status_check_80816cde',
            "\"status\" IN ('acompanhando', 'agendado', 'convertido', 'descartado')",
          ),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'futuros_cortes',
        index: 'futuros_cortes_contato_id_idx_f7fc9452',
        columns: ['contato_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'futuros_cortes',
        index: 'futuros_cortes_data_proximo_contato_idx_56e482cd',
        columns: ['data_proximo_contato'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'futuros_cortes',
        index: 'futuros_cortes_um_ativo_f9fe83a7',
        columns: ['contato_id'],
        extras: {
          where: "(status = ANY (ARRAY['acompanhando'::text, 'agendado'::text]))",
          unique: true,
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'futuros_cortes',
        foreignKey: {
          name: 'futuros_cortes_contato_id_fkey',
          columns: ['contato_id'],
          references: { schema: 'public', table: 'contatos', columns: ['id'] },
        },
      }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'futuros_cortes' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
