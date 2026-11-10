import { Check, LoaderCircle, Pencil, TriangleAlert, X } from "lucide-react";
import type { AssistantContactDraft, AssistantDuplicate, AssistantPhoto } from "../../types/assistant";
import { draftPurchaseRows, draftSummaryRows } from "../../utils/assistant-chat";
import { formatPhone } from "../../utils/contact";
import { PhotoThumbnails } from "./PhotoThumbnails";

interface ContactDraftCardProps {
  draft: AssistantContactDraft;
  duplicates: AssistantDuplicate[];
  photos: AssistantPhoto[];
  confirming: boolean;
  disabled: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onOpenContact: (contactId: string) => void;
  onRemovePhoto: (photoId: string) => void;
}

export function ContactDraftCard({
  draft,
  duplicates,
  photos,
  confirming,
  disabled,
  onConfirm,
  onEdit,
  onCancel,
  onOpenContact,
  onRemovePhoto,
}: ContactDraftCardProps) {
  const rows = draftSummaryRows(draft, photos.length);
  const purchaseRows = draftPurchaseRows(draft);
  const hasDuplicates = duplicates.length > 0;

  return (
    <section
      aria-label="Resumo do contato para confirmação"
      className="ml-0 rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white p-4 shadow-[var(--kanzler-shadow)] sm:ml-[42px] sm:max-w-[560px]"
    >
      <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--kanzler-blue)]">
        <span>Nova cliente</span>
        <span className="h-px flex-1 bg-[var(--kanzler-line)]" />
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-[13px] min-[420px]:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className={row.label === "Observações" || row.label === "Endereço" ? "min-[420px]:col-span-2" : ""}>
            <dt className="text-[11.5px] font-medium text-[var(--kanzler-muted)]">{row.label}</dt>
            <dd className="break-words font-semibold text-[var(--kanzler-ink)]">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--kanzler-green)]">
        <span>Compra</span>
        <span className="h-px flex-1 bg-[var(--kanzler-line)]" />
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-[13px] min-[420px]:grid-cols-2">
        {purchaseRows.map((row) => (
          <div key={row.label}>
            <dt className="text-[11.5px] font-medium text-[var(--kanzler-muted)]">{row.label}</dt>
            <dd className="break-words font-semibold text-[var(--kanzler-ink)]">{row.value}</dd>
          </div>
        ))}
      </dl>

      {photos.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[11.5px] font-medium text-[var(--kanzler-muted)]">Fotos ({photos.length})</p>
          <PhotoThumbnails photos={photos} disabled={disabled} onRemove={onRemovePhoto} />
        </div>
      )}

      <p className="mt-3 text-[11.5px] text-[var(--kanzler-muted-2)]">
        A cliente será cadastrada junto com a compra, já como Comprado.
        {photos.length > 0 ? " As fotos são enviadas logo após o cadastro." : ""}
      </p>

      {hasDuplicates && (
        <div className="mt-3 rounded-xl border border-[#f3d9a8] bg-[var(--kanzler-amber-soft)] px-3 py-2.5 text-[12.5px] text-[var(--kanzler-amber)]">
          <p className="flex items-center gap-2 font-semibold">
            <TriangleAlert size={15} className="shrink-0" />
            Possível contato duplicado
          </p>
          <ul className="mt-1.5 space-y-1">
            {duplicates.map((duplicate) => (
              <li key={duplicate.id} className="flex flex-wrap items-center gap-x-2">
                <span className="text-[var(--kanzler-ink)]">
                  {duplicate.nome}
                  {duplicate.cidade ? ` · ${duplicate.cidade.nome} - ${duplicate.cidade.uf}` : ""}
                  {duplicate.telefone ? ` · ${formatPhone(duplicate.telefone)}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenContact(duplicate.id)}
                  className="font-semibold underline underline-offset-2"
                >
                  ver ficha
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-col-reverse gap-2 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[var(--kanzler-muted)] transition hover:bg-[var(--kanzler-canvas)] disabled:opacity-50"
        >
          <X size={15} />
          Cancelar
        </button>
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[var(--kanzler-ink)] transition hover:bg-[var(--kanzler-canvas)] disabled:opacity-50"
        >
          <Pencil size={15} />
          Editar informações
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled}
          aria-busy={confirming}
          className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[var(--kanzler-blue)] px-3.5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[var(--kanzler-blue-dark)] disabled:opacity-60"
        >
          {confirming ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
          {confirming ? "Cadastrando..." : hasDuplicates ? "Cadastrar mesmo assim" : "Confirmar cadastro"}
        </button>
      </div>
    </section>
  );
}
