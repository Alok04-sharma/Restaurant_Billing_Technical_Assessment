/**
 * Path: frontend/src/pages/SignupPage.jsx
 * Responsibility: Register only CUSTOMER accounts using demo email/mobile identifiers.
 * Integration: AuthContext, customer cart checkout and login screen.
 */
import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, roleHome } from "../contexts/AuthContext.jsx";
import { ErrorMessage } from "../components/Feedback.jsx";
import { safeNext } from "./LoginPage.jsx";
export default function SignupPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [displayName, setDisplayName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (user) return <Navigate to={roleHome(user.role)} replace />;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const created = await register({ displayName, identifier, password });
      navigate(safeNext(params.get("next"), created.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] px-4 py-10">
      <section className="panel w-full max-w-md space-y-5">
        <div>
          <p className="eyebrow">Customer account</p>
          <h1 className="page-title">Create account</h1>
          <p className="page-subtitle">
            Use any well-formatted demo email or mobile number. No OTP is sent.
          </p>
        </div>
        <ErrorMessage message={error} />
        <form onSubmit={submit} className="space-y-4">
          <label className="field-label">
            Your name
            <input
              className="field-input"
              maxLength={80}
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <label className="field-label">
            Email or 10-digit mobile
            <input
              className="field-input"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </label>
          <label className="field-label">
            Password (at least 6 characters)
            <input
              type="password"
              className="field-input"
              minLength={6}
              maxLength={128}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="btn-primary w-full justify-center" disabled={busy}>
            {busy ? "Creating account…" : "Create customer account"}
          </button>
        </form>
        <p className="text-sm">
          Already registered?{" "}
          <Link
            className="font-semibold text-emerald-800"
            to={`/login?next=${encodeURIComponent(
              params.get("next") || "/customer/cart"
            )}`}
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
