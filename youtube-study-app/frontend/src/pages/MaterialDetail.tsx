import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loader from "../components/Loader";
import StudyMaterialView from "../components/StudyMaterialView";
import { StudyMaterial, getMaterial } from "../api/client";

export default function MaterialDetail() {
  const { id } = useParams<{ id: string }>();
  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getMaterial(id)
      .then((m) => {
        if (!cancelled) setMaterial(m);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Failed to load.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="space-y-4">
      <Link to="/" className="text-sm text-brand-600 hover:underline">
        ← Back
      </Link>
      {loading && <Loader label="Loading study material…" />}
      {error && <p className="text-red-600">{error}</p>}
      {material && <StudyMaterialView material={material} />}
    </div>
  );
}
