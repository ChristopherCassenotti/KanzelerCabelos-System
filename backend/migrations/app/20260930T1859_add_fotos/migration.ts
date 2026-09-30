#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/26cbe9cb575f0997d90cbca1ff89b0fc10ad0349bf069ee1ed0da2a8dab2bcdd/contract';
import startContract from '../../snapshots/26cbe9cb575f0997d90cbca1ff89b0fc10ad0349bf069ee1ed0da2a8dab2bcdd/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/423d4f5fae7be6308bbf0b0a1b8b720ec49b75d0df9f3b22e9a6b16a464e30c5/contract';
import endContract from '../../snapshots/423d4f5fae7be6308bbf0b0a1b8b720ec49b75d0df9f3b22e9a6b16a464e30c5/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  lit,
  placeholder,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'fotos',
        columns: [
          col('contato_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('ordem', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('thumb_url', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('tipo', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('url', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.dataTransform(endContract, 'typechange-cidades-uf', {
        check: () => placeholder('typechange-cidades-uf:check'),
        run: () => placeholder('typechange-cidades-uf:run'),
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'cidades',
        column: 'uf',
        options: {
          qualifiedTargetType: 'text',
          formatTypeExpected: 'text',
          rawTargetTypeForLabel: 'text',
        },
      }),
      this.createIndex({
        schema: 'public',
        table: 'fotos',
        index: 'fotos_contato_id_idx_f7fc9452',
        columns: ['contato_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'fotos',
        foreignKey: {
          name: 'fotos_contato_id_fkey',
          columns: ['contato_id'],
          references: { schema: 'public', table: 'contatos', columns: ['id'] },
        },
      }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'fotos' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
