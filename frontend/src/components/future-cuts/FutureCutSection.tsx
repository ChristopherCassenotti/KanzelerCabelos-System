import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Edit3, Phone, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { listCities } from "../../services/contacts/contacts.service";
import {
  closeFutureCut,
  createFutureCut,
  listContactFutureCuts,
  markFutureCutContacted,
  scheduleFutureCut,
  updateFutureCut,
} from "../../services/future-cuts/future-cuts.service";
import { ensureRouteForDate } from "../../services/schedule/schedule.service";
import type { ContactDetail } from "../../types/contact";
import { formatDate } from "../../utils/contact";
import {
  formValuesToFutureCutPayload,
  futureCutBadgeClass,
  futureCutLabel,
  isActiveFutureCut,
  priorityLabels,
} from "../../utils/future-cut";
import { ConfirmDialog } from "../contacts/ConfirmDialog";
import { FutureCutContactedModal } from "./FutureCutContactedModal";
import { FutureCutFormModal } from "./FutureCutFormModal";
import { FutureCutScheduleModal } from "./FutureCutScheduleModal";

type OpenModal = "form" | "contacted" | "schedule" | "converter" | "descartar" | null;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação";
}

function lengthLabel(value: number | null) {
  return value === null ? "-" : `${value} cm`;
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--kanzler-muted-2)]">{label}</dt>
      <dd className="mt-1 text-[13px] leading-5 text-[var(--kanzler-ink)]">{value || "-"}</dd>
    </div>
  );
}

export function FutureCutSection({ contact }: { contact: ContactDetail }) {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<OpenModal>(null);

  const query = useQuery({
    // Sob "contacts": as invalidações já existentes também atualizam a seção.
    queryKey: ["contacts", "future-cuts", "contact", contact.id],
    queryFn: () => listContactFutureCuts(contact.id),
  });

  const active = query.data?.find(isActiveFutureCut) ?? null;

  const mutation = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSuccess: async () => {
      setModal(null);
      await Promise.all(
        ["contacts", "dashboard", "agenda", "routes"].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] }),
        ),
      );
    },
  });

  const error = mutation.isError ? errorMessage(mutation.error) : null;

  function open(next: OpenModal) {
    mutation.reset();
    setModal(next);
  }

  function close() {
    open(null);
  }

  async function schedule(id: string, { date, time }: { date: string; time: string }) {
    const cities = await queryClient.fetchQuery({ queryKey: ["cities"], queryFn: listCities });
    const route = await ensureRouteForDate(date, cities);
    return scheduleFutureCut(id, { diaRotaId: route.id, ...(time ? { hora: time } : {}) });
  }

  const buttonClass = "inline-flex items-center gap-1.5 rounded-[9px] border border-[var(--kanzler-line)] bg-white px-3 py-2 text-[11.5px] font-semibold text-[var(--kanzler-ink)] hover:bg-[var(--kanzler-canvas)] disabled:cursor-not-allowed disabled:opacity-40";
  const lost = contact.status === "perdido";

  return (
    <section className="border-b border-[var(--kanzler-line)] py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="kanzler-display text-sm font-semibold uppercase">Interesse futuro</h3>
        {active && (
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${futureCutBadgeClass(active)}`}>
            {futureCutLabel(active)}
          </span>
        )}
      </div>

      {query.isPending ? (
        <div className="mt-3 h-16 animate-pulse rounded-xl bg-[var(--kanzler-canvas)]" />
      ) : query.isError ? (
        <div className="mt-3 rounded-lg bg-[var(--kanzler-red-soft)] px-3 py-2 text-[12px] text-[var(--kanzler-red)]">
          {errorMessage(query.error)}
          <button type="button" onClick={() => void query.refetch()} className="ml-2 font-semibold underline">Tentar novamente</button>
        </div>
      ) : !active ? (
        <button type="button" onClick={() => open("form")} className={`mt-3 ${buttonClass}`}>
          <Plus size={13} /> Adicionar interesse futuro
        </button>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
            <Detail label="Previsão de corte" value={formatDate(active.dataPrevista)} />
            <Detail label="Próximo contato" value={formatDate(active.dataProximoContato)} />
            <Detail label="Compr. atual" value={lengthLabel(active.comprimentoAtualCm)} />
            <Detail label="Compr. esperado" value={lengthLabel(active.comprimentoDesejadoCm)} />
            <Detail label="Cor" value={active.cor} />
            <Detail label="Textura" value={active.textura} />
            <Detail label="Química" value={active.quimica} />
            <Detail label="Natural" value={active.natural === null ? "-" : active.natural ? "Sim" : "Não"} />
            <Detail label="Prioridade" value={priorityLabels[active.prioridade]} />
          </dl>

          {active.observacoes && (
            <p className="mt-4 whitespace-pre-wrap text-[13px] leading-6 text-[var(--kanzler-muted)]">{active.observacoes}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => open("form")} className={buttonClass}>
              <Edit3 size={13} /> Editar acompanhamento
            </button>
            <button type="button" onClick={() => open("contacted")} className={buttonClass}>
              <Phone size={13} /> Marcar como contatada
            </button>
            <button
              type="button"
              onClick={() => open("schedule")}
              disabled={lost}
              title={lost ? "Contato perdido não pode ser agendado" : undefined}
              className={buttonClass}
            >
              <CalendarDays size={13} /> Agendar avaliação
            </button>
            <button type="button" onClick={() => open("descartar")} className={`${buttonClass} text-[var(--kanzler-red)] hover:border-[#e5adad] hover:bg-[var(--kanzler-red-soft)]`}>
              <Trash2 size={13} /> Remover
            </button>
          </div>

          <div className="mt-3 flex gap-4 text-[11.5px] font-semibold text-[var(--kanzler-muted)]">
            <button type="button" onClick={() => open("converter")} className="hover:text-[var(--kanzler-green)]">Marcar como convertido</button>
          </div>
        </>
      )}

      {modal === "form" && (
        <FutureCutFormModal
          contact={contact}
          futureCut={active}
          pending={mutation.isPending}
          error={error}
          onClose={close}
          onSubmit={(values) => {
            const payload = formValuesToFutureCutPayload(values);
            mutation.mutate(() => active ? updateFutureCut(active.id, payload) : createFutureCut(contact.id, payload));
          }}
        />
      )}

      {modal === "contacted" && active && (
        <FutureCutContactedModal
          contactName={contact.nome}
          pending={mutation.isPending}
          error={error}
          onClose={close}
          onSubmit={({ dataProximoContato, observacao }) =>
            mutation.mutate(() => markFutureCutContacted(active.id, {
              dataProximoContato,
              ...(observacao ? { observacao } : {}),
            }))}
        />
      )}

      {modal === "schedule" && active && (
        <FutureCutScheduleModal
          contactName={contact.nome}
          pending={mutation.isPending}
          error={error}
          onClose={close}
          onSubmit={(values) => mutation.mutate(() => schedule(active.id, values))}
        />
      )}

      <ConfirmDialog
        open={(modal === "converter" || modal === "descartar") && Boolean(active)}
        title={modal === "converter" ? "Marcar como convertido?" : "Remover dos futuros cortes?"}
        description={error ?? "O acompanhamento será encerrado e permanecerá no histórico do contato."}
        confirmLabel={modal === "converter" ? "Converter" : "Remover"}
        destructive={modal === "descartar"}
        pending={mutation.isPending}
        onCancel={close}
        onConfirm={() => {
          if (active && (modal === "converter" || modal === "descartar")) {
            mutation.mutate(() => closeFutureCut(active.id, modal));
          }
        }}
      />
    </section>
  );
}
