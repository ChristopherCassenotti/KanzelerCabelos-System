import type { ContactDetail, ContactPayload, UpdateContactPayload } from "../types/contact";
import type { ContactFormValues, ContactWithPurchaseFormValues } from "../schemas/contact.schema";
import type { CreateContactWithPurchasePayload } from "../types/contact";
import { purchaseFormToPayload } from "./purchase";
import { getTodayInSaoPauloISO } from "./date";

export function createEmptyContactFormValues(): ContactFormValues {
  return {
    nome: "",
    telefone: "",
    cidadeId: "",
    endereco: "",
    origem: "",
    indicadoPor: "",
    dataPrimeiroContato: getTodayInSaoPauloISO(),
    dataAvaliacao: "",
    natural: "",
    cor: "",
    textura: "",
    quimica: "",
    comprimentoCm: "",
    autorizouFoto: false,
    observacoes: "",
  };
}

export function contactToFormValues(contact: ContactDetail): ContactFormValues {
  return {
    nome: contact.nome,
    telefone: contact.telefone ?? "",
    cidadeId: contact.cidadeId,
    endereco: contact.endereco ?? "",
    origem: contact.origem ?? "",
    indicadoPor: contact.indicadoPor ?? "",
    dataPrimeiroContato: contact.dataPrimeiroContato ?? "",
    dataAvaliacao: contact.dataAvaliacao ?? "",
    natural: contact.natural === null ? "" : contact.natural ? "true" : "false",
    cor: contact.cor ?? "",
    textura: contact.textura ?? "",
    quimica: contact.quimica ?? "",
    comprimentoCm: contact.comprimentoCm === null ? "" : String(contact.comprimentoCm),
    autorizouFoto: contact.autorizouFoto,
    observacoes: contact.observacoes ?? "",
  };
}

function nonEmpty(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function formValuesToCreatePayload(values: ContactFormValues): ContactPayload {
  return {
    nome: values.nome.trim(),
    cidadeId: values.cidadeId,
    ...(nonEmpty(values.telefone) ? { telefone: nonEmpty(values.telefone) } : {}),
    ...(nonEmpty(values.endereco) ? { endereco: nonEmpty(values.endereco) } : {}),
    ...(nonEmpty(values.origem) ? { origem: nonEmpty(values.origem) } : {}),
    ...(nonEmpty(values.indicadoPor) ? { indicadoPor: nonEmpty(values.indicadoPor) } : {}),
    ...(nonEmpty(values.dataPrimeiroContato) ? { dataPrimeiroContato: values.dataPrimeiroContato } : {}),
    ...(nonEmpty(values.dataAvaliacao) ? { dataAvaliacao: values.dataAvaliacao } : {}),
    ...(values.natural !== "" ? { natural: values.natural === "true" } : {}),
    ...(nonEmpty(values.cor) ? { cor: nonEmpty(values.cor) } : {}),
    ...(nonEmpty(values.textura) ? { textura: nonEmpty(values.textura) } : {}),
    ...(nonEmpty(values.quimica) ? { quimica: nonEmpty(values.quimica) } : {}),
    ...(values.comprimentoCm !== "" ? { comprimentoCm: Number(values.comprimentoCm) } : {}),
    autorizouFoto: values.autorizouFoto,
    ...(nonEmpty(values.observacoes) ? { observacoes: nonEmpty(values.observacoes) } : {}),
  };
}

export function formValuesToUpdatePayload(values: ContactFormValues): UpdateContactPayload {
  // O contrato atual aceita PATCH parcial. Campos vazios são omitidos para não enviar valores inválidos.
  // A limpeza explícita de campos será revisitada se o backend expuser null de forma uniforme no schema.
  return formValuesToCreatePayload(values);
}

export function createEmptyContactWithPurchaseFormValues(): ContactWithPurchaseFormValues {
  return {
    ...createEmptyContactFormValues(),
    dataCorte: getTodayInSaoPauloISO(),
    pesoG: "",
    valorPago: "",
    formaPagamento: "Pix",
    valorRevenda: "",
    dataRevenda: "",
    comprador: "",
  };
}

export function formValuesToCreateWithPurchasePayload(
  values: ContactWithPurchaseFormValues,
): CreateContactWithPurchasePayload {
  // Cabelo informado uma vez (no contato); a compra herda no backend.
  const { visitaId: _visitaId, ...compra } = purchaseFormToPayload({
    ...values,
    comprimentoCm: "",
    cor: "",
    textura: "",
    quimica: "",
  });

  return {
    contato: formValuesToCreatePayload(values),
    compra,
  };
}
