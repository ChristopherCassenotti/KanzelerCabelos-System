import type { ContactStatus } from "../../types/contact";
import { isKnownContactStatus, statusLabels } from "../../utils/contact";

const classes: Record<ContactStatus, string> = {
  lead: "bg-[#eef1f5] text-[#5a6675]",
  avaliacao_agendada: "bg-[var(--kanzler-blue-soft)] text-[var(--kanzler-blue)]",
  comprado: "bg-[var(--kanzler-green-soft)] text-[var(--kanzler-green)]",
  perdido: "bg-[var(--kanzler-red-soft)] text-[var(--kanzler-red)]",
};

const dots: Record<ContactStatus, string> = {
  lead: "bg-[#8a97a6]",
  avaliacao_agendada: "bg-[var(--kanzler-blue)]",
  comprado: "bg-[var(--kanzler-green)]",
  perdido: "bg-[var(--kanzler-red)]",
};

export function ContactStatusBadge({ status }: { status: string }) {
  if (!isKnownContactStatus(status)) {
    return (
      <span className="inline-flex items-center rounded-full bg-[#eef1f5] px-2.5 py-1 text-[11.5px] font-semibold text-[#5a6675]">
        {status}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${classes[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} />
      {statusLabels[status]}
    </span>
  );
}
