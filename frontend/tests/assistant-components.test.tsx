import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AssistantMessageBubble } from "../src/components/assistant/AssistantMessageBubble";
import { ContactDraftCard } from "../src/components/assistant/ContactDraftCard";
import type { AssistantContactDraft } from "../src/types/assistant";

const noop = () => undefined;

const draft: AssistantContactDraft = {
  nome: "Juliana Ferreira",
  telefone: "42999998888",
  cidadeId: "11111111-1111-4111-8111-111111111111",
  cidadeNome: "União da Vitória",
  cidadeUf: "PR",
  endereco: null,
  origem: null,
  indicadoPor: null,
  dataPrimeiroContato: null,
  dataAvaliacao: null,
  natural: null,
  cor: null,
  textura: null,
  quimica: null,
  comprimentoCm: null,
  observacoes: null,
  autorizouFoto: false,
  dataCorte: null,
  pesoG: 420,
  valorPago: "1850.00",
  formaPagamento: "Pix",
  valorRevenda: null,
  dataRevenda: null,
  comprador: null,
};

describe("ContactDraftCard", () => {
  it("exibe resumo e ações de confirmar, editar e cancelar", () => {
    const html = renderToStaticMarkup(
      <ContactDraftCard
        draft={draft}
        duplicates={[]}
        photos={[]}
        onRemovePhoto={noop}
        confirming={false}
        disabled={false}
        onConfirm={noop}
        onEdit={noop}
        onCancel={noop}
        onOpenContact={noop}
      />,
    );

    expect(html).toContain("Juliana Ferreira");
    expect(html).toContain("União da Vitória - PR");
    expect(html).toContain("Confirmar cadastro");
    expect(html).toContain("Editar informações");
    expect(html).toContain("Cancelar");
    expect(html).not.toContain("Natural");
  });

  it("desabilita ações durante o cadastro e alerta duplicidade", () => {
    const html = renderToStaticMarkup(
      <ContactDraftCard
        draft={draft}
        duplicates={[{ id: "c-1", nome: "Juliana F.", telefone: null, cidade: null, motivo: "telefone" }]}
        photos={[]}
        onRemovePhoto={noop}
        confirming
        disabled
        onConfirm={noop}
        onEdit={noop}
        onCancel={noop}
        onOpenContact={noop}
      />,
    );

    expect(html).toContain("Cadastrando...");
    expect(html).toContain("Possível contato duplicado");
    expect(html.match(/disabled=""/g)?.length).toBe(3);
  });
});

describe("AssistantMessageBubble", () => {
  it("mostra sucesso real com nome, cidade e botão Abrir ficha", () => {
    const html = renderToStaticMarkup(
      <AssistantMessageBubble
        message={{
          id: "s",
          role: "assistant",
          text: "Contato e compra cadastrados com sucesso",
          tone: "success",
          notices: [],
          includeInHistory: false,
          createdContact: { id: "99", nome: "Juliana Ferreira", cidade: { id: "c", nome: "União da Vitória", uf: "PR" } },
        }}
        busy={false}
        onRetry={noop}
        onOpenContact={noop}
      />,
    );

    expect(html).toContain("Contato e compra cadastrados com sucesso");
    expect(html).toContain("Juliana Ferreira");
    expect(html).toContain("Abrir ficha");
  });

  it("mostra erro com opção de tentar novamente", () => {
    const html = renderToStaticMarkup(
      <AssistantMessageBubble
        message={{
          id: "e",
          role: "assistant",
          text: "O assistente está indisponível no momento.",
          tone: "error",
          notices: [],
          includeInHistory: false,
          retry: { type: "message", payload: { mensagem: "oi", historico: [], rascunho: null } },
        }}
        busy={false}
        onRetry={noop}
        onOpenContact={noop}
      />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Tentar novamente");
  });
});

describe("fotos na interface", () => {
  const photo = (id: string, status: "pending" | "uploaded" | "failed" = "pending") => ({
    id,
    file: new File(["x"], "f.jpg", { type: "image/jpeg" }),
    previewUrl: `blob:${id}`,
    status,
  });

  it("card mostra as fotos com remover e consentimento Sim", () => {
    const html = renderToStaticMarkup(
      <ContactDraftCard
        draft={draft}
        duplicates={[]}
        photos={[photo("a"), photo("b")]}
        onRemovePhoto={noop}
        confirming={false}
        disabled={false}
        onConfirm={noop}
        onEdit={noop}
        onCancel={noop}
        onOpenContact={noop}
      />,
    );

    expect(html).toContain("Fotos (2)");
    expect(html).toContain('src="blob:a"');
    expect(html).toContain("Remover foto 2");
    expect(html).toMatch(/Autorizou fotos<\/dt><dd[^>]*>Sim/);
  });

  it("mensagem do usuário mostra texto e fotos juntos", () => {
    const html = renderToStaticMarkup(
      <AssistantMessageBubble
        message={{
          id: "u",
          role: "user",
          text: "Cadastre a Juliana",
          tone: "default",
          notices: [],
          includeInHistory: true,
          attachments: [photo("a")],
        }}
        busy={false}
        onRetry={noop}
        onOpenContact={noop}
      />,
    );

    expect(html).toContain("Cadastre a Juliana");
    expect(html).toContain('src="blob:a"');
  });

  it("sucesso com falha de foto oferece reenviar fotos", () => {
    const html = renderToStaticMarkup(
      <AssistantMessageBubble
        message={{
          id: "s",
          role: "assistant",
          text: "Contato e compra cadastrados com sucesso",
          tone: "success",
          notices: [],
          includeInHistory: false,
          createdContact: { id: "99", nome: "Juliana", cidade: { id: "c", nome: "União da Vitória", uf: "PR" } },
          photoUpload: { contactId: "99", photos: [photo("a", "uploaded"), photo("b", "failed")] },
        }}
        busy={false}
        onRetry={noop}
        onOpenContact={noop}
        onRetryUploads={noop}
      />,
    );

    expect(html).toContain("1 de 2 fotos enviadas");
    expect(html).toContain("Reenviar fotos");
    expect(html).toContain("Abrir ficha");
  });
});

describe("card de confirmação com compra", () => {
  it("mostra a seção Compra e informa que a cliente nasce como Comprado", () => {
    const html = renderToStaticMarkup(
      <ContactDraftCard
        draft={draft}
        duplicates={[]}
        photos={[]}
        onRemovePhoto={noop}
        confirming={false}
        disabled={false}
        onConfirm={noop}
        onEdit={noop}
        onCancel={noop}
        onOpenContact={noop}
      />,
    );

    expect(html).toContain("Compra");
    expect(html).toContain("Valor pago");
    expect(html).toContain("Pix");
    expect(html).toContain("420 g");
    expect(html).toContain("Hoje (padrão)");
    expect(html).toContain("já como Comprado");
  });
});
