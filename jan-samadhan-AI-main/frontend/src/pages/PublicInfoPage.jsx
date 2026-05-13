import { Link } from "react-router-dom";
import {
  BadgeHelp,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ClipboardList,
  Contact,
  FilePlus2,
  GitBranch,
  Home,
  Info,
  LayoutGrid,
  Mail,
  Network,
  Search,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import Chatbot from "../components/Shared/Chatbot";

const navItems = [
  { label: "Home", icon: Home, to: "/" },
  { label: "Contact Us", icon: Contact, to: "/contact" },
  { label: "About Us", icon: Info, to: "/about" },
  { label: "FAQs / Help", icon: BadgeHelp, to: "/help" },
  { label: "Site Map", icon: LayoutGrid, to: "/sitemap" },
];

export default function PublicInfoPage({ page = "about" }) {
  const content = pages[page] || pages.about;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-cyan-700">{content.eyebrow}</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">{content.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{content.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/submit-complaint" className="btn-primary flex items-center gap-2">
                <FilePlus2 size={16} /> Add Grievance
              </Link>
              <Link to="/track" className="btn-secondary flex items-center gap-2">
                <Search size={16} /> View Status
              </Link>
            </div>
          </div>
          {content.body}
        </div>
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}

function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-cyan-400 text-base font-black text-slate-950">JS</div>
          <div>
            <p className="font-black leading-tight">Jan Samadhan AI</p>
            <p className="text-xs text-slate-400">Citizen Grievance Intelligence Platform</p>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} to={item.to} className="flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white">
                <Icon size={15} />
                {item.label}
              </Link>
            );
          })}
          <Link to="/login" className="ml-1 rounded bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300">
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="font-semibold">Jan Samadhan AI | AI-powered citizen grievance redress</p>
        <div className="flex flex-wrap gap-3">
          {navItems.map((item) => (
            <Link key={item.label} to={item.to} className="hover:text-slate-950">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

function FlowNode({ icon: Icon, title, text }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded bg-slate-950 text-cyan-300">
        <Icon size={20} />
      </div>
      <h3 className="font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function SiteLink({ icon: Icon, title, to, text }) {
  return (
    <Link to={to} className="rounded border border-slate-200 bg-white p-4 shadow-sm hover:border-cyan-400 hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded bg-cyan-50 text-cyan-700">
          <Icon size={20} />
        </span>
        <div>
          <h3 className="font-black">{title}</h3>
          <p className="text-sm text-slate-500">{text}</p>
        </div>
      </div>
    </Link>
  );
}

const pages = {
  about: {
    eyebrow: "About Us",
    title: "About Jan Samadhan AI",
    summary: "A modern grievance portal that keeps the useful public-redress workflow ideas while giving citizens and officers a cleaner AI-first experience.",
    body: (
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 text-sm leading-7 text-slate-700">
          <p>
            Jan Samadhan AI helps citizens lodge grievances, track status, and receive updates while officers get AI-classified, priority-tagged cases in their queue.
          </p>
          <p>
            The platform uses language detection, text cleaning, supervised classification, optional pretrained language models, department routing, SLA monitoring, and feedback-based retraining.
          </p>
          <div className="rounded border border-cyan-200 bg-cyan-50 p-4 font-semibold text-cyan-900">
            Goal: faster routing, clearer accountability, and a transparent redress lifecycle from complaint to closure.
          </div>
        </div>
        <div className="grid gap-3">
          <FlowNode icon={BrainCircuit} title="AI classification" text="Classifies category, priority, confidence, and department hints." />
          <FlowNode icon={ShieldCheck} title="Officer verification" text="Officers can correct classifications and update action taken reports." />
        </div>
      </div>
    ),
  },
  redress: {
    eyebrow: "Redress Process",
    title: "Grievance Redress Process Flow",
    summary: "A practical version of the CPGRAMS-style flow: citizen submission, AI assessment, department routing, officer action, feedback, and appeal.",
    body: (
      <div className="mt-6">
        <div className="grid gap-4 md:grid-cols-5">
          <FlowNode icon={FilePlus2} title="1. Lodge" text="Citizen adds title, description, location, and optional attachment." />
          <FlowNode icon={BrainCircuit} title="2. Assess" text="AI classifies category, priority, language, and confidence." />
          <FlowNode icon={GitBranch} title="3. Route" text="Complaint moves to the relevant department or officer queue." />
          <FlowNode icon={UserRoundCog} title="4. Resolve" text="Officer updates status, remarks, and action taken report." />
          <FlowNode icon={CheckCircle2} title="5. Close" text="Citizen tracks, rates, gives feedback, or requests appeal." />
        </div>
      </div>
    ),
  },
  sitemap: {
    eyebrow: "Site Map",
    title: "Working Site Map",
    summary: "Only useful routes are shown here. Login-only actions open the sign-in page first and then continue to the correct dashboard.",
    body: (
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SiteLink icon={Home} title="Home" to="/" text="Main Jan Samadhan AI landing page" />
        <SiteLink icon={Info} title="About Us" to="/about" text="Platform purpose and AI layer" />
        <SiteLink icon={Network} title="Redress Process" to="/redress-process" text="Complaint lifecycle flow" />
        <SiteLink icon={UserRoundCog} title="Nodal / Officer Info" to="/officers" text="Officer and escalation structure" />
        <SiteLink icon={FilePlus2} title="Add Grievance" to="/submit-complaint" text="Sign in and submit a grievance" />
        <SiteLink icon={Search} title="View Status" to="/track" text="Track by ticket ID" />
        <SiteLink icon={BadgeHelp} title="FAQs / Help" to="/help" text="Citizen help and common questions" />
        <SiteLink icon={Mail} title="Contact Us" to="/contact" text="Support and contact information" />
      </div>
    ),
  },
  officers: {
    eyebrow: "Officer Layer",
    title: "Nodal / Officer Workflow",
    summary: "Officer roles are shown as a clean operational structure for routing, review, action, and closure.",
    body: (
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FlowNode icon={Building2} title="Admin" text="Monitors departments, officers, categories, and SLA reports." />
        <FlowNode icon={UserRoundCog} title="Nodal Officer" text="Receives routed complaints and assigns field action." />
        <FlowNode icon={ClipboardList} title="Field Officer" text="Updates progress, remarks, proof, and resolution status." />
        <FlowNode icon={ShieldCheck} title="Appeal Authority" text="Reviews unresolved or unsatisfactory grievance outcomes." />
      </div>
    ),
  },
  help: {
    eyebrow: "FAQs / Help",
    title: "Citizen Help",
    summary: "Common actions are kept short and direct so citizens know what each button does.",
    body: (
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <FlowNode icon={FilePlus2} title="How to add grievance?" text="Use Add Grievance, sign in or register, then fill the complaint form." />
        <FlowNode icon={Search} title="How to view status?" text="Use View Status and enter your ticket ID." />
        <FlowNode icon={BrainCircuit} title="How AI works?" text="AI suggests category and priority; officers can verify and correct it." />
      </div>
    ),
  },
  ai: {
    eyebrow: "AI Classification",
    title: "AI Classification Engine",
    summary: "A working overview of the Jan Samadhan AI classification layer used for grievance category, priority, confidence, and department routing.",
    body: (
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <FlowNode icon={BrainCircuit} title="Supervised model" text="Local Naive Bayes model is trained from examples and feedback; SVM/deep-learning models can be added." />
        <FlowNode icon={ShieldCheck} title="Confidence and priority" text="The API returns category, confidence score, language, cleaned text, and urgency priority." />
        <FlowNode icon={GitBranch} title="Routing output" text="Predicted category maps the grievance to department and officer queues." />
      </div>
    ),
  },
  contact: {
    eyebrow: "Contact Us",
    title: "Contact and Support",
    summary: "Use this section for project support, demo queries, and grievance platform assistance.",
    body: (
      <div className="mt-6 rounded border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm leading-7 text-slate-700">
          For demo support, use the in-app chatbot or contact the Jan Samadhan AI project administrator. For emergency public safety matters, contact the relevant local emergency service first.
        </p>
      </div>
    ),
  },
};
