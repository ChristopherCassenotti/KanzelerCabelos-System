import { http } from "../api/http";
import type {
  ChangeContactStatusPayload,
  City,
  ContactDetail,
  ContactExportFilters,
  ContactListItem,
  ContactOverview,
  ContactPayload,
  ContactSearchResult,
  CreateContactWithPurchasePayload,
  CreateContactWithPurchaseResponse,
  UpdateContactPayload,
} from "../../types/contact";

export async function searchContacts(query: string) {
  const response = await http.get<ContactSearchResult[]>("/contatos/busca", {
    params: { q: query },
  });

  return response.data;
}

export async function listContacts() {
  const response = await http.get<ContactListItem[]>("/contatos");
  return response.data;
}

export async function getContact(contactId: string) {
  const response = await http.get<ContactDetail>(`/contatos/${contactId}`);
  return response.data;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
) {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );

  return results;
}

export async function listContactOverviews(): Promise<ContactOverview[]> {
  const contacts = await listContacts();

  const overviews = await mapWithConcurrency(contacts, 6, async (contact) => {
    try {
      return await getContact(contact.id);
    } catch {
      return {
        ...contact,
        cidade: null,
        compras: [],
        recompra: null,
        fotos: [],
      } satisfies ContactOverview;
    }
  });

  return overviews.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function listCities() {
  const response = await http.get<City[]>("/cidades");
  return response.data;
}

export async function createContact(payload: ContactPayload) {
  const response = await http.post<ContactListItem>("/contatos", payload);
  return response.data;
}

/** Cadastro operacional: contato + compra numa única transação no backend. */
export async function createContactWithPurchase(payload: CreateContactWithPurchasePayload) {
  const response = await http.post<CreateContactWithPurchaseResponse>("/contatos/com-compra", payload);
  return response.data;
}

export async function updateContact(contactId: string, payload: UpdateContactPayload) {
  const response = await http.patch<ContactListItem>(`/contatos/${contactId}`, payload);
  return response.data;
}

export async function changeContactStatus(contactId: string, payload: ChangeContactStatusPayload) {
  const response = await http.patch<ContactListItem>(`/contatos/${contactId}/status`, payload);
  return response.data;
}

export async function softDeleteContact(contactId: string) {
  await http.delete(`/contatos/${contactId}`);
}

export async function hardDeleteContact(contactId: string) {
  await http.delete(`/contatos/${contactId}/definitivo`);
}

export async function exportContacts(filters: ContactExportFilters) {
  const response = await http.get<Blob>("/export/contatos", {
    params: filters,
    responseType: "blob",
  });

  return response.data;
}
