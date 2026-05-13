import { useState } from "react";
import { Languages, Sun, ChevronDown } from "lucide-react";
import { languages, useLanguage } from "../../hooks/useLanguage";

export default function ThemeLangToggle({ variant = "dark", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const isLight = variant === "light";

  const buttonClass = isLight
    ? "border-amber-100 bg-white text-slate-700 shadow-sm hover:bg-amber-50"
    : "border-white/15 bg-white/10 text-slate-200 hover:bg-white/15";

  const menuClass = isLight
    ? "bg-white border-slate-200 text-slate-950 shadow-lg"
    : "bg-slate-800 border-slate-700 text-slate-100 shadow-xl";

  const optionHoverClass = isLight
    ? "hover:bg-slate-100"
    : "hover:bg-slate-700";

  const currentLangLabel = languages.find((l) => l.code === language)?.label || "Language";
  const currentThemeLabel = t("Light");

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex min-h-10 items-center gap-2 rounded border ${buttonClass} px-3 py-2 text-sm font-bold transition-colors`}
        title="Theme & Language Settings"
        aria-label="Theme & Language Settings"
        aria-expanded={isOpen}
      >
        <Languages size={16} className={isLight ? "text-amber-600" : "text-amber-300"} />
        <span className="hidden sm:inline">{currentLangLabel}</span>
        <span className={isLight ? "h-4 w-px bg-slate-200" : "h-4 w-px bg-white/15"} />
        <Sun size={16} className={isLight ? "text-slate-600" : "text-slate-300"} />
        <span className="hidden lg:inline">{currentThemeLabel}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            className={`absolute right-0 top-full mt-2 w-72 rounded border ${menuClass} z-50 overflow-hidden`}
          >
            <div className="border-b border-slate-300 dark:border-slate-700 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-slate-600 dark:text-slate-400">
                {t("Language")}
              </p>
              <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
                {languages.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => {
                      setLanguage(item.code);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${optionHoverClass} ${
                      language === item.code
                        ? isLight
                          ? "bg-amber-100 text-amber-800 font-semibold"
                          : "bg-amber-600/30 text-amber-300 font-semibold"
                        : ""
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="float-right text-xs uppercase opacity-60">{item.code}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-slate-600 dark:text-slate-400">
                {t("Theme")}
              </p>
              <div className="flex items-center gap-2 rounded bg-orange-50 px-2 py-2 text-sm font-semibold text-orange-700">
                <Sun size={14} />
                {t("Light")}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
