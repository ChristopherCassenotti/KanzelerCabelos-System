import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { SessionLoading } from "../feedback/SessionLoading";
import { buildLoginRedirectState } from "./redirect";

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <SessionLoading />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={buildLoginRedirectState(location)}
      />
    );
  }

  return <Outlet />;
}
