#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/26cbe9cb575f0997d90cbca1ff89b0fc10ad0349bf069ee1ed0da2a8dab2bcdd/contract';
import startContract from '../../snapshots/26cbe9cb575f0997d90cbca1ff89b0fc10ad0349bf069ee1ed0da2a8dab2bcdd/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/75e96bf614b7660eb8b37c8b33bcac4739b65928ea9f0e106bfaf724abc2de92/contract';
import endContract from '../../snapshots/75e96bf614b7660eb8b37c8b33bcac4739b65928ea9f0e106bfaf724abc2de92/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
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
        table: 'auditoria',
        columns: [
          col('acao', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('detalhes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('entidade', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('entidade_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('usuario_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'compras',
        columns: [
          col('comprador', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('comprimento_cm', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('contato_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('cor', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('data_corte', 'date', { notNull: true, codecRef: { codecId: 'pg/date-temporal@1' } }),
          col('data_revenda', 'date', { codecRef: { codecId: 'pg/date-temporal@1' } }),
          col('forma_pagamento', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('peso_g', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('quimica', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('textura', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('valor_pago', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('valor_revenda', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('visita_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'dias_rota',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('custo_alimentacao', 'numeric', {
            notNull: true,
            default: lit('0'),
            codecRef: { codecId: 'pg/numeric@1' },
          }),
          col('custo_combustivel', 'numeric', {
            notNull: true,
            default: lit('0'),
            codecRef: { codecId: 'pg/numeric@1' },
          }),
          col('custo_hospedagem', 'numeric', {
            notNull: true,
            default: lit('0'),
            codecRef: { codecId: 'pg/numeric@1' },
          }),
          col('custo_outros', 'numeric', {
            notNull: true,
            default: lit('0'),
            codecRef: { codecId: 'pg/numeric@1' },
          }),
          col('data', 'date', { notNull: true, codecRef: { codecId: 'pg/date-temporal@1' } }),
          col('distancia_km', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('duracao_min', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('hora_saida', 'time', {
            notNull: true,
            default: fn("'08:00:00'::time"),
            codecRef: { codecId: 'pg/time-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('minutos_por_visita', 'int4', {
            notNull: true,
            default: lit(40),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('partida_cidade_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('rota_polyline', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'fotos',
        columns: [
          col('compra_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
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
      this.createTable({
        schema: 'public',
        table: 'itens_rota',
        columns: [
          col('concluido', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('contato_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('dia_rota_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('hora', 'time', { codecRef: { codecId: 'pg/time-temporal@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('ordem', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('resultado', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('tipo', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('titulo', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'itens_rota_resultado_check_49039db2',
            "\"resultado\" IN ('comprou', 'nao_comprou', 'nao_atendeu', 'remarcar')",
          ),
          checkExpression('itens_rota_tipo_check_c6f966b0', "\"tipo\" IN ('visita', 'tarefa')"),
        ],
      }),
      this.addColumn({
        schema: 'public',
        table: 'contatos',
        column: col('autorizou_foto', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'contatos',
        column: col('data_avaliacao', 'date', { codecRef: { codecId: 'pg/date-temporal@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'contatos',
        column: col('data_primeiro_contato', 'date', {
          codecRef: { codecId: 'pg/date-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'contatos',
        column: col('geo_fonte', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'contatos',
        column: col('geo_place_id', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'contatos',
        column: col('indicado_por', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'contatos',
        column: col('lat', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'contatos',
        column: col('lng', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'contatos',
        column: col('motivo_perda', 'text', { codecRef: { codecId: 'pg/text@1' } }),
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
      this.addUnique({
        schema: 'public',
        table: 'dias_rota',
        constraint: 'dias_rota_data_key',
        columns: ['data'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'auditoria',
        index: 'auditoria_entidade_entidade_id_idx_7217251b',
        columns: ['entidade', 'entidade_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'auditoria',
        index: 'auditoria_usuario_id_idx_65b6616a',
        columns: ['usuario_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'compras',
        index: 'compras_contato_id_idx_f7fc9452',
        columns: ['contato_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'compras',
        index: 'compras_visita_id_idx_04fe9ae3',
        columns: ['visita_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'contatos',
        index: 'contatos_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'dias_rota',
        index: 'dias_rota_partida_cidade_id_idx_27c2e9f5',
        columns: ['partida_cidade_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'fotos',
        index: 'fotos_compra_id_idx_b246fef9',
        columns: ['compra_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'fotos',
        index: 'fotos_contato_id_idx_f7fc9452',
        columns: ['contato_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'itens_rota',
        index: 'itens_rota_contato_id_idx_f7fc9452',
        columns: ['contato_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'itens_rota',
        index: 'itens_rota_dia_rota_id_idx_4abc0932',
        columns: ['dia_rota_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'compras',
        foreignKey: {
          name: 'compras_contato_id_fkey',
          columns: ['contato_id'],
          references: { schema: 'public', table: 'contatos', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'compras',
        foreignKey: {
          name: 'compras_visita_id_fkey',
          columns: ['visita_id'],
          references: { schema: 'public', table: 'itens_rota', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'dias_rota',
        foreignKey: {
          name: 'dias_rota_partida_cidade_id_fkey',
          columns: ['partida_cidade_id'],
          references: { schema: 'public', table: 'cidades', columns: ['id'] },
        },
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
      this.addForeignKey({
        schema: 'public',
        table: 'fotos',
        foreignKey: {
          name: 'fotos_compra_id_fkey',
          columns: ['compra_id'],
          references: { schema: 'public', table: 'compras', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'itens_rota',
        foreignKey: {
          name: 'itens_rota_dia_rota_id_fkey',
          columns: ['dia_rota_id'],
          references: { schema: 'public', table: 'dias_rota', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'itens_rota',
        foreignKey: {
          name: 'itens_rota_contato_id_fkey',
          columns: ['contato_id'],
          references: { schema: 'public', table: 'contatos', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'auditoria' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'compras' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'dias_rota' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'fotos' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'itens_rota' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
