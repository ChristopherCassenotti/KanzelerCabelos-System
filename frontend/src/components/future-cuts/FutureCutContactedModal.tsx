import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { futureCutContactedSchema, type FutureCutContactedValues } from "../../schemas/future-cut.schema";
import { getTodayInSaoPauloISO } from "../../utils/date";
import { errorClass, FieldLabel, FutureCutModalShell, inputClass } from "./FutureCutModalShell";

interface FutureCutContactedModalProps {
  contactName: string;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: FutureCutContactedValues) => void;
}

export function FutureCutContactedModal({ contactName, pending, error, onClose, onSubmit }: FutureCutContactedModalProps) {
  const form = useForm<FutureCutContactedValues>({
    resolver: zodResolver(futureCutContactedSchema),
    defaultValues: { dataProximoContato: "", observacao: "" },
  });
  const errors = form.formState.errors;

  return (
    <FutureCutModalShell
      title="Marcar como contatada"
      description={contactName}
      submitLabel="Confirmar contato"
      pending={pending}
      error={error}
      onClose={onClose}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="grid gap-4">
        <label>
          <FieldLabel required>Nova data de próximo contato</FieldLabel>
          <input {...form.register("dataProximoContato")} className={inputClass} type="date" min={getTodayInSaoPauloISO()} autoFocus />
          {errors.dataProximoContato && <p className={errorClass}>{errors.dataProximoContato.message}</p>}
        </label>

        <label>
          <FieldLabel>Observação</FieldLabel>
          <textarea {...form.register("observacao")} className={`${inputClass} min-h-24 resize-y`} placeholder="Será acrescentada às observações com a data de hoje" />
          {errors.observacao && <p className={errorClass}>{errors.observacao.message}</p>}
        </label>
      </div>
    </FutureCutModalShell>
  );
}
