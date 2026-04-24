import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 120_000,
});

export type StudyMaterialSummary = {
  id: number;
  video_id: string;
  video_url: string;
  title: string;
  language: string;
  source: string;
  created_at: string;
};

export type Section = {
  title: string;
  content: string;
  key_points: string[];
};

export type GlossaryEntry = {
  term: string;
  definition: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  answer_index: number;
  explanation?: string;
};

export type StudyMaterial = StudyMaterialSummary & {
  transcript: string;
  summary: string;
  sections: Section[];
  key_points: string[];
  glossary: GlossaryEntry[];
  quiz: QuizQuestion[];
  updated_at: string;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function listMaterials(): Promise<StudyMaterialSummary[]> {
  const r = await api.get<Paginated<StudyMaterialSummary>>("/materials/");
  return r.data.results;
}

export async function getMaterial(id: number | string): Promise<StudyMaterial> {
  const r = await api.get<StudyMaterial>(`/materials/${id}/`);
  return r.data;
}

export async function createMaterial(url: string, language = "en"): Promise<StudyMaterial> {
  const r = await api.post<StudyMaterial>("/materials/", { url, language });
  return r.data;
}

export async function deleteMaterial(id: number): Promise<void> {
  await api.delete(`/materials/${id}/`);
}
