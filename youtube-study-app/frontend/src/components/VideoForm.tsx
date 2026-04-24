import { FormEvent, useState } from "react";

type Props = {
  onSubmit: (url: string, language: string) => Promise<void> | void;
  loading: boolean;
};

export default function VideoForm({ onSubmit, loading }: Props) {
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("en");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!url.trim()) {
      setError("Please paste a YouTube URL.");
      return;
    }
    try {
      await onSubmit(url.trim(), language);
      setUrl("");
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail || err?.message || "Something went wrong.";
      setError(detail);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
    >
      <label className="block text-sm font-medium text-slate-800 mb-2">
        YouTube URL
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          disabled={loading}
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-3 border border-slate-300 rounded-xl bg-white"
          disabled={loading}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="hi">Hindi</option>
          <option value="pt">Portuguese</option>
          <option value="ja">Japanese</option>
          <option value="zh">Chinese</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Processing…" : "Generate"}
        </button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
      <p className="mt-3 text-xs text-slate-500">
        Works with any video that has captions (auto-generated or manual).
      </p>
    </form>
  );
}
