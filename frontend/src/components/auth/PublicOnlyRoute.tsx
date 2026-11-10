import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { SessionLoading } from "../feedback/SessionLoading";
import { DEFAULT_PRIVATE_ROUTE, resolvePostLoginTarget } from "./redirect";

export function PublicOnlyRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <SessionLoading />;
  }

  if (isAuthenticated) {
    // Já logado em /login: volta para onde ia (se veio de rota privada) ou para o painel.
    return <Navigate to={resolvePostLoginTarget(location.state) ?? DEFAULT_PRIVATE_ROUTE} replace />;
  }

  return <Outlet />;
}
