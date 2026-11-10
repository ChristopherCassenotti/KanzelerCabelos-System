import {
  CalendarDays,
  Edit3,
  MapPin,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ContactDetail, ContactStatus } from "../../types/contact";
import {
  buildMapsUrl,
  buildWhatsAppUrl,
  formatCurrency,
  formatDate,
  formatPhone,
  initials,
  repurchaseLabel,
  statusLabels,
} from "../../utils/contact";
import { ContactStatusBadge } from "./ContactStatusBadge";
import { ContactPhotosSection } from "./ContactPhotosSection";

interface ContactDrawerProps {
  contact: ContactDetail | null;
  loading?: boolean;
  actionPending?: boolean;
  actionError?: string | null;
  onClose: () => void;
  onEdit: (contact: ContactDetail) => void;
  onRegisterPurchase: (contact: ContactDetail) => void;
  onChangeStatus: (status: ContactStatus, motivoPerda?: string) => unknown | Promise<unknown>;
  onSoftDelete: () => void;
  onHardDelete: () => void;
}

function statusOptions(current: string): ContactStatus[] {
  if (current === "lead") return ["avaliacao_agendada", "perdido"];
  if (current === "avaliacao_agendada") return ["comprado", "perdido"];
  if (current === "perdido") return ["lead"];
  return [];
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--kanzler-muted-2)]">{label}</dt>
      <dd className="mt-1 text-[13px] leading-5 text-[var(--kanzler-ink)]">{value || "-"}</dd>
    </div>
  );
}

export function ContactDrawer({
  contact,
  loading = false,
  actionPending = false,
  actionError,
  onClose,
  onEdit,
  onRegisterPurchase,
  onChangeStatus,
  onSoftDelete,
  onHardDelete,
}: ContactDrawerProps) {
  const [nextStatus, setNextStatus] = useState<ContactStatus | "">("");
  const [lossReason, setLossReason] = useState("");

  useEffect(() => {
    setNextStatus("");
    setLossReason("");
  }, [contact?.id]);

  useEffect(() => {
    if (!contact) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !actionPending) onClose();
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [contact, actionPending, onClose]);

  const options = useMemo(() => statusOptions(contact?.status ?? ""), [contact?.status]);

  if (!contact && !loading) return null;

  const whatsappUrl = contact ? buildWhatsAppUrl(contact.telefone) : null;
  const mapsUrl = contact ? buildMapsUrl(contact) : null;
  const latest = contact?.compras[0] ?? null;

  return (
    <div className="fixed inset-0 z-[1250] bg-[#0e1a2b]/35 backdrop-blur-[1px]" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[620px] flex-col bg-white shadow-2xl">
        {loading || !contact ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--kanzler-muted)]">Carregando ficha...</div>
        ) : (
          <>
            <header className="border-b border-[var(--kanzler-line)] px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--kanzler-blue-soft)] text-sm font-bold text-[var(--kanzler-blue)]">
                  {initials(contact.nome)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="kanzler-display truncate text-xl font-semibold text-[var(--kanzler-ink)]">{contact.nome}</h2>
                    <ContactStatusBadge status={contact.status} />
                  </div>
                  <p className="mt-1 text-[12px] text-[var(--kanzler-muted)]">
                    {contact.cidade.nome} - {contact.cidade.uf} · {formatPhone(contact.telefone)}
                  </p>
                </div>
                <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-[var(--kanzler-muted)] hover:bg-[var(--kanzler-canvas)]">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => onEdit(contact)} className="inline-flex items-center gap-1.5 rounded-[9px] bg-[var(--kanzler-blue)] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[var(--kanzler-blue-dark)]">
                  <Edit3 size={14} /> Editar
                </button>
                <button type="button" onClick={() => onRegisterPurchase(contact)} className="inline-flex items-center gap-1.5 rounded-[9px] border border-[#bee6d2] bg-[var(--kanzler-green-soft)] px-3 py-2 text-[12px] font-semibold text-[var(--kanzler-green)] hover:bg-[#d9f3e6]">
                  <ShoppingBag size={14} /> Registrar compra
                </button>
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-[9px] border border-[var(--kanzler-line)] bg-white px-3 py-2 text-[12px] font-semibold text-[var(--kanzler-green)] hover:bg-[var(--kanzler-green-soft)]">
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                )}
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-[9px] border border-[var(--kanzler-line)] bg-white px-3 py-2 text-[12px] font-semibold text-[var(--kanzler-ink)] hover:bg-[var(--kanzler-canvas)]">
                    <MapPin size={14} /> Mapa
                  </a>
                )}
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {contact.recompra && (
                <div className={`mb-5 rounded-xl border px-4 py-3 ${contact.recompra.pronta ? "border-[#f2d6a7] bg-[var(--kanzler-amber-soft)]" : "border-[var(--kanzler-line)] bg-[var(--kanzler-canvas)]"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--kanzler-muted)]">Próxima recompra</p>
                      <p className="kanzler-display mt-1 text-lg font-semibold">{formatDate(contact.recompra.proximaRecompra)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${contact.recompra.pronta ? "bg-white text-[var(--kanzler-amber)]" : "bg-white text-[var(--kanzler-muted)]"}`}>
                      {repurchaseLabel(contact.recompra.diasAte)}
                    </span>
                  </div>
                </div>
              )}

              <section className="border-b border-[var(--kanzler-line)] pb-5">
                <h3 className="kanzler-display text-sm font-semibold">Dados da cliente</h3>
                <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
                  <Detail label="WhatsApp" value={formatPhone(contact.telefone)} />
                  <Detail label="Cidade" value={`${contact.cidade.nome} - ${contact.cidade.uf}`} />
                  <Detail label="Origem" value={contact.origem} />
                  <Detail label="Indicada por" value={contact.indicadoPor} />
                  <Detail label="Primeiro contato" value={formatDate(contact.dataPrimeiroContato)} />
                  <Detail label="Avaliação" value={formatDate(contact.dataAvaliacao)} />
                  <Detail label="Endereço" value={contact.endereco} />
                  <Detail label="Cabelo natural" value={contact.natural === null ? "-" : contact.natural ? "Sim" : "Não"} />
                  <Detail label="Autorizou fotos" value={contact.autorizouFoto ? "Sim" : "Não"} />
                </dl>
              </section>

              <section className="border-b border-[var(--kanzler-line)] py-5">
                <h3 className="kanzler-display text-sm font-semibold">Cabelo</h3>
                <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
                  <Detail label="Cor" value={contact.cor} />
                  <Detail label="Textura" value={contact.textura} />
                  <Detail label="Química" value={contact.quimica} />
                  <Detail label="Comprimento" value={contact.comprimentoCm === null ? "-" : `${contact.comprimentoCm} cm`} />
                </dl>
              </section>

              <section className="border-b border-[var(--kanzler-line)] py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="kanzler-display text-sm font-semibold">Histórico de compras</h3>
                    <span className="text-[11.5px] text-[var(--kanzler-muted-2)]">{contact.compras.length} registro(s)</span>
                  </div>
                  <button type="button" onClick={() => onRegisterPurchase(contact)} className="inline-flex items-center gap-1.5 rounded-[9px] border border-[var(--kanzler-line)] bg-white px-3 py-2 text-[11.5px] font-semibold text-[var(--kanzler-green)] hover:bg-[var(--kanzler-green-soft)]">
                    <ShoppingBag size={13} /> Nova compra
                  </button>
                </div>

                {contact.compras.length === 0 ? (
                  <div className="mt-3 rounded-xl bg-[var(--kanzler-canvas)] px-4 py-6 text-center text-sm text-[var(--kanzler-muted)]">Nenhuma compra registrada.</div>
                ) : (
                  <div className="mt-3 overflow-hidden rounded-xl border border-[var(--kanzler-line)]">
                    {contact.compras.map((purchase) => (
                      <div key={purchase.id} className="grid grid-cols-[1fr_auto] gap-3 border-b border-[var(--kanzler-line)] px-4 py-3 last:border-b-0">
                        <div>
                          <p className="text-[13px] font-semibold">{formatDate(purchase.dataCorte)}</p>
                          <p className="mt-0.5 text-[11.5px] text-[var(--kanzler-muted)]">
                            {[purchase.cor, purchase.textura, purchase.comprimentoCm ? `${purchase.comprimentoCm} cm` : null, purchase.pesoG ? `${purchase.pesoG} g` : null].filter(Boolean).join(" · ") || "Sem características informadas"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="kanzler-display text-[13px] font-semibold">{formatCurrency(purchase.valorPago)}</p>
                          <p className="mt-0.5 text-[11px] text-[var(--kanzler-muted)]">{purchase.formaPagamento}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {latest && latest.valorRevenda !== null && latest.valorRevenda !== undefined && (
                  <p className="mt-2 text-[11.5px] text-[var(--kanzler-muted)]">Última revenda: {formatCurrency(latest.valorRevenda)}</p>
                )}
              </section>

              <ContactPhotosSection
                contact={contact}
                onRequestAuthorization={() => onEdit(contact)}
              />

              <section className="border-b border-[var(--kanzler-line)] py-5">
                <h3 className="kanzler-display text-sm font-semibold">Status</h3>
                {options.length === 0 ? (
                  <p className="mt-2 text-[12px] leading-5 text-[var(--kanzler-muted)]">O status atual não possui transição manual disponível neste fluxo. As demais mudanças são controladas pelas operações do backend.</p>
                ) : (
                  <div className="mt-3 rounded-xl border border-[var(--kanzler-line)] bg-[var(--kanzler-canvas)] p-3">
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as ContactStatus | "")} className="rounded-[9px] border border-[var(--kanzler-line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--kanzler-blue)]">
                        <option value="">Alterar status para...</option>
                        {options.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                      </select>
                      <button
                        type="button"
                        disabled={!nextStatus || actionPending || (nextStatus === "perdido" && !lossReason.trim())}
                        onClick={() => nextStatus && onChangeStatus(nextStatus, nextStatus === "perdido" ? lossReason.trim() : undefined)}
                        className="rounded-[9px] bg-[var(--kanzler-blue)] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {actionPending ? "Salvando..." : "Confirmar"}
                      </button>
                    </div>
                    {nextStatus === "perdido" && (
                      <textarea value={lossReason} onChange={(event) => setLossReason(event.target.value)} placeholder="Motivo da perda (obrigatório)" className="mt-2 min-h-20 w-full resize-y rounded-[9px] border border-[var(--kanzler-line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--kanzler-blue)]" />
                    )}
                  </div>
                )}
                {actionError && <div className="mt-2 rounded-lg bg-[var(--kanzler-red-soft)] px-3 py-2 text-[12px] text-[var(--kanzler-red)]">{actionError}</div>}
              </section>

              {contact.observacoes && (
                <section className="border-b border-[var(--kanzler-line)] py-5">
                  <h3 className="kanzler-display text-sm font-semibold">Observações</h3>
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-[var(--kanzler-muted)]">{contact.observacoes}</p>
                </section>
              )}

              <section className="pt-5">
                <div className="mb-3 flex items-center gap-2 text-[11.5px] text-[var(--kanzler-muted)]">
                  <ShieldCheck size={15} className="text-[var(--kanzler-green)]" />
                  Exclusões críticas são auditadas pelo backend.
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={onSoftDelete} disabled={actionPending} className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[var(--kanzler-line)] px-3 py-2.5 text-[12px] font-semibold text-[var(--kanzler-red)] hover:border-[#e5adad] hover:bg-[var(--kanzler-red-soft)]">
                    <Trash2 size={14} /> Excluir da operação
                  </button>
                  <button type="button" onClick={onHardDelete} disabled={actionPending} className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#e5adad] px-3 py-2.5 text-[12px] font-semibold text-[var(--kanzler-red)] hover:bg-[var(--kanzler-red-soft)]">
                    <Trash2 size={14} /> Exclusão definitiva LGPD
                  </button>
                </div>
              </section>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
