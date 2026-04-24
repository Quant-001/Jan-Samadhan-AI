export default function Loader({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-600">
      <span className="inline-block w-4 h-4 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
      <span>{label ?? "Loading…"}</span>
    </div>
  );
}
