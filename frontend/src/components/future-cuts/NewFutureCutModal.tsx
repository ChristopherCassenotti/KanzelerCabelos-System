import { zodResolver } from "@hookform/resolvers/zod";
import { TriangleAlert } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { newFutureCutFormSchema, type NewFutureCutFormValues } from "../../schemas/future-cut.schema";
import type { City, ContactOverview } from "../../types/contact";
import { formatPhone } from "../../utils/contact";
import { createEmptyNewFutureCutValues, findSimilarContacts } from "../../utils/future-cut";
import { origins } from "../../utils/hair-options";
import { HairOwnerFields } from "../contacts/HairOwnerFields";
import { FutureCutFields } from "./FutureCutFields";
import { errorClass, FieldLabel, FutureCutModalShell, inputClass } from "./FutureCutModalShell";

interface NewFutureCutModalProps {
  cities: City[];
  contacts: ContactOverview[];
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onOpenContact: (contactId: string) => void;
  onSubmit: (values: NewFutureCutFormValues) => void;
}

export function NewFutureCutModal({ cities, contacts, pending, error, onClose, onOpenContact, onSubmit }: NewFutureCutModalProps) {
  const form = useForm<NewFutureCutFormValues>({
    resolver: zodResolver(newFutureCutFormSchema),
    defaultValues: createEmptyNewFutureCutValues(),
  });
  const errors = form.formState.errors;
  const similar = findSimilarContacts(contacts, {
    nome: form.watch("nome"),
    telefone: form.watch("telefone"),
    cidadeId: form.watch("cidadeId"),
  });

  return (
    <FutureCutModalShell
      wide
      title="Novo futuro corte"
      description="Cadastra a pessoa como lead, sem compra, junto com o acompanhamento."
      submitLabel={similar.length > 0 ? "Cadastrar mesmo assim" : "Salvar"}
      pending={pending}
      error={error}
      onClose={onClose}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="sm:col-span-2">
          <FieldLabel required>Nome</FieldLabel>
          <input {...form.register("nome")} className={inputClass} placeholder="Quem negocia (pode ser o pai ou a mãe)" autoFocus />
          {errors.nome && <p className={errorClass}>{errors.nome.message}</p>}
        </label>

        <label>
          <FieldLabel>WhatsApp</FieldLabel>
          <input {...form.register("telefone")} className={inputClass} placeholder="49 99999-9999" inputMode="tel" />
          {errors.telefone && <p className={errorClass}>{errors.telefone.message}</p>}
        </label>

        <label>
          <FieldLabel required>Cidade</FieldLabel>
          <select {...form.register("cidadeId")} className={inputClass}>
            <option value="">Selecione</option>
            {cities.map((city) => <option key={city.id} value={city.id}>{city.nome} - {city.uf}</option>)}
          </select>
          {errors.cidadeId && <p className={errorClass}>{errors.cidadeId.message}</p>}
        </label>

        <label>
          <FieldLabel>Como chegou</FieldLabel>
          <select {...form.register("origem")} className={inputClass}>
            <option value="">-</option>
            {origins.map((origin) => <option key={origin} value={origin}>{origin}</option>)}
          </select>
        </label>

        <label>
          <FieldLabel>Indicada por</FieldLabel>
          <input {...form.register("indicadoPor")} className={inputClass} />
        </label>

        <FormProvider {...form}>
          <HairOwnerFields inputClass={inputClass} errorClass={errorClass} Label={FieldLabel} />
        </FormProvider>
      </div>

      {similar.length > 0 && (
        <div className="mt-4 rounded-xl border border-[#f3d9a8] bg-[var(--kanzler-amber-soft)] px-3 py-2.5 text-[12.5px] text-[var(--kanzler-amber)]">
          <p className="flex items-center gap-2 font-semibold"><TriangleAlert size={15} /> Esta pessoa já pode estar cadastrada</p>
          <ul className="mt-1.5 space-y-1">
            {similar.map((contact) => (
              <li key={contact.id} className="flex flex-wrap items-center gap-x-2">
                <span className="text-[var(--kanzler-ink)]">
                  {[contact.nome, contact.cidade?.nome, formatPhone(contact.telefone)].filter(Boolean).join(" · ")}
                </span>
                <button type="button" onClick={() => onOpenContact(contact.id)} className="font-semibold underline underline-offset-2">
                  abrir ficha e adicionar lá
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4 mt-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--kanzler-blue)]">
        <span>Futuro corte</span>
        <span className="h-px flex-1 bg-[var(--kanzler-line)]" />
      </div>

      <FormProvider {...form}>
        <FutureCutFields />
      </FormProvider>
    </FutureCutModalShell>
  );
}
