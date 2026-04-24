import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto w-full px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 text-white grid place-items-center font-bold">
            Y
          </div>
          <div>
            <div className="text-base font-semibold text-slate-900 leading-tight">
              YouTube Study
            </div>
            <div className="text-xs text-slate-500 leading-tight">
              Turn videos into structured notes
            </div>
          </div>
        </Link>
        <a
          href="https://www.djangoproject.com/"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-slate-500 hover:text-brand-600"
        >
          Django + React + Docker
        </a>
      </div>
    </header>
  );
}
