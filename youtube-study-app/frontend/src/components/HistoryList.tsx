import { Link } from "react-router-dom";
import { StudyMaterialSummary, deleteMaterial } from "../api/client";

type Props = {
  items: StudyMaterialSummary[];
  onChange: () => void;
};

export default function HistoryList({ items, onChange }: Props) {
  async function handleDelete(id: number) {
    if (!confirm("Delete this study material?")) return;
    await deleteMaterial(id);
    onChange();
  }

  if (items.length === 0) {
    return (
      <div className="text-sm text-slate-500 italic">
        No study materials yet — generate one above.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-200 bg-white border border-slate-200 rounded-2xl">
      {items.map((m) => (
        <li
          key={m.id}
          className="px-4 py-3 flex items-center gap-4 hover:bg-slate-50"
        >
          <img
            src={`https://img.youtube.com/vi/${m.video_id}/mqdefault.jpg`}
            alt=""
            className="w-24 h-14 rounded-md object-cover bg-slate-200"
            loading="lazy"
          />
          <div className="flex-1 min-w-0">
            <Link
              to={`/materials/${m.id}`}
              className="block font-medium text-slate-900 truncate hover:text-brand-700"
            >
              {m.title || m.video_id}
            </Link>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{new Date(m.created_at).toLocaleString()}</span>
              <span>·</span>
              <span className="uppercase">{m.language}</span>
              <span>·</span>
              <span>via {m.source}</span>
            </div>
          </div>
          <button
            onClick={() => handleDelete(m.id)}
            className="text-xs text-slate-400 hover:text-red-600"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
