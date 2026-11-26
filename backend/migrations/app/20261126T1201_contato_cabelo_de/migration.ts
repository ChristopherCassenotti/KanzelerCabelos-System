#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/bd60ac491bcc221e19218b34eb9bff99adf86ace0347ed2a5ddeab375fc6c3e8/contract';
import startContract from '../../snapshots/bd60ac491bcc221e19218b34eb9bff99adf86ace0347ed2a5ddeab375fc6c3e8/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/e8b96722f60f6c0c8ca7c9da7f96af24534f96068553980e200b8e8f919ca44d/contract';
import endContract from '../../snapshots/e8b96722f60f6c0c8ca7c9da7f96af24534f96068553980e200b8e8f919ca44d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'contatos',
        column: col('cabelo_de', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'contatos',
        column: col('idade_dono_cabelo', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'contatos',
        column: col('nome_dono_cabelo', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
