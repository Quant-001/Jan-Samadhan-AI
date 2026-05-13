import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeHelp,
  BrainCircuit,
  CalendarDays,
  ChevronDown,
  Contact,
  FilePlus2,
  Home,
  Info,
  Languages,
  LayoutGrid,
  LogIn,
  Mail,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import { publicApi } from "../api";
import Chatbot from "../components/Shared/Chatbot";
import { languages, useLanguage } from "../hooks/useLanguage";

const HOME_THEMES = [
  {
    key: "blue",
    label: "Blue",
    accent: "#22d3ee",
    accentHover: "#67e8f9",
    accentContrast: "#020617",
    soft: "rgba(34, 211, 238, 0.12)",
    border: "rgba(103, 232, 249, 0.34)",
    hero: "linear-gradient(135deg,#020617 0%,#0f172a 44%,#083344 100%)",
    page: "#020617",
    section: "#0f172a",
    sectionAlt: "#111827",
    card: "rgba(255,255,255,0.06)",
    cardStrong: "rgba(2,6,23,0.8)",
    text: "#f8fafc",
    muted: "#cbd5e1",
    faint: "#94a3b8",
    line: "rgba(255,255,255,0.1)",
  },
  {
    key: "amber",
    label: "Amber",
    accent: "#fbbf24",
    accentHover: "#fde68a",
    accentContrast: "#1c1917",
    soft: "rgba(251, 191, 36, 0.12)",
    border: "rgba(253, 230, 138, 0.34)",
    hero: "linear-gradient(135deg,#020617 0%,#111827 48%,#713f12 100%)",
    page: "#020617",
    section: "#0f172a",
    sectionAlt: "#111827",
    card: "rgba(255,255,255,0.06)",
    cardStrong: "rgba(2,6,23,0.8)",
    text: "#f8fafc",
    muted: "#cbd5e1",
    faint: "#94a3b8",
    line: "rgba(255,255,255,0.1)",
  },
  {
    key: "light",
    label: "Light",
    accent: "#f59e0b",
    accentHover: "#fbbf24",
    accentContrast: "#f8fafc",
    soft: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.3)",
    hero: "linear-gradient(135deg,#f8fafc 0%,#fef3c7 52%,#fff7d6 100%)",
    page: "#f8fafc",
    section: "#ffffff",
    sectionAlt: "#fffbeb",
    card: "rgba(255,255,255,0.78)",
    cardStrong: "rgba(255,255,255,0.92)",
    text: "#0f172a",
    muted: "#334155",
    faint: "#64748b",
    line: "rgba(15,23,42,0.12)",
  },
];

function themeStyle(theme) {
  return {
    "--theme-accent": theme.accent,
    "--theme-accent-hover": theme.accentHover,
    "--theme-accent-contrast": theme.accentContrast,
    "--theme-soft": theme.soft,
    "--theme-border": theme.border,
    "--theme-hero": theme.hero,
    "--theme-page": theme.page,
    "--theme-section": theme.section,
    "--theme-section-alt": theme.sectionAlt,
    "--theme-card": theme.card,
    "--theme-card-strong": theme.cardStrong,
    "--theme-text": theme.text,
    "--theme-muted": theme.muted,
    "--theme-faint": theme.faint,
    "--theme-line": theme.line,
  };
}

export default function HomePage() {
  const { t, language, setLanguage } = useLanguage();
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem("jan-home-theme") || "blue");
  const activeTheme = HOME_THEMES.find((theme) => theme.key === themeKey) || HOME_THEMES[0];

  useEffect(() => {
    localStorage.setItem("jan-home-theme", activeTheme.key);
  }, [activeTheme.key]);

  const { data: publicStats } = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => publicApi.stats().then((r) => r.data),
    refetchInterval: 60000,
  });

  const quickLinks = [
    { label: t("Home"), icon: Home, to: "/" },
    { label: t("About Us"), icon: Info, to: "/about" },
    { label: t("Site Map"), icon: CalendarDays, to: "/sitemap" },
    { label: t("Contact Us"), icon: Contact, to: "/contact" },
    { label: t("FAQs/Help"), icon: BadgeHelp, to: "/help" },
  ];

  const actions = [
    { label: t("Add Grievance"), icon: FilePlus2, to: "/submit-complaint", primary: true },
    { label: t("View Status"), icon: Search, to: "/track" },
    { label: t("Redress Process"), icon: Network, to: "/redress-process" },
    { label: t("AI Classification"), icon: BrainCircuit, to: "/ai-classification" },
    { label: t("Nodal / Officers"), icon: ShieldCheck, to: "/officers" },
  ];

  const steps = [
    t("Citizen complaint submitted"),
    t("Central / State grievance portal"),
    t("Main Officer manages departments"),
    t("Department head assigns officer"),
    t("Sub officer coordinates field work"),
    t("Citizen receives resolution update"),
  ];

  return (
    <div style={themeStyle(activeTheme)} className="min-h-screen bg-[var(--theme-page)] text-[var(--theme-text)]">
      <header className="sticky top-0 z-40 w-full border-b border-[color:var(--theme-line)] bg-[var(--theme-page)]/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded bg-[var(--theme-accent)] text-lg font-black text-[var(--theme-accent-contrast)]">
              JS
            </div>
            <div>
              <p className="text-base font-extrabold tracking-tight text-[var(--theme-text)]">Jan Samadhan AI</p>
              <p className="text-xs font-medium text-[var(--theme-faint)]">{t("Citizen Grievance Intelligence Platform")}</p>
            </div>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} to={item.to} className="flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold text-[var(--theme-muted)] hover:bg-[var(--theme-card)] hover:text-[var(--theme-text)]">
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <HomePreferences
              themes={HOME_THEMES}
              activeKey={activeTheme.key}
              onThemeChange={setThemeKey}
              language={language}
              onLanguageChange={setLanguage}
              className="hidden md:block"
            />
            <Link to="/track" className="hidden rounded border border-[color:var(--theme-line)] px-3 py-2 text-sm font-semibold text-[var(--theme-muted)] hover:bg-[var(--theme-card)] hover:text-[var(--theme-text)] sm:inline-flex">
              {t("Track")}
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded bg-[var(--theme-accent)] px-4 py-2 text-sm font-bold text-[var(--theme-accent-contrast)] hover:bg-[var(--theme-accent-hover)]">
              <LogIn size={16} /> {t("Sign In")}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 bg-[image:var(--theme-hero)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent_0%,var(--theme-section)_100%)]" />
          <div className="relative mx-auto grid min-h-[calc(100svh-73px)] max-w-7xl gap-8 px-4 py-8 sm:py-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:py-12">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded border border-[color:var(--theme-border)] bg-[var(--theme-soft)] px-3 py-1 text-sm font-semibold text-[var(--theme-accent)]">
                <Sparkles size={15} /> {t("Modern Jan Samadhan AI grievance platform")}
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-[var(--theme-text)] md:text-5xl xl:text-6xl">
                {t("Smart grievance redress for citizens.")}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--theme-muted)] md:text-lg">
                {t("Lodge complaints, classify them with AI, route them to the right authority, monitor SLA progress, and close the loop with feedback.")}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {actions.map((button) => {
                  const Icon = button.icon;
                  const className = button.primary
                    ? "bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] hover:bg-[var(--theme-accent-hover)]"
                    : "border border-[color:var(--theme-line)] bg-[var(--theme-card)] text-[var(--theme-text)] hover:border-[color:var(--theme-border)]";
                  return (
                    <Link key={button.label} to={button.to} className={`flex min-h-12 items-center justify-center gap-2 rounded px-4 py-3 text-center text-sm font-bold ${className}`}>
                      <Icon size={18} />
                      {button.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <HeroStat label={t("Complaint assigned")} value={`${publicStats?.assigned_percentage ?? 0}%`} detail={`${publicStats?.assigned_complaints ?? 0} of ${publicStats?.total_complaints ?? 0} ${t("complaints assigned")}`} />
                <HeroStat label={t("Complaint resolved")} value={publicStats?.resolved_complaints ?? 0} detail={`${publicStats?.resolution_percentage ?? 0}% ${t("resolution rate")}`} />
              </div>
            </div>

            <WorkflowCard steps={steps} stats={publicStats} t={t} />
          </div>
        </section>

        <section className="bg-[var(--theme-section)] px-4 py-12">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded border border-[color:var(--theme-line)] bg-[var(--theme-card)] p-6">
              <h2 className="text-2xl font-black text-[var(--theme-text)]">{t("About Jan Samadhan AI")}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--theme-muted)]">
                {t("A modern grievance platform inspired by public redress workflows. Citizens get a simple interface, officers get routed cases, and admins get visibility into categories, priorities, and SLA performance.")}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <InfoPanel icon={Mail} title={t("Contact")} text={t("Reach support and department teams from the portal.")} to="/contact" />
              <InfoPanel icon={BadgeHelp} title={t("FAQs/Help")} text={t("Guide citizens through login, grievance filing, and tracking.")} to="/help" />
              <InfoPanel icon={LayoutGrid} title={t("Site Map")} text={t("Quick access to home, status, grievance, appeal, and dashboard flows.")} to="/sitemap" />
            </div>
          </div>
        </section>
      </main>

      <Chatbot />
    </div>
  );
}

function WorkflowCard({ steps, stats, t }) {
  return (
    <div className="rounded border border-[color:var(--theme-line)] bg-[var(--theme-card)] p-3 shadow-2xl backdrop-blur sm:p-4">
      <div className="rounded bg-[var(--theme-card-strong)] p-4 sm:p-5">
        <div className="flex items-center justify-between border-b border-[color:var(--theme-line)] pb-4">
          <div>
            <p className="text-sm font-semibold text-[var(--theme-accent)]">{t("Live Routing Preview")}</p>
            <h2 className="text-xl font-black text-[var(--theme-text)] sm:text-2xl">{t("Assignment workflow")}</h2>
          </div>
          <ShieldCheck className="text-[var(--theme-accent)]" size={30} />
        </div>
        <div className="mt-5 space-y-3">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded border border-[color:var(--theme-line)] bg-[var(--theme-card)] p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[var(--theme-accent)] text-sm font-black text-[var(--theme-accent-contrast)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-semibold text-[var(--theme-text)]">{step}</span>
              {index < steps.length - 1 && <ArrowRight className="ml-auto text-[var(--theme-faint)]" size={17} />}
            </div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <Metric label={t("Departments")} value={stats?.departments || t("All")} />
          <Metric label={t("Officer levels")} value="4" />
          <Metric label={t("SLA view")} value="24x7" />
        </div>
      </div>
    </div>
  );
}

function HomePreferences({ themes, activeKey, onThemeChange, language, onLanguageChange, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const activeLanguage = languages.find((item) => item.code === language) || languages[0];
  const activeTheme = themes.find((theme) => theme.key === activeKey) || themes[2];

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [isOpen]);

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button type="button" onClick={() => setIsOpen((open) => !open)} className="inline-flex min-h-10 items-center gap-2 rounded border border-[color:var(--theme-line)] bg-[var(--theme-card)] px-3 py-2 text-sm font-bold text-[var(--theme-text)] shadow-sm backdrop-blur-xl hover:border-[color:var(--theme-border)]">
        <Languages size={16} className="text-[var(--theme-accent)]" />
        <span>{activeLanguage.label}</span>
        <span className="h-4 w-px bg-[var(--theme-line)]" />
        <Sun size={16} />
        <span>{activeTheme.label}</span>
        <ChevronDown size={15} className={`transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded border border-[color:var(--theme-line)] bg-[var(--theme-section)] text-[var(--theme-text)] shadow-2xl">
          <div className="border-b border-[color:var(--theme-line)] p-3">
            <p className="mb-2 text-xs font-black uppercase text-[var(--theme-faint)]">Language</p>
            <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
              {languages.map((item) => (
                <button key={item.code} type="button" onClick={() => { onLanguageChange(item.code); setIsOpen(false); }} className={`flex w-full items-center justify-between rounded px-2.5 py-2 text-left text-sm font-semibold hover:bg-[var(--theme-card)] ${item.code === language ? "bg-[var(--theme-soft)] text-[var(--theme-accent)]" : "text-[var(--theme-muted)]"}`}>
                  {item.label}
                  <span className="text-xs uppercase">{item.code}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3">
            <p className="mb-2 text-xs font-black uppercase text-[var(--theme-faint)]">Theme</p>
            <div className="grid gap-2">
              {themes.map((theme) => (
                <button key={theme.key} type="button" onClick={() => { onThemeChange(theme.key); setIsOpen(false); }} className={`flex items-center gap-3 rounded px-2.5 py-2 text-left text-sm font-bold hover:bg-[var(--theme-card)] ${activeKey === theme.key ? "bg-[var(--theme-soft)] text-[var(--theme-accent)]" : "text-[var(--theme-muted)]"}`}>
                  <span className="h-5 w-5 rounded-full border border-[color:var(--theme-line)]" style={{ backgroundColor: theme.accent }} />
                  {theme.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded border border-[color:var(--theme-line)] bg-[var(--theme-card)] p-3">
      <p className="text-xl font-black text-[var(--theme-accent)]">{value}</p>
      <p className="mt-1 text-xs font-semibold text-[var(--theme-faint)]">{label}</p>
    </div>
  );
}

function HeroStat({ label, value, detail }) {
  return (
    <div className="rounded border border-[color:var(--theme-line)] bg-[var(--theme-card)] p-4">
      <p className="text-2xl font-black text-[var(--theme-accent)]">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[var(--theme-faint)]">{label}</p>
      {detail && <p className="mt-2 text-sm font-semibold text-[var(--theme-muted)]">{detail}</p>}
    </div>
  );
}

function InfoPanel({ icon: Icon, title, text, to }) {
  return (
    <Link to={to} className="rounded border border-[color:var(--theme-line)] bg-[var(--theme-card)] p-5 shadow-sm hover:border-[color:var(--theme-border)]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)]">
        <Icon size={20} />
      </div>
      <h3 className="font-black text-[var(--theme-text)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--theme-muted)]">{text}</p>
    </Link>
  );
}
