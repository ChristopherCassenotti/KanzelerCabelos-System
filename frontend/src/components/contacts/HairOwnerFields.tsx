import { useFormContext } from "react-hook-form";
import { hairOwnerOptions } from "../../utils/contact";

interface HairOwnerValues {
  cabeloDe: string;
  nomeDonoCabelo: string;
  idadeDonoCabelo: string;
}

interface HairOwnerFieldsProps {
  inputClass: string;
  errorClass: string;
  Label: (props: { children: React.ReactNode }) => React.ReactNode;
}

/**
 * Cabelo de uma criança ou de outra pessoa: o contato é quem negocia (ex.: o
 * pai) e aqui fica de quem é o cabelo.
 */
export function HairOwnerFields({ inputClass, errorClass, Label }: HairOwnerFieldsProps) {
  const form = useFormContext<HairOwnerValues>();
  const errors = form.formState.errors;
  const owner = form.watch("cabeloDe");

  return (
    <>
      <label>
        <Label>Cabelo de</Label>
        <select {...form.register("cabeloDe")} className={inputClass}>
          <option value="">Da própria pessoa</option>
          {hairOwnerOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>

      {owner !== "" && (
        <>
          <label>
            <Label>Nome {owner === "filho" ? "do filho" : owner === "filha" ? "da filha" : "da pessoa"}</Label>
            <input {...form.register("nomeDonoCabelo")} className={inputClass} placeholder="Opcional" />
            {errors.nomeDonoCabelo && <p className={errorClass}>{errors.nomeDonoCabelo.message}</p>}
          </label>

          <label>
            <Label>Idade</Label>
            <input {...form.register("idadeDonoCabelo")} className={inputClass} inputMode="numeric" placeholder="Opcional" />
            {errors.idadeDonoCabelo && <p className={errorClass}>{errors.idadeDonoCabelo.message}</p>}
          </label>
        </>
      )}
    </>
  );
}
