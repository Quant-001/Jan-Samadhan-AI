import { Languages } from "lucide-react";
import { languages, useLanguage } from "../../hooks/useLanguage";

export default function LanguageSelector({ variant = "dark", className = "" }) {
  const { language, setLanguage } = useLanguage();
  const isLight = variant === "light";
  const wrapperClass = isLight
    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
    : "border-white/15 bg-white/10 text-slate-200 hover:bg-white/15";
  const selectClass = isLight ? "text-slate-800" : "text-slate-100";

  return (
    <label className={`relative inline-flex items-center gap-2 rounded border px-3 py-2 text-sm font-semibold ${wrapperClass} ${className}`}>
      <Languages size={16} className={isLight ? "text-cyan-700" : "text-cyan-300"} />
      <span className="sr-only">Change language</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className={`w-28 bg-transparent font-semibold outline-none ${selectClass}`}
        aria-label="Change language"
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code} className="bg-slate-950 text-slate-100">
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
