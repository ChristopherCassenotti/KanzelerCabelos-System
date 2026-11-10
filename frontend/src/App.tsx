import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "./components/auth/PublicOnlyRoute";
import { AppLayout } from "./layouts/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { ContactsPage } from "./pages/ContactsPage";
import { AgendaPage } from "./pages/AgendaPage";
import { MapPage } from "./pages/MapPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AssistantPage } from "./pages/AssistantPage";

export function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/painel" replace />} />

          <Route path="/painel" element={<DashboardPage />} />

          <Route path="/contatos" element={<ContactsPage />} />

          <Route path="/agenda" element={<AgendaPage />} />

          <Route path="/mapa" element={<MapPage />} />

          <Route path="/relatorios" element={<ReportsPage />} />

          <Route path="/assistente" element={<AssistantPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/painel" replace />} />
    </Routes>
  );
}
