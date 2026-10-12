/**
 * Path: frontend/src/components/Feedback.jsx
 * Responsibility: Consistent errors, progress indicators and empty states for staff workflows.
 * Integration: Shared by all restaurant pages.
 */
import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";

export function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      {message}
    </div>
  );
}

export function Loading() {
  return (
    <div
      role="status"
      className="flex items-center gap-2 py-12 text-sm text-slate-600"
    >
      <LoaderCircle size={19} className="animate-spin" />
      Loading latest data…
    </div>
  );
}

export function EmptyState({ title, detail, action }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
      <Inbox size={30} className="mx-auto mb-3 text-slate-400" />
      <h3 className="font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{detail}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
