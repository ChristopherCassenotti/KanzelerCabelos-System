import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";

interface PageMeta {
  title: string;
  subtitle: string;
}

const pages: Array<{ matches: (pathname: string) => boolean; meta: PageMeta }> = [
  {
    matches: (pathname) => pathname.startsWith("/contatos"),
    meta: {
      title: "Contatos",
      subtitle: "Todos os cabelos avaliados, comprados e em negociação",
    },
  },
  {
    matches: (pathname) => pathname.startsWith("/agenda"),
    meta: {
      title: "Agenda e rotas",
      subtitle: "Organize as visitas do dia e a sequência da rota",
    },
  },
  {
    matches: (pathname) => pathname.startsWith("/mapa"),
    meta: {
      title: "Mapa",
      subtitle: "Onde estão as clientes, por cidade e endereço",
    },
  },
  {
    matches: (pathname) => pathname.startsWith("/relatorios"),
    meta: {
      title: "Relatórios",
      subtitle: "Compras, conversão, viagens e previsão de recompra",
    },
  },
  {
    matches: (pathname) => pathname.startsWith("/assistente"),
    meta: {
      title: "Assistente IA",
      subtitle: "Cadastre contatos escrevendo uma mensagem",
    },
  },
  {
    matches: () => true,
    meta: {
      title: "Painel",
      subtitle: "Visão geral da operação de compra de cabelo",
    },
  },
];

export function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const meta = useMemo(
    () => pages.find((page) => page.matches(location.pathname))?.meta ?? pages[pages.length - 1].meta,
    [location.pathname],
  );

  return (
    <div className="min-h-screen bg-[var(--kanzler-canvas)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen min-w-0 min-[821px]:ml-[244px]">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="px-4 py-5 sm:px-5 sm:py-6 min-[821px]:px-7 min-[821px]:pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
