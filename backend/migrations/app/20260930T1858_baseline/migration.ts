#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/26cbe9cb575f0997d90cbca1ff89b0fc10ad0349bf069ee1ed0da2a8dab2bcdd/contract';
import endContract from '../../snapshots/26cbe9cb575f0997d90cbca1ff89b0fc10ad0349bf069ee1ed0da2a8dab2bcdd/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'cidades',
        columns: [
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('lat', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('lng', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('nome', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('uf', 'character(2)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 2 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'contatos',
        columns: [
          col('ciclo_recompra_meses', 'int4', {
            notNull: true,
            default: lit(8),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('cidade_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('comprimento_cm', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('cor', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('deleted_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('endereco', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('natural', 'bool', { codecRef: { codecId: 'pg/bool@1' } }),
          col('nome', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('observacoes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('origem', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('quimica', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('lead'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('telefone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('textura', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'cidades',
        constraint: 'cidades_nome_uf_key',
        columns: ['nome', 'uf'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'contatos',
        index: 'contatos_cidade_id_idx_3c7827ff',
        columns: ['cidade_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'contatos',
        foreignKey: {
          name: 'contatos_cidade_id_fkey',
          columns: ['cidade_id'],
          references: { schema: 'public', table: 'cidades', columns: ['id'] },
        },
      }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'cidades' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'contatos' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
