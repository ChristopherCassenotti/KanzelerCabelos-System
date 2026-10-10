import { z } from "zod";

export const relatorioIndicadoresQuerySchema =
  z.object({
    periodo: z
      .enum([
        "todo",
        "mes_atual",
        "30",
        "90",
        "365",
      ])
      .default("todo"),
  });

export type RelatorioIndicadoresQuery =
  z.infer<
    typeof relatorioIndicadoresQuerySchema
  >;