import { describe, expect, it } from "vitest";
import { hairOwnerLabel } from "../src/utils/contact";
import { createEmptyContactFormValues, formValuesToCreatePayload, formValuesToUpdatePayload } from "../src/utils/contact-form";

const base = { ...createEmptyContactFormValues(), nome: "Robert", cidadeId: "c1" };

describe("cabelo de outra pessoa", () => {
  it("descreve de quem é o cabelo", () => {
    expect(hairOwnerLabel({ cabeloDe: "filha", nomeDonoCabelo: "Ana", idadeDonoCabelo: 9 })).toBe("Cabelo da filha Ana, 9 anos");
    expect(hairOwnerLabel({ cabeloDe: "filho", nomeDonoCabelo: null, idadeDonoCabelo: null })).toBe("Cabelo do filho");
    expect(hairOwnerLabel({ cabeloDe: null, nomeDonoCabelo: null, idadeDonoCabelo: null })).toBeNull();
  });

  it("cadastro envia só o que foi preenchido", () => {
    expect(formValuesToCreatePayload({ ...base, cabeloDe: "filha", idadeDonoCabelo: "9" })).toMatchObject({ cabeloDe: "filha", idadeDonoCabelo: 9 });
    expect(formValuesToCreatePayload(base)).not.toHaveProperty("cabeloDe");
  });

  it("edição limpa os campos ao voltar para a própria pessoa", () => {
    expect(formValuesToUpdatePayload({ ...base, nomeDonoCabelo: "Ana", idadeDonoCabelo: "9" })).toMatchObject({
      cabeloDe: null,
      nomeDonoCabelo: null,
      idadeDonoCabelo: null,
    });
  });
});
