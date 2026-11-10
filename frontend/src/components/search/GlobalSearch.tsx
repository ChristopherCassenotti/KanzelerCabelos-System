import { useQuery } from "@tanstack/react-query";
import { LoaderCircle, MapPin, Search, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { searchContacts } from "../../services/contacts/contacts.service";

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    lead: "Lead",
    avaliacao_agendada: "Avaliação agendada",
    comprado: "Comprado",
    perdido: "Perdido",
  };

  return labels[status] ?? status;
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query.trim(), 250);

  const searchQuery = useQuery({
    queryKey: ["contatos", "busca-global", debouncedQuery],
    queryFn: () => searchContacts(debouncedQuery),
    enabled: debouncedQuery.length >= 1,
    staleTime: 30_000,
  });

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function selectContact(id: string) {
    setOpen(false);
    setQuery("");
    navigate(`/contatos?contato=${encodeURIComponent(id)}`);
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full sm:w-[320px] lg:w-[360px]">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--kanzler-muted-2)]"
        aria-hidden="true"
      />

      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar nome, cidade ou telefone..."
        aria-label="Busca global"
        className="w-full rounded-[10px] border border-[var(--kanzler-line)] bg-[var(--kanzler-canvas)] py-2.5 pl-9 pr-9 text-sm outline-none transition focus:border-[var(--kanzler-blue)] focus:bg-white focus:shadow-[0_0_0_3px_var(--kanzler-blue-soft)]"
      />

      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setOpen(false);
          }}
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-[var(--kanzler-muted-2)] transition hover:bg-white hover:text-[var(--kanzler-ink)]"
          aria-label="Limpar busca"
        >
          <X size={15} />
        </button>
      )}

      {showDropdown && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[1200] w-full min-w-[300px] overflow-hidden rounded-[12px] border border-[var(--kanzler-line)] bg-white shadow-[0_18px_45px_rgba(16,26,43,0.16)]">
          {searchQuery.isFetching && (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-[var(--kanzler-muted)]">
              <LoaderCircle size={16} className="animate-spin" />
              Buscando contatos...
            </div>
          )}

          {!searchQuery.isFetching && searchQuery.isError && (
            <div className="px-4 py-4 text-sm text-[var(--kanzler-red)]">
              Não foi possível realizar a busca agora.
            </div>
          )}

          {!searchQuery.isFetching && searchQuery.data?.length === 0 && (
            <div className="px-4 py-4 text-sm text-[var(--kanzler-muted)]">
              Nenhum contato encontrado.
            </div>
          )}

          {!searchQuery.isFetching && Boolean(searchQuery.data?.length) && (
            <div className="max-h-[360px] overflow-y-auto py-1.5">
              {searchQuery.data?.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => selectContact(contact.id)}
                  className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-[var(--kanzler-canvas)]"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--kanzler-blue-soft)] text-[var(--kanzler-blue)]">
                    <UserRound size={16} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[var(--kanzler-ink)]">
                      {contact.nome}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-[var(--kanzler-muted)]">
                      <MapPin size={11} className="shrink-0" />
                      {contact.cidade?.nome ?? "Cidade não informada"}
                      {contact.cidade?.uf ? ` - ${contact.cidade.uf}` : ""}
                    </span>
                  </span>

                  <span className="shrink-0 rounded-full bg-[#eef1f5] px-2 py-1 text-[10px] font-semibold text-[var(--kanzler-muted)]">
                    {statusLabel(contact.status)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
