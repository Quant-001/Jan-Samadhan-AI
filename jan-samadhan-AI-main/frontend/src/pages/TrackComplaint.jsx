import { useState } from "react";
import { complaintApi } from "../api";
import { StatusBadge, PriorityBadge } from "../components/Shared";
import { formatDate } from "../utils/helpers";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import ThemeLangToggle from "../components/Shared/ThemeLangToggle";
import { useLanguage } from "../hooks/useLanguage";

export default function TrackComplaint() {
  const { t } = useLanguage();
  const [ticketId, setTicketId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!ticketId.trim()) return;
    setLoading(true);
    try {
      const { data } = await complaintApi.track(ticketId.trim().toUpperCase());
      setResult(data);
    } catch {
      toast.error(t("Ticket not found. Please check the ID."));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.18),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)] p-4 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_52%,#111827_100%)]">
      <div className="mx-auto flex max-w-7xl justify-end">
        <ThemeLangToggle variant="light" />
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-7xl items-center justify-center">
      <div className="w-full max-w-lg rounded border border-slate-200 bg-white/95 p-8 shadow-xl shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
        <div className="text-center mb-6">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded bg-[var(--app-accent)] text-xl font-bold text-[var(--app-accent-text)]">JS</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">{t("Track Your Complaint")}</h1>
          <p className="text-gray-500 text-sm dark:text-slate-400">{t("No login required")}</p>
        </div>

        <form onSubmit={handleTrack} className="flex gap-2 mb-6">
          <input
            className="input flex-1"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder={t("Enter Ticket ID (e.g. JSAB12CD)")}
            maxLength={12}
          />
          <button type="submit" disabled={loading} className="btn-primary px-5">
            {loading ? "..." : t("Track")}
          </button>
        </form>

        {result && (
          <div className="space-y-4">
            <div className="rounded border border-cyan-100 bg-cyan-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm font-semibold text-cyan-700 dark:text-cyan-300">#{result.ticket_id}</span>
                <StatusBadge status={result.status} />
              </div>
              <h2 className="font-semibold text-gray-900 mb-3 dark:text-slate-100">{result.title}</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs dark:text-slate-500">{t("Category")}</p>
                  <p className="font-medium dark:text-slate-200">{result.category}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs dark:text-slate-500">{t("Priority")}</p>
                  <PriorityBadge priority={result.priority} />
                </div>
                <div>
                  <p className="text-gray-400 text-xs dark:text-slate-500">{t("Department")}</p>
                  <p className="font-medium dark:text-slate-200">{result.department || t("Being assigned")}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs dark:text-slate-500">{t("SLA Deadline")}</p>
                  <p className={`font-medium text-xs ${result.is_sla_breached ? "text-red-600" : ""}`}>
                    {formatDate(result.sla_deadline)}
                    {result.is_sla_breached && ` ${t("Breached")}`}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs dark:text-slate-500">{t("Submitted")}</p>
                  <p className="font-medium text-xs dark:text-slate-200">{formatDate(result.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs dark:text-slate-500">{t("Last Updated")}</p>
                  <p className="font-medium text-xs dark:text-slate-200">{formatDate(result.updated_at)}</p>
                </div>
              </div>
            </div>

            {/* Status timeline */}
            <div className="flex items-center gap-2 text-xs text-center">
              {["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED"].map((s, i) => {
                const statuses = ["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
                const current = statuses.indexOf(result.status);
                const step = statuses.indexOf(s);
                const done = step <= current;
                return (
                  <div key={s} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${done ? "bg-[var(--app-accent)] text-[var(--app-accent-text)]" : "bg-gray-200 text-gray-400 dark:bg-slate-700"}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <p className={`text-xs leading-tight ${done ? "text-cyan-700 font-medium dark:text-cyan-300" : "text-gray-400 dark:text-slate-500"}`}>{t(s)}</p>
                    {i < 3 && <div className={`absolute h-0.5 w-full ${done ? "bg-cyan-300" : "bg-gray-200 dark:bg-slate-700"}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6 dark:text-slate-400">
          <Link to="/login" className="text-cyan-700 hover:underline dark:text-cyan-300">{t("Back to Login")}</Link>
        </p>
      </div>
      </div>
    </div>
  );
}
