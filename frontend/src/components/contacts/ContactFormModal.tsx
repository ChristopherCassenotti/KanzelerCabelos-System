import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CircleDollarSign, X } from "lucide-react";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import {
  contactFormSchema,
  contactWithPurchaseFormSchema,
  type ContactWithPurchaseFormValues,
} from "../../schemas/contact.schema";
import type { City, ContactDetail } from "../../types/contact";
import { formatCurrency } from "../../utils/contact";
import { contactToFormValues, createEmptyContactWithPurchaseFormValues } from "../../utils/contact-form";
import { calculatePurchasePricePerGram } from "../../utils/purchase";

interface ContactFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  contact?: ContactDetail | null;
  cities: City[];
  pending?: boolean;
  error?: string | null;
  onClose: () => void;
  /** Na criação os valores incluem a compra; na edição, só o contato é usado. */
  onSubmit: (values: ContactWithPurchaseFormValues) => unknown | Promise<unknown>;
}

const origins = ["Anúncio Meta", "Indicação", "Perfil Instagram", "Van na rua", "WhatsApp direto", "Outro"];
const colors = ["Preto", "Castanho escuro", "Castanho", "Castanho claro", "Loiro", "Ruivo", "Grisalho"];
const textures = ["Liso", "Ondulado", "Cacheado", "Crespo"];
const chemicals = ["Nenhuma", "Tintura", "Luzes/mechas", "Progressiva", "Alisamento"];

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
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

export function ContactFormModal({
  open,
  mode,
  contact,
  cities,
  pending = false,
  error,
  onClose,
  onSubmit,
}: ContactFormModalProps) {
  const isCreate = mode === "create";
  const form = useForm<ContactWithPurchaseFormValues>({
    // Cadastro novo exige a compra; a edição valida só os dados do contato.
    resolver: (isCreate
      ? zodResolver(contactWithPurchaseFormSchema)
      : zodResolver(contactFormSchema)) as Resolver<ContactWithPurchaseFormValues>,
    defaultValues: createEmptyContactWithPurchaseFormValues(),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      mode === "edit" && contact
        ? { ...createEmptyContactWithPurchaseFormValues(), ...contactToFormValues(contact) }
        : createEmptyContactWithPurchaseFormValues(),
    );
  }, [open, mode, contact, form]);

  const watchedPaid = form.watch("valorPago");
  const watchedWeight = form.watch("pesoG");
  const pricePerGram = calculatePurchasePricePerGram(watchedPaid, watchedWeight);

  useEffect(() => {
    if (!open) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [open, pending, onClose]);

  if (!open) return null;

  const inputClass = "w-full rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--kanzler-blue)] focus:ring-4 focus:ring-[var(--kanzler-blue-soft)] disabled:bg-[var(--kanzler-canvas)]";
  const errorClass = "mt-1 text-[11.5px] text-[var(--kanzler-red)]";

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-[#0e1a2b]/45 p-3 backdrop-blur-[1px] sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl border border-[var(--kanzler-line)] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--kanzler-line)] px-5 py-4 sm:px-6">
          <div>
            <h2 className="kanzler-display text-lg font-semibold text-[var(--kanzler-ink)]">
              {isCreate ? "Novo contato com compra" : "Editar contato"}
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--kanzler-muted)]">
              {isCreate
                ? "A cliente é cadastrada junto com a compra do cabelo e já entra como Comprado."
                : "Atualize os dados cadastrais sem alterar regras de negócio."}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={pending} className="grid h-9 w-9 place-items-center rounded-lg text-[var(--kanzler-muted)] hover:bg-[var(--kanzler-canvas)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SectionTitle>Dados da cliente</SectionTitle>

              <label className="sm:col-span-2">
                <FieldLabel required>Nome</FieldLabel>
                <input {...form.register("nome")} className={inputClass} placeholder="Nome completo" autoFocus />
                {form.formState.errors.nome && <p className={errorClass}>{form.formState.errors.nome.message}</p>}
              </label>

              <label>
                <FieldLabel>WhatsApp</FieldLabel>
                <input {...form.register("telefone")} className={inputClass} placeholder="49 99999-9999" inputMode="tel" />
              </label>

              <label>
                <FieldLabel required>Cidade</FieldLabel>
                <select {...form.register("cidadeId")} className={inputClass}>
                  <option value="">Selecione</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>{city.nome} - {city.uf}</option>
                  ))}
                </select>
                {form.formState.errors.cidadeId && <p className={errorClass}>{form.formState.errors.cidadeId.message}</p>}
              </label>

              <label className="sm:col-span-2">
                <FieldLabel>Endereço</FieldLabel>
                <input {...form.register("endereco")} className={inputClass} placeholder="Rua, número, bairro" />
              </label>

              <SectionTitle>Origem do contato</SectionTitle>

              <label>
                <FieldLabel>Como chegou</FieldLabel>
                <select {...form.register("origem")} className={inputClass}>
                  <option value="">-</option>
                  {origins.map((origin) => <option key={origin} value={origin}>{origin}</option>)}
                </select>
              </label>

              <label>
                <FieldLabel>Indicada por</FieldLabel>
                <input {...form.register("indicadoPor")} className={inputClass} placeholder="Nome de quem indicou" />
              </label>

              <label>
                <FieldLabel>Primeiro contato</FieldLabel>
                <input {...form.register("dataPrimeiroContato")} className={inputClass} type="date" />
              </label>

              <SectionTitle>Cabelo</SectionTitle>

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
                  {colors.map((color) => <option key={color} value={color}>{color}</option>)}
                </select>
              </label>

              <label>
                <FieldLabel>Textura</FieldLabel>
                <select {...form.register("textura")} className={inputClass}>
                  <option value="">-</option>
                  {textures.map((texture) => <option key={texture} value={texture}>{texture}</option>)}
                </select>
              </label>

              <label>
                <FieldLabel>Química</FieldLabel>
                <select {...form.register("quimica")} className={inputClass}>
                  <option value="">-</option>
                  {chemicals.map((chemical) => <option key={chemical} value={chemical}>{chemical}</option>)}
                </select>
              </label>

              <label>
                <FieldLabel>Comprimento (cm)</FieldLabel>
                <input {...form.register("comprimentoCm")} className={inputClass} inputMode="numeric" placeholder="0" />
                {form.formState.errors.comprimentoCm && <p className={errorClass}>{form.formState.errors.comprimentoCm.message}</p>}
              </label>

              <label>
                <FieldLabel>Data da avaliação</FieldLabel>
                <input {...form.register("dataAvaliacao")} className={inputClass} type="date" />
              </label>

              {isCreate && (
                <>
                  <SectionTitle>Compra</SectionTitle>

                  <label>
                    <FieldLabel required>Data do corte</FieldLabel>
                    <input {...form.register("dataCorte")} className={inputClass} type="date" />
                    {form.formState.errors.dataCorte && <p className={errorClass}>{form.formState.errors.dataCorte.message}</p>}
                  </label>

                  <label>
                    <FieldLabel>Peso (g)</FieldLabel>
                    <input {...form.register("pesoG")} className={inputClass} inputMode="numeric" placeholder="Ex.: 420" />
                    {form.formState.errors.pesoG && <p className={errorClass}>{form.formState.errors.pesoG.message}</p>}
                  </label>

                  <label>
                    <FieldLabel required>Valor pago (R$)</FieldLabel>
                    <input {...form.register("valorPago")} className={inputClass} inputMode="decimal" placeholder="Ex.: 1850,00" />
                    {form.formState.errors.valorPago && <p className={errorClass}>{form.formState.errors.valorPago.message}</p>}
                  </label>

                  <label>
                    <FieldLabel required>Forma de pagamento</FieldLabel>
                    <select {...form.register("formaPagamento")} className={inputClass}>
                      <option value="Pix">Pix</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </select>
                  </label>

                  <div>
                    <FieldLabel>Preço por grama</FieldLabel>
                    <div className="flex min-h-[42px] items-center rounded-[10px] border border-[var(--kanzler-line)] bg-[var(--kanzler-canvas)] px-3 text-sm font-semibold text-[var(--kanzler-ink)]">
                      {pricePerGram === null ? "-" : `${formatCurrency(pricePerGram)}/g`}
                    </div>
                  </div>

                  <SectionTitle>Revenda (opcional)</SectionTitle>

                  <label>
                    <FieldLabel>Valor de revenda (R$)</FieldLabel>
                    <input {...form.register("valorRevenda")} className={inputClass} inputMode="decimal" placeholder="Preencher quando houver" />
                    {form.formState.errors.valorRevenda && <p className={errorClass}>{form.formState.errors.valorRevenda.message}</p>}
                  </label>

                  <label>
                    <FieldLabel>Data da revenda</FieldLabel>
                    <input {...form.register("dataRevenda")} className={inputClass} type="date" />
                    {form.formState.errors.dataRevenda && <p className={errorClass}>{form.formState.errors.dataRevenda.message}</p>}
                  </label>

                  <label>
                    <FieldLabel>Comprador</FieldLabel>
                    <input {...form.register("comprador")} className={inputClass} placeholder="Nome/empresa" />
                    {form.formState.errors.comprador && <p className={errorClass}>{form.formState.errors.comprador.message}</p>}
                  </label>

                  <div className="col-span-full flex items-start gap-2 rounded-xl border border-[var(--kanzler-line)] bg-[var(--kanzler-canvas)] px-4 py-3 text-[12px] leading-5 text-[var(--kanzler-muted)]">
                    <CircleDollarSign size={16} className="mt-0.5 shrink-0 text-[var(--kanzler-green)]" />
                    <span>
                      Ao salvar, contato e compra são criados juntos (se um falhar, nada é gravado). A cliente entra como <strong>Comprado</strong>, a compra aparece no histórico e a recompra passa a contar a partir da data do corte. Cor, textura, química e comprimento informados acima são usados na compra.
                    </span>
                  </div>
                </>
              )}

              <SectionTitle>Consentimento e observações</SectionTitle>

              <label className="col-span-full flex items-start gap-3 rounded-xl border border-[var(--kanzler-line)] bg-[var(--kanzler-canvas)] px-4 py-3">
                <input type="checkbox" {...form.register("autorizouFoto")} className="mt-1 h-4 w-4 accent-[var(--kanzler-blue)]" />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--kanzler-ink)]"><Check size={15} /> Autorização para fotos</span>
                  <span className="mt-0.5 block text-[12px] leading-5 text-[var(--kanzler-muted)]">Somente clientes com consentimento podem receber upload de fotos na etapa de galeria.</span>
                </span>
              </label>

              <label className="col-span-full">
                <FieldLabel>Observações</FieldLabel>
                <textarea {...form.register("observacoes")} className={`${inputClass} min-h-24 resize-y`} placeholder="Informações úteis para atendimento e negociação" />
              </label>
            </div>

            {error && (
              <div className="mt-4 rounded-[10px] border border-[#f2caca] bg-[var(--kanzler-red-soft)] px-3 py-2.5 text-sm text-[var(--kanzler-red)]">
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--kanzler-line)] bg-white px-5 py-4 sm:px-6">
            <button type="button" onClick={onClose} disabled={pending} className="rounded-[10px] border border-[var(--kanzler-line)] bg-white px-4 py-2.5 text-sm font-semibold hover:bg-[var(--kanzler-canvas)] disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="rounded-[10px] bg-[var(--kanzler-blue)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--kanzler-blue-dark)] disabled:opacity-50">
              {pending ? "Salvando..." : isCreate ? "Salvar contato e compra" : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
