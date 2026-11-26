import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { futureCutFormSchema, type FutureCutFormValues } from "../../schemas/future-cut.schema";
import type { ContactDetail } from "../../types/contact";
import type { FutureCut } from "../../types/future-cut";
import { futureCutToFormValues } from "../../utils/future-cut";
import { FutureCutFields } from "./FutureCutFields";
import { FutureCutModalShell } from "./FutureCutModalShell";

interface FutureCutFormModalProps {
  contact: ContactDetail;
  futureCut: FutureCut | null;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: FutureCutFormValues) => void;
}

/** Montado apenas enquanto aberto: os valores iniciais vêm sempre atualizados. */
export function FutureCutFormModal({ contact, futureCut, pending, error, onClose, onSubmit }: FutureCutFormModalProps) {
  const form = useForm<FutureCutFormValues>({
    resolver: zodResolver(futureCutFormSchema),
    defaultValues: futureCutToFormValues(futureCut, contact),
  });

  return (
    <FutureCutModalShell
      wide
      title={futureCut ? "Editar acompanhamento" : "Adicionar interesse futuro"}
      description={contact.nome}
      submitLabel="Salvar"
      pending={pending}
      error={error}
      onClose={onClose}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FormProvider {...form}>
        <FutureCutFields />
      </FormProvider>
    </FutureCutModalShell>
  );
}
