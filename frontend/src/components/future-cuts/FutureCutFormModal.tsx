import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { futureCutFormSchema, type FutureCutFormValues } from "../../schemas/future-cut.schema";
import type { ContactDetail } from "../../types/contact";
import type { FutureCut } from "../../types/future-cut";
import { futureCutToFormValues } from "../../utils/future-cut";
import { chemicals, colors, textures, withCurrentOption } from "../../utils/hair-options";
import { errorClass, FieldLabel, FutureCutModalShell, inputClass } from "./FutureCutModalShell";

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
  const errors = form.formState.errors;
  const initial = form.formState.defaultValues;

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label>
          <FieldLabel required>Próximo contato</FieldLabel>
          <input {...form.register("dataProximoContato")} className={inputClass} type="date" autoFocus />
          {errors.dataProximoContato && <p className={errorClass}>{errors.dataProximoContato.message}</p>}
        </label>

        <label>
          <FieldLabel>Previsão de corte</FieldLabel>
          <input {...form.register("dataPrevista")} className={inputClass} type="date" />
          {errors.dataPrevista && <p className={errorClass}>{errors.dataPrevista.message}</p>}
        </label>

        <label>
          <FieldLabel>Prioridade</FieldLabel>
          <select {...form.register("prioridade")} className={inputClass}>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </label>

        <label>
          <FieldLabel>Comprimento atual (cm)</FieldLabel>
          <input {...form.register("comprimentoAtualCm")} className={inputClass} inputMode="numeric" />
          {errors.comprimentoAtualCm && <p className={errorClass}>{errors.comprimentoAtualCm.message}</p>}
        </label>

        <label>
          <FieldLabel>Comprimento esperado (cm)</FieldLabel>
          <input {...form.register("comprimentoDesejadoCm")} className={inputClass} inputMode="numeric" />
          {errors.comprimentoDesejadoCm && <p className={errorClass}>{errors.comprimentoDesejadoCm.message}</p>}
        </label>

        <label>
          <FieldLabel>Cabelo natural</FieldLabel>
          <select {...form.register("natural")} className={inputClass}>
            <option value="">-</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </label>

        <label>
          <FieldLabel>Cor</FieldLabel>
          <select {...form.register("cor")} className={inputClass}>
            <option value="">-</option>
            {withCurrentOption(colors, initial?.cor).map((color) => <option key={color} value={color}>{color}</option>)}
          </select>
        </label>

        <label>
          <FieldLabel>Textura</FieldLabel>
          <select {...form.register("textura")} className={inputClass}>
            <option value="">-</option>
            {withCurrentOption(textures, initial?.textura).map((texture) => <option key={texture} value={texture}>{texture}</option>)}
          </select>
        </label>

        <label>
          <FieldLabel>Química</FieldLabel>
          <select {...form.register("quimica")} className={inputClass}>
            <option value="">-</option>
            {withCurrentOption(chemicals, initial?.quimica).map((chemical) => <option key={chemical} value={chemical}>{chemical}</option>)}
          </select>
        </label>

        <label className="col-span-full">
          <FieldLabel>Observações</FieldLabel>
          <textarea {...form.register("observacoes")} className={`${inputClass} min-h-24 resize-y`} />
          {errors.observacoes && <p className={errorClass}>{errors.observacoes.message}</p>}
        </label>
      </div>
    </FutureCutModalShell>
  );
}
