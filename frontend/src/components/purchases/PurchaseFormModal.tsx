import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleDollarSign, Info, ShoppingBag, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { purchaseFormSchema, type PurchaseFormValues } from "../../schemas/purchase.schema";
import { registerPurchase } from "../../services/purchases/purchases.service";
import type { ContactDetail, ContactPurchase } from "../../types/contact";
import { formatCurrency } from "../../utils/contact";
import {
  calculatePurchasePricePerGram,
  createPurchaseFormValues,
  purchaseFormToPayload,
} from "../../utils/purchase";

interface PurchaseFormModalProps {
  open: boolean;
  contact: ContactDetail | null;
  visitId?: string | null;
  defaultDate?: string;
  onClose: () => void;
  onSuccess?: (purchase: ContactPurchase) => void | Promise<void>;
}

const colors = ["Preto", "Castanho escuro", "Castanho", "Castanho claro", "Loiro", "Ruivo", "Grisalho"];
const textures = ["Liso", "Ondulado", "Cacheado", "Crespo"];
const chemicals = ["Nenhuma", "Tintura", "Luzes/mechas", "Progressiva", "Alisamento"];

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="mb-1.5 block text-[12px] font-semibold text-[var(--kanzler-ink)]">
      {children} {required && <span className="text-[var(--kanzler-red)]">*</span>}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full flex items-center gap-3 pt-1 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--kanzler-blue)]">
      <span>{children}</span>
      <span className="h-px flex-1 bg-[var(--kanzler-line)]" />
    </div>
  );
}

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível registrar a compra";
}

export function PurchaseFormModal({
  open,
  contact,
  visitId,
  defaultDate,
  onClose,
  onSuccess,
}: PurchaseFormModalProps) {
  const queryClient = useQueryClient();
  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: contact
      ? createPurchaseFormValues(contact, defaultDate)
      : {
          dataCorte: defaultDate ?? "",
          pesoG: "",
          comprimentoCm: "",
          cor: "",
          textura: "",
          quimica: "",
          valorPago: "",
          formaPagamento: "Pix",
          valorRevenda: "",
          dataRevenda: "",
          comprador: "",
        },
  });

  useEffect(() => {
    if (!open || !contact) return;
    form.reset(createPurchaseFormValues(contact, defaultDate));
  }, [open, contact, defaultDate, form]);

  const mutation = useMutation({
    mutationFn: (values: PurchaseFormValues) =>
      registerPurchase(contact!.id, purchaseFormToPayload(values, visitId)),
    onSuccess: async (purchase) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["contacts"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["repurchases"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
        queryClient.invalidateQueries({ queryKey: ["agenda"] }),
        queryClient.invalidateQueries({ queryKey: ["routes"] }),
        queryClient.invalidateQueries({ queryKey: ["photos", contact!.id] }),
      ]);
      await onSuccess?.(purchase);
    },
  });

  useEffect(() => {
    if (!open) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !mutation.isPending) onClose();
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [open, mutation.isPending, onClose]);

  const watchedPaid = form.watch("valorPago");
  const watchedWeight = form.watch("pesoG");
  const pricePerGram = calculatePurchasePricePerGram(watchedPaid, watchedWeight);

  if (!open) return null;

  const inputClass = "w-full rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--kanzler-blue)] focus:ring-4 focus:ring-[var(--kanzler-blue-soft)] disabled:bg-[var(--kanzler-canvas)]";
  const errorClass = "mt-1 text-[11.5px] text-[var(--kanzler-red)]";

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-[#0e1a2b]/45 p-3 backdrop-blur-[1px] sm:p-6">
      <div className="flex max-h-[94vh] w-full max-w-[800px] flex-col overflow-hidden rounded-2xl border border-[var(--kanzler-line)] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--kanzler-line)] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--kanzler-green-soft)] text-[var(--kanzler-green)]">
                <ShoppingBag size={18} />
              </span>
              <div>
                <h2 className="kanzler-display text-lg font-semibold text-[var(--kanzler-ink)]">Registrar compra</h2>
                <p className="mt-0.5 truncate text-[12px] text-[var(--kanzler-muted)]">
                  {contact ? `${contact.nome} · ${contact.cidade.nome} - ${contact.cidade.uf}` : "Carregando cliente..."}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--kanzler-muted)] hover:bg-[var(--kanzler-canvas)] disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </header>

        {!contact ? (
          <div className="flex min-h-56 items-center justify-center text-sm text-[var(--kanzler-muted)]">Carregando dados da cliente...</div>
        ) : (
          <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {visitId && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#cbd8f7] bg-[var(--kanzler-blue-soft)] px-3.5 py-3 text-[12px] leading-5 text-[var(--kanzler-blue)]">
                  <Info size={16} className="mt-0.5 shrink-0" />
                  Esta compra será vinculada à visita concluída na agenda. O backend valida se a visita pertence a esta cliente.
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SectionTitle>Corte e cabelo</SectionTitle>

                <label>
                  <Label required>Data do corte</Label>
                  <input {...form.register("dataCorte")} type="date" className={inputClass} />
                  {form.formState.errors.dataCorte && <p className={errorClass}>{form.formState.errors.dataCorte.message}</p>}
                </label>

                <label>
                  <Label>Peso (g)</Label>
                  <input {...form.register("pesoG")} inputMode="numeric" placeholder="Ex.: 420" className={inputClass} />
                  {form.formState.errors.pesoG && <p className={errorClass}>{form.formState.errors.pesoG.message}</p>}
                </label>

                <label>
                  <Label>Comprimento (cm)</Label>
                  <input {...form.register("comprimentoCm")} inputMode="numeric" placeholder="Ex.: 72" className={inputClass} />
                  {form.formState.errors.comprimentoCm && <p className={errorClass}>{form.formState.errors.comprimentoCm.message}</p>}
                </label>

                <label>
                  <Label>Cor</Label>
                  <select {...form.register("cor")} className={inputClass}>
                    <option value="">-</option>
                    {colors.map((color) => <option key={color} value={color}>{color}</option>)}
                  </select>
                </label>

                <label>
                  <Label>Textura</Label>
                  <select {...form.register("textura")} className={inputClass}>
                    <option value="">-</option>
                    {textures.map((texture) => <option key={texture} value={texture}>{texture}</option>)}
                  </select>
                </label>

                <label>
                  <Label>Química</Label>
                  <select {...form.register("quimica")} className={inputClass}>
                    <option value="">-</option>
                    {chemicals.map((chemical) => <option key={chemical} value={chemical}>{chemical}</option>)}
                  </select>
                </label>

                <SectionTitle>Negociação</SectionTitle>

                <label>
                  <Label required>Valor pago (R$)</Label>
                  <input {...form.register("valorPago")} inputMode="decimal" placeholder="Ex.: 1850,00" className={inputClass} />
                  {form.formState.errors.valorPago && <p className={errorClass}>{form.formState.errors.valorPago.message}</p>}
                </label>

                <label>
                  <Label required>Forma de pagamento</Label>
                  <select {...form.register("formaPagamento")} className={inputClass}>
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </label>

                <div>
                  <Label>Preço por grama</Label>
                  <div className="flex min-h-[42px] items-center rounded-[10px] border border-[var(--kanzler-line)] bg-[var(--kanzler-canvas)] px-3 text-sm font-semibold text-[var(--kanzler-ink)]">
                    {pricePerGram === null ? "-" : `${formatCurrency(pricePerGram)}/g`}
                  </div>
                </div>

                <SectionTitle>Revenda</SectionTitle>

                <label>
                  <Label>Valor de revenda (R$)</Label>
                  <input {...form.register("valorRevenda")} inputMode="decimal" placeholder="Preencher quando houver" className={inputClass} />
                  {form.formState.errors.valorRevenda && <p className={errorClass}>{form.formState.errors.valorRevenda.message}</p>}
                </label>

                <label>
                  <Label>Data da revenda</Label>
                  <input {...form.register("dataRevenda")} type="date" className={inputClass} />
                  {form.formState.errors.dataRevenda && <p className={errorClass}>{form.formState.errors.dataRevenda.message}</p>}
                </label>

                <label>
                  <Label>Comprador</Label>
                  <input {...form.register("comprador")} placeholder="Nome/empresa" className={inputClass} />
                  {form.formState.errors.comprador && <p className={errorClass}>{form.formState.errors.comprador.message}</p>}
                </label>
              </div>

              <div className="mt-5 rounded-xl border border-[var(--kanzler-line)] bg-[var(--kanzler-canvas)] px-4 py-3 text-[12px] leading-5 text-[var(--kanzler-muted)]">
                <div className="flex items-start gap-2">
                  <CircleDollarSign size={16} className="mt-0.5 shrink-0 text-[var(--kanzler-green)]" />
                  <span>Ao salvar, o backend cria a compra em transação, altera o contato para <strong>Comprado</strong>, registra a auditoria e recalcula a recompra a partir da nova data de corte.</span>
                </div>
              </div>

              {mutation.isError && (
                <div className="mt-4 rounded-[10px] border border-[#f2caca] bg-[var(--kanzler-red-soft)] px-3 py-2.5 text-sm text-[var(--kanzler-red)]">
                  {messageFromError(mutation.error)}
                </div>
              )}
            </div>

            <footer className="flex flex-col-reverse gap-2 border-t border-[var(--kanzler-line)] bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={onClose}
                disabled={mutation.isPending}
                className="rounded-[10px] border border-[var(--kanzler-line)] bg-white px-4 py-2.5 text-sm font-semibold hover:bg-[var(--kanzler-canvas)] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="rounded-[10px] bg-[var(--kanzler-green)] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
              >
                {mutation.isPending ? "Registrando..." : "Registrar compra"}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}
