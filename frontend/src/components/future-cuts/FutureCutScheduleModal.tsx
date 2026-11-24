import { useState } from "react";
import { getTodayInSaoPauloISO } from "../../utils/date";
import { FieldLabel, FutureCutModalShell, inputClass } from "./FutureCutModalShell";

interface FutureCutScheduleModalProps {
  contactName: string;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: { date: string; time: string }) => void;
}

export function FutureCutScheduleModal({ contactName, pending, error, onClose, onSubmit }: FutureCutScheduleModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  return (
    <FutureCutModalShell
      title="Agendar avaliação"
      description={`${contactName} entra na rota do dia escolhido.`}
      submitLabel="Agendar"
      pending={pending}
      error={error}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ date, time });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <FieldLabel required>Data</FieldLabel>
          <input value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} type="date" min={getTodayInSaoPauloISO()} required autoFocus />
        </label>

        <label>
          <FieldLabel>Hora</FieldLabel>
          <input value={time} onChange={(event) => setTime(event.target.value)} className={inputClass} type="time" />
        </label>
      </div>
    </FutureCutModalShell>
  );
}
