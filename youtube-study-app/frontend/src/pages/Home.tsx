import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import VideoForm from "../components/VideoForm";
import HistoryList from "../components/HistoryList";
import Loader from "../components/Loader";
import {
  StudyMaterialSummary,
  createMaterial,
  listMaterials,
} from "../api/client";

export default function Home() {
  const [items, setItems] = useState<StudyMaterialSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  async function refresh() {
    setLoadingList(true);
    try {
      const data = await listMaterials();
      setItems(data);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(url: string, language: string) {
    setCreating(true);
    try {
      const created = await createMaterial(url, language);
      navigate(`/materials/${created.id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">
          Turn any YouTube video into structured study material
        </h1>
        <p className="text-slate-600 max-w-2xl">
          Paste a YouTube link. We'll fetch the transcript and turn it into a
          summary, sectioned outline, key points, glossary and a short quiz.
        </p>
      </section>

      <VideoForm onSubmit={handleSubmit} loading={creating} />

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">History</h2>
        {loadingList ? (
          <Loader label="Loading history…" />
        ) : (
          <HistoryList items={items} onChange={refresh} />
        )}
      </section>
    </div>
  );
}
