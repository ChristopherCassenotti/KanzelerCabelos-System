import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Download,
  Edit3,
  MapPin,
  MessageCircle,
  Plus,
  RefreshCw,
  SearchX,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ContactDrawer } from "../components/contacts/ContactDrawer";
import { ContactFormModal } from "../components/contacts/ContactFormModal";
import { ContactStatusBadge } from "../components/contacts/ContactStatusBadge";
import { PurchaseFormModal } from "../components/purchases/PurchaseFormModal";
import { ConfirmDialog } from "../components/contacts/ConfirmDialog";
import type { ContactFormValues, ContactWithPurchaseFormValues } from "../schemas/contact.schema";
import {
  changeContactStatus,
  createContactWithPurchase,
  exportContacts,
  getContact,
  hardDeleteContact,
  listCities,
  listContactOverviews,
  softDeleteContact,
  updateContact,
} from "../services/contacts/contacts.service";
import type { ContactDetail, ContactExportFilters, ContactStatus } from "../types/contact";
import {
  buildMapsUrl,
  buildWhatsAppUrl,
  formatCurrency,
  formatDate,
  formatPhone,
  initials,
  latestPurchase,
  pricePerGram,
  repurchaseLabel,
} from "../utils/contact";
import { formValuesToCreateWithPurchasePayload, formValuesToUpdatePayload } from "../utils/contact-form";

function numberToBRL(value: number | null) {
  if (value === null) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ContactsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("contato");
  const isCreateOpen = searchParams.get("novo") === "1";
  const isPurchaseOpen = Boolean(selectedId) && searchParams.get("compra") === "1";
  const purchaseVisitId = searchParams.get("visita");

  const [editingContact, setEditingContact] = useState<ContactDetail | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmMode, setConfirmMode] = useState<"soft" | "hard" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [naturalFilter, setNaturalFilter] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const contactsQuery = useQuery({
    queryKey: ["contacts", "overview"],
    queryFn: listContactOverviews,
    staleTime: 30_000,
  });

  const citiesQuery = useQuery({
    queryKey: ["cities"],
    queryFn: listCities,
    staleTime: 10 * 60_000,
  });

  const selectedContactQuery = useQuery({
    queryKey: ["contacts", "detail", selectedId],
    queryFn: () => getContact(selectedId!),
    enabled: Boolean(selectedId),
    staleTime: 10_000,
  });

  const contacts = contactsQuery.data ?? [];
  const cities = citiesQuery.data ?? [];

  const origins = useMemo(
    () => Array.from(new Set(contacts.map((contact) => contact.origem).filter((origin): origin is string => Boolean(origin)))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [contacts],
  );

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      if (cityFilter && contact.cidade?.id !== cityFilter) return false;
      if (statusFilter && contact.status !== statusFilter) return false;
      if (originFilter && contact.origem !== originFilter) return false;
      if (naturalFilter === "true" && contact.natural !== true) return false;
      if (naturalFilter === "false" && contact.natural !== false) return false;
      return true;
    });
  }, [contacts, cityFilter, statusFilter, originFilter, naturalFilter]);

  async function invalidateContactArea(contactId?: string) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["contacts"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["repurchases"] }),
      queryClient.invalidateQueries({ queryKey: ["reports"] }),
      ...(contactId ? [queryClient.invalidateQueries({ queryKey: ["contacts", "detail", contactId] })] : []),
    ]);
  }

  const createMutation = useMutation({
    mutationFn: (values: ContactWithPurchaseFormValues) =>
      createContactWithPurchase(formValuesToCreateWithPurchasePayload(values)),
    onSuccess: async ({ contato }) => {
      setFormError(null);
      await Promise.all([
        invalidateContactArea(contato.id),
        // A compra nova também afeta agenda (candidatos), rotas e mapa.
        queryClient.invalidateQueries({ queryKey: ["agenda"] }),
        queryClient.invalidateQueries({ queryKey: ["routes"] }),
        queryClient.invalidateQueries({ queryKey: ["map"] }),
      ]);
      const next = new URLSearchParams(searchParams);
      next.delete("novo");
      next.set("contato", contato.id);
      setSearchParams(next);
      setToast("Contato e compra registrados com sucesso.");
    },
    onError: (error) => setFormError(errorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ContactFormValues }) => updateContact(id, formValuesToUpdatePayload(values)),
    onSuccess: async (_, variables) => {
      setFormError(null);
      setEditingContact(null);
      await invalidateContactArea(variables.id);
      setToast("Contato atualizado com sucesso.");
    },
    onError: (error) => setFormError(errorMessage(error)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, motivoPerda }: { id: string; status: ContactStatus; motivoPerda?: string }) =>
      changeContactStatus(id, {
        status,
        ...(motivoPerda ? { motivoPerda } : {}),
      }),
    onSuccess: async (_, variables) => {
      setActionError(null);
      await invalidateContactArea(variables.id);
      setToast("Status atualizado.");
    },
    onError: (error) => setActionError(errorMessage(error)),
  });

  const softDeleteMutation = useMutation({
    mutationFn: (id: string) => softDeleteContact(id),
    onSuccess: async (_, id) => {
      setConfirmMode(null);
      closeContact();
      await invalidateContactArea(id);
      setToast("Contato removido da operação.");
    },
    onError: (error) => setActionError(errorMessage(error)),
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (id: string) => hardDeleteContact(id),
    onSuccess: async (_, id) => {
      setConfirmMode(null);
      closeContact();
      await invalidateContactArea(id);
      setToast("Contato e dados vinculados excluídos definitivamente.");
    },
    onError: (error) => setActionError(errorMessage(error)),
  });

  function openContact(id: string) {
    const next = new URLSearchParams(searchParams);
    next.delete("novo");
    next.delete("compra");
    next.delete("visita");
    next.set("contato", id);
    setSearchParams(next);
    setActionError(null);
  }

  function closeContact() {
    const next = new URLSearchParams(searchParams);
    next.delete("contato");
    next.delete("compra");
    next.delete("visita");
    setSearchParams(next, { replace: true });
    setActionError(null);
  }


  function openPurchase(contactId: string, visitId?: string | null) {
    const next = new URLSearchParams(searchParams);
    next.delete("novo");
    next.set("contato", contactId);
    next.set("compra", "1");
    if (visitId) next.set("visita", visitId);
    else next.delete("visita");
    setSearchParams(next);
    setActionError(null);
  }

  function closePurchase() {
    const next = new URLSearchParams(searchParams);
    next.delete("compra");
    next.delete("visita");
    setSearchParams(next, { replace: true });
  }

  function openNewContact() {
    const next = new URLSearchParams(searchParams);
    next.delete("contato");
    next.delete("compra");
    next.delete("visita");
    next.set("novo", "1");
    setSearchParams(next);
    setFormError(null);
  }

  function closeNewContact() {
    const next = new URLSearchParams(searchParams);
    next.delete("novo");
    setSearchParams(next, { replace: true });
    setFormError(null);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const filters: ContactExportFilters = {};
      if (cityFilter) filters.cidadeId = cityFilter;
      if (statusFilter) filters.status = statusFilter as ContactStatus;
      if (originFilter) filters.origem = originFilter;
      if (naturalFilter) filters.natural = naturalFilter === "true";
      const blob = await exportContacts(filters);
      downloadBlob(blob, "contatos-kanzler.xlsx");
      setToast("Planilha de contatos gerada.");
    } catch (error) {
      setToast(errorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  const anyMutationPending = statusMutation.isPending || softDeleteMutation.isPending || hardDeleteMutation.isPending;
  const mainError = contactsQuery.isError ? errorMessage(contactsQuery.error) : citiesQuery.isError ? errorMessage(citiesQuery.error) : null;

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[1600] max-w-[92vw] -translate-x-1/2 rounded-xl bg-[var(--kanzler-navy)] px-4 py-3 text-sm font-medium text-white shadow-2xl">
          <div className="flex items-center gap-3">
            <span>{toast}</span>
            <button type="button" onClick={() => setToast(null)} className="text-white/70 hover:text-white">×</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} className="rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3 py-2.5 text-[13px] font-medium outline-none focus:border-[var(--kanzler-blue)]">
          <option value="">Todas as cidades</option>
          {cities.map((city) => <option key={city.id} value={city.id}>{city.nome}</option>)}
        </select>

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3 py-2.5 text-[13px] font-medium outline-none focus:border-[var(--kanzler-blue)]">
          <option value="">Todos os status</option>
          <option value="lead">Lead</option>
          <option value="avaliacao_agendada">Avaliação agendada</option>
          <option value="comprado">Comprado</option>
          <option value="perdido">Perdido</option>
        </select>

        <select value={originFilter} onChange={(event) => setOriginFilter(event.target.value)} className="rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3 py-2.5 text-[13px] font-medium outline-none focus:border-[var(--kanzler-blue)]">
          <option value="">Todas as origens</option>
          {origins.map((origin) => <option key={origin} value={origin}>{origin}</option>)}
        </select>

        <select value={naturalFilter} onChange={(event) => setNaturalFilter(event.target.value)} className="rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3 py-2.5 text-[13px] font-medium outline-none focus:border-[var(--kanzler-blue)]">
          <option value="">Natural: todos</option>
          <option value="true">Cabelo natural</option>
          <option value="false">Com química / não natural</option>
        </select>

        <button type="button" onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[var(--kanzler-ink)] hover:bg-[var(--kanzler-canvas)] disabled:opacity-50">
          <Download size={15} /> {exporting ? "Exportando..." : "Exportar Excel"}
        </button>

        <button type="button" onClick={openNewContact} className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--kanzler-blue)] px-3.5 py-2.5 text-[13px] font-semibold text-white hover:bg-[var(--kanzler-blue-dark)]">
          <Plus size={16} /> Novo contato + compra
        </button>

        <span className="ml-auto text-[12.5px] text-[var(--kanzler-muted)]">
          {filteredContacts.length} de {contacts.length} contatos
        </span>
      </div>

      {mainError && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#f2caca] bg-[var(--kanzler-red-soft)] px-4 py-3 text-sm text-[var(--kanzler-red)] sm:flex-row sm:items-center">
          <span className="flex items-center gap-2"><AlertCircle size={17} /> {mainError}</span>
          <button type="button" onClick={() => void Promise.all([contactsQuery.refetch(), citiesQuery.refetch()])} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 font-semibold sm:ml-auto">
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white shadow-[var(--kanzler-shadow)]">
        {contactsQuery.isPending ? (
          <div className="space-y-px bg-[var(--kanzler-line)]">
            {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-[66px] animate-pulse bg-white" />)}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="grid min-h-[360px] place-items-center px-6 py-14 text-center">
            <div>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--kanzler-canvas)] text-[var(--kanzler-muted-2)]"><SearchX size={22} /></span>
              <h2 className="kanzler-display mt-3 text-base font-semibold">Nenhum contato encontrado</h2>
              <p className="mt-1 text-sm text-[var(--kanzler-muted)]">Ajuste os filtros ou cadastre um novo contato.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1120px] border-collapse">
                <thead>
                  <tr className="bg-[#fbfcfe] text-left text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[var(--kanzler-muted)]">
                    <th className="border-b border-[var(--kanzler-line)] px-4 py-3">Contato</th>
                    <th className="border-b border-[var(--kanzler-line)] px-4 py-3">Cidade</th>
                    <th className="border-b border-[var(--kanzler-line)] px-4 py-3">Status</th>
                    <th className="border-b border-[var(--kanzler-line)] px-4 py-3">Cabelo</th>
                    <th className="border-b border-[var(--kanzler-line)] px-4 py-3 text-right">Valor pago</th>
                    <th className="border-b border-[var(--kanzler-line)] px-4 py-3 text-right">R$/g</th>
                    <th className="border-b border-[var(--kanzler-line)] px-4 py-3">Data do corte</th>
                    <th className="border-b border-[var(--kanzler-line)] px-4 py-3">Próxima recompra</th>
                    <th className="border-b border-[var(--kanzler-line)] px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => {
                    const purchase = latestPurchase(contact);
                    const gramPrice = pricePerGram(purchase);
                    const whatsapp = buildWhatsAppUrl(contact.telefone);
                    const maps = buildMapsUrl(contact);
                    return (
                      <tr key={contact.id} onClick={() => openContact(contact.id)} className="cursor-pointer border-b border-[var(--kanzler-line)] last:border-b-0 hover:bg-[#fbfcfe]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--kanzler-blue-soft)] text-[11px] font-bold text-[var(--kanzler-blue)]">{initials(contact.nome)}</span>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold">{contact.nome}</p>
                              <p className="mt-0.5 truncate text-[11.5px] text-[var(--kanzler-muted)]">{formatPhone(contact.telefone)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[12.5px]">{contact.cidade?.nome ?? "-"}</td>
                        <td className="px-4 py-3"><ContactStatusBadge status={contact.status} /></td>
                        <td className="px-4 py-3 text-[12px] text-[var(--kanzler-ink)]">{[purchase?.cor ?? contact.cor, purchase?.textura ?? contact.textura, (purchase?.comprimentoCm ?? contact.comprimentoCm) ? `${purchase?.comprimentoCm ?? contact.comprimentoCm} cm` : null].filter(Boolean).join(" · ") || "-"}</td>
                        <td className="px-4 py-3 text-right text-[12.5px] font-semibold">{purchase ? formatCurrency(purchase.valorPago) : "-"}</td>
                        <td className="px-4 py-3 text-right text-[12px]">{gramPrice === null ? "-" : `${numberToBRL(gramPrice)}/g`}</td>
                        <td className="px-4 py-3 text-[12px]">{formatDate(purchase?.dataCorte)}</td>
                        <td className="px-4 py-3">
                          {contact.recompra ? (
                            <span
                              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                contact.recompra.diasAte <= 0
                                  ? "bg-[var(--kanzler-red-soft)] text-[var(--kanzler-red)]"
                                  : contact.recompra.pronta
                                    ? "bg-[var(--kanzler-amber-soft)] text-[var(--kanzler-amber)]"
                                    : "bg-[#eef1f5] text-[var(--kanzler-muted)]"
                              }`}
                              title={repurchaseLabel(contact.recompra.diasAte)}
                            >
                              {formatDate(contact.recompra.proximaRecompra)}
                            </span>
                          ) : "-"}
                        </td>
                        <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            {whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--kanzler-line)] text-[var(--kanzler-muted)] hover:border-[#83c6a4] hover:text-[var(--kanzler-green)]" title="WhatsApp"><MessageCircle size={15} /></a>}
                            {maps && <a href={maps} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--kanzler-line)] text-[var(--kanzler-muted)] hover:text-[var(--kanzler-blue)]" title="Mapa"><MapPin size={15} /></a>}
                            <button type="button" onClick={() => openContact(contact.id)} className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--kanzler-line)] text-[var(--kanzler-muted)] hover:text-[var(--kanzler-blue)]" title="Abrir ficha"><Edit3 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[var(--kanzler-line)] lg:hidden">
              {filteredContacts.map((contact) => {
                const purchase = latestPurchase(contact);
                return (
                  <button key={contact.id} type="button" onClick={() => openContact(contact.id)} className="flex w-full items-start gap-3 px-4 py-4 text-left hover:bg-[#fbfcfe]">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--kanzler-blue-soft)] text-[11px] font-bold text-[var(--kanzler-blue)]">{initials(contact.nome)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2"><strong className="truncate text-[13.5px]">{contact.nome}</strong><ContactStatusBadge status={contact.status} /></span>
                      <span className="mt-1 block text-[12px] text-[var(--kanzler-muted)]">{contact.cidade?.nome ?? "Cidade não carregada"} · {formatPhone(contact.telefone)}</span>
                      <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-[var(--kanzler-muted)]">
                        <span>{purchase ? formatCurrency(purchase.valorPago) : "Sem compra"}</span>
                        <span>{purchase ? `corte ${formatDate(purchase.dataCorte)}` : ""}</span>
                        {contact.recompra && <span className={contact.recompra.pronta ? "font-semibold text-[var(--kanzler-red)]" : ""}>{repurchaseLabel(contact.recompra.diasAte)}</span>}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      <ContactFormModal
        open={isCreateOpen}
        mode="create"
        cities={cities}
        pending={createMutation.isPending}
        error={formError}
        onClose={closeNewContact}
        onSubmit={(values) => createMutation.mutateAsync(values)}
      />

      <ContactFormModal
        open={Boolean(editingContact)}
        mode="edit"
        contact={editingContact}
        cities={cities}
        pending={updateMutation.isPending}
        error={formError}
        onClose={() => { setEditingContact(null); setFormError(null); }}
        onSubmit={(values) => editingContact ? updateMutation.mutateAsync({ id: editingContact.id, values }) : Promise.resolve()}
      />

      <ContactDrawer
        contact={selectedContactQuery.data ?? null}
        loading={Boolean(selectedId) && selectedContactQuery.isPending}
        actionPending={anyMutationPending}
        actionError={selectedContactQuery.isError ? errorMessage(selectedContactQuery.error) : actionError}
        onClose={closeContact}
        onEdit={(contact) => { setEditingContact(contact); setFormError(null); }}
        onRegisterPurchase={(contact) => openPurchase(contact.id)}
        onChangeStatus={(status, motivoPerda) => selectedId ? statusMutation.mutateAsync({ id: selectedId, status, motivoPerda }) : Promise.resolve()}
        onSoftDelete={() => setConfirmMode("soft")}
        onHardDelete={() => setConfirmMode("hard")}
      />

      <PurchaseFormModal
        open={isPurchaseOpen}
        contact={selectedContactQuery.data ?? null}
        visitId={purchaseVisitId}
        onClose={closePurchase}
        onSuccess={async () => {
          closePurchase();
          if (selectedId) await invalidateContactArea(selectedId);
          setToast("Compra registrada. Status, recompra e relatórios foram atualizados.");
        }}
      />

      <ConfirmDialog
        open={confirmMode === "soft"}
        title="Excluir contato da operação?"
        description="O contato será removido das telas normais, mas continuará registrado fisicamente no banco como exclusão lógica."
        confirmLabel="Excluir contato"
        destructive
        pending={softDeleteMutation.isPending}
        onCancel={() => setConfirmMode(null)}
        onConfirm={() => selectedId && softDeleteMutation.mutate(selectedId)}
      />

      <ConfirmDialog
        open={confirmMode === "hard"}
        title="Exclusão definitiva LGPD"
        description="Esta ação apaga definitivamente o contato, fotos privadas, compras e visitas vinculadas. Não é possível desfazer."
        confirmLabel="Excluir definitivamente"
        destructive
        strongConfirm
        pending={hardDeleteMutation.isPending}
        onCancel={() => setConfirmMode(null)}
        onConfirm={() => selectedId && hardDeleteMutation.mutate(selectedId)}
      />
    </div>
  );
}
