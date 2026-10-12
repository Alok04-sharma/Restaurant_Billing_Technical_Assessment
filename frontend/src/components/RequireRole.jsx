/**
 * Path: frontend/src/components/RequireRole.jsx
 * Responsibility: Redirect guests to login and prevent cross-role frontend navigation.
 * Integration: Backend independently enforces permissions on every protected API.
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, roleHome } from "../contexts/AuthContext.jsx";
import { Loading } from "./Feedback.jsx";
export default function RequireRole({ roles }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready)
    return (
      <main className="p-8">
        <Loading />
      </main>
    );
  if (!user)
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  if (!roles.includes(user.role))
    return <Navigate to={roleHome(user.role)} replace />;
  return <Outlet />;
}
