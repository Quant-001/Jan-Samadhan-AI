import { PRIORITY_COLORS, STATUS_COLORS, CATEGORY_ICONS } from "../../utils/helpers";
import { useLanguage } from "../../hooks/useLanguage";

export function PriorityBadge({ priority }) {
  const { t } = useLanguage();
  return (
    <span className={`badge ${PRIORITY_COLORS[priority] || "bg-gray-100 text-gray-700"}`}>
      {t(priority)}
    </span>
  );
}

export function StatusBadge({ status }) {
  const { t } = useLanguage();
  const label = status?.replace("_", " ");
  return (
    <span className={`badge ${STATUS_COLORS[status] || "bg-gray-100 text-gray-700"}`}>
      {t(label)}
    </span>
  );
}

export function CategoryIcon({ category }) {
  return <span title={category}>{CATEGORY_ICONS[category] || "📋"}</span>;
}

export function LoadingSpinner({ size = "md" }) {
  const s = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-10 h-10" : "w-6 h-6";
  return (
    <div className={`${s} border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin`} />
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon || "📭"}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-gray-500 text-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

export function StatCard({ label, value, icon, color = "blue", sub }) {
  const colors = {
    blue: "bg-cyan-50 text-cyan-700",
    green: "bg-emerald-50 text-emerald-700",
    yellow: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    purple: "bg-violet-50 text-violet-700",
  };
  return (
    <div className="card p-5 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <span className={`rounded p-2 text-lg ${colors[color]}`}>{icon}</span>
      </div>
      <p className="text-3xl font-black tracking-tight text-slate-950">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}
