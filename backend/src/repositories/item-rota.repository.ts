import { db } from "../prisma/db";

interface SalvarVisitaInput {
  diaRotaId: string;
  contatoId: string;
  visitaExistenteId?: string;
  hora?: Temporal.PlainTime;
  alterarStatusParaAvaliacao: boolean;
  
}

interface CriarTarefaInput {
  diaRotaId: string;
  titulo: string;
  hora?: Temporal.PlainTime;
}

export class ItemRotaRepository {
  async findVisitasAbertasByContatoId(
    contatoId: string,
  ) {
    return db.orm.public.ItemRota
      .include("diaRota")
      .where({
        contatoId,
        tipo: "visita",
        concluido: false,
      })
      .all();
  }

  async salvarVisita(
    data: SalvarVisitaInput,
  ) {
    return db.transaction(async (tx) => {
      let visita;

      if (data.visitaExistenteId) {
        visita = await tx.orm.public.ItemRota
          .where({
            id: data.visitaExistenteId,
          })
          .update({
            diaRotaId: data.diaRotaId,
            resultado: null,

            ...(data.hora !== undefined
              ? { hora: data.hora }
              : {}),
          });
      } else {
        visita =
          await tx.orm.public.ItemRota.create({
            diaRotaId: data.diaRotaId,
            contatoId: data.contatoId,
            tipo: "visita",
            ordem: 0,
            concluido: false,
            resultado: null,
            titulo: null,

            ...(data.hora !== undefined
              ? { hora: data.hora }
              : {}),
          });
      }

      if (
        data.alterarStatusParaAvaliacao
      ) {
        await tx.orm.public.Contato
          .where({
            id: data.contatoId,
            deletedAt: null,
          })
          .update({
            status: "avaliacao_agendada",
            motivoPerda: null,
          });
      }

      return visita;
    });
  }
  
  async criarTarefa(data: CriarTarefaInput) {
      return db.orm.public.ItemRota.create({
        diaRotaId: data.diaRotaId,

        tipo: "tarefa",
        contatoId: null,
        titulo: data.titulo,

        ordem: 0,
        concluido: false,
        resultado: null,

        ...(data.hora !== undefined
          ? { hora: data.hora }
          : {}),
      });
    }

    async findById(id: string) {
  return db.orm.public.ItemRota
    .where({
      id,
    })
    .first();
    }

    async concluir(
      id: string,
      resultado:
        | "comprou"
        | "nao_comprou"
        | "nao_atendeu"
        | "remarcar"
        | null,
    ) {
      return db.orm.public.ItemRota
        .where({
          id,
        })
        .update({
          concluido: true,
          resultado,
        });
    }

    async remarcar(
      itemId: string,
      novoDiaRotaId: string,
    ) {
      return db.orm.public.ItemRota
        .where({
          id: itemId,
        })
        .update({
          diaRotaId: novoDiaRotaId,
          concluido: false,
          resultado: "remarcar",
          ordem: 0,
        });
    }

    async delete(
      id: string,
    ) {
      return db.orm.public.ItemRota
        .where({
          id,
        })
        .delete();
    }

    async findByDiaRotaId(
      diaRotaId: string,
    ) {
      return db.orm.public.ItemRota
        .where({
          diaRotaId,
        })
        .orderBy(
          (item) => item.ordem.asc(),
        )
        .all();
    }

    async reordenar(
      diaRotaId: string,
      itemIds: string[],
    ) {
      return db.transaction(async (tx) => {
        for (
          let index = 0;
          index < itemIds.length;
          index++
        ) {
          const itemId = itemIds[index];
        
          if (!itemId) {
            continue;
          }
      
          await tx.orm.public.ItemRota
            .where({
              id: itemId,
              diaRotaId,
            })
            .update({
              ordem: index + 1,
            });
        }
    
        return tx.orm.public.ItemRota
          .where({
            diaRotaId,
          })
          .orderBy(
            (item) => item.ordem.asc(),
          )
          .all();
      });
    }
}