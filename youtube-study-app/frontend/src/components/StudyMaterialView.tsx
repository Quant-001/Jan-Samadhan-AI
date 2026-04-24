import { useState } from "react";
import { StudyMaterial } from "../api/client";

type Tab = "summary" | "sections" | "key_points" | "glossary" | "quiz" | "transcript";

const TABS: { id: Tab; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "sections", label: "Sections" },
  { id: "key_points", label: "Key Points" },
  { id: "glossary", label: "Glossary" },
  { id: "quiz", label: "Quiz" },
  { id: "transcript", label: "Transcript" },
];

export default function StudyMaterialView({ material }: { material: StudyMaterial }) {
  const [tab, setTab] = useState<Tab>("summary");

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row gap-4">
        <img
          src={`https://img.youtube.com/vi/${material.video_id}/mqdefault.jpg`}
          alt=""
          className="w-40 h-24 rounded-lg object-cover bg-slate-200 self-start"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-slate-900">
            {material.title || material.video_id}
          </h1>
          <a
            href={material.video_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-brand-600 hover:underline break-all"
          >
            {material.video_url}
          </a>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <span className="uppercase">{material.language}</span>
            <span>·</span>
            <span>generated via {material.source}</span>
            <span>·</span>
            <span>{new Date(material.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <nav className="flex flex-wrap gap-1 px-4 pt-3 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm rounded-t-lg ${
              tab === t.id
                ? "bg-brand-50 text-brand-700 border-x border-t border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="p-6">
        {tab === "summary" && (
          <p className="text-slate-700 leading-relaxed whitespace-pre-line">
            {material.summary || "No summary available."}
          </p>
        )}

        {tab === "sections" && (
          <div className="space-y-6">
            {material.sections.length === 0 && (
              <p className="text-slate-500 italic">No sections.</p>
            )}
            {material.sections.map((s, i) => (
              <article key={i}>
                <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-700 leading-relaxed mb-3">{s.content}</p>
                {s.key_points?.length > 0 && (
                  <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                    {s.key_points.map((kp, j) => (
                      <li key={j}>{kp}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}

        {tab === "key_points" && (
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            {material.key_points.length === 0 && (
              <li className="list-none italic text-slate-500">No key points.</li>
            )}
            {material.key_points.map((kp, i) => (
              <li key={i}>{kp}</li>
            ))}
          </ul>
        )}

        {tab === "glossary" && (
          <dl className="grid sm:grid-cols-2 gap-4">
            {material.glossary.length === 0 && (
              <p className="italic text-slate-500">No glossary entries.</p>
            )}
            {material.glossary.map((g, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-4">
                <dt className="font-semibold text-slate-900">{g.term}</dt>
                <dd className="text-sm text-slate-600 mt-1">{g.definition}</dd>
              </div>
            ))}
          </dl>
        )}

        {tab === "quiz" && <Quiz questions={material.quiz} />}

        {tab === "transcript" && (
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
            {material.transcript}
          </div>
        )}
      </div>
    </div>
  );
}

function Quiz({ questions }: { questions: StudyMaterial["quiz"] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (questions.length === 0) {
    return <p className="italic text-slate-500">No quiz available.</p>;
  }

  const correctCount = Object.entries(answers).reduce(
    (n, [i, choice]) =>
      questions[Number(i)] && questions[Number(i)].answer_index === choice ? n + 1 : n,
    0,
  );

  return (
    <div className="space-y-6">
      {questions.map((q, qi) => {
        const selected = answers[qi];
        return (
          <div key={qi} className="border border-slate-200 rounded-xl p-4">
            <p className="font-medium text-slate-900 mb-3">
              {qi + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const isSelected = selected === oi;
                const isCorrect = q.answer_index === oi;
                let className =
                  "block w-full text-left px-3 py-2 rounded-lg border text-sm cursor-pointer";
                if (submitted) {
                  if (isCorrect) {
                    className += " border-green-500 bg-green-50 text-green-800";
                  } else if (isSelected) {
                    className += " border-red-500 bg-red-50 text-red-800";
                  } else {
                    className += " border-slate-200 text-slate-700";
                  }
                } else {
                  className += isSelected
                    ? " border-brand-500 bg-brand-50 text-brand-800"
                    : " border-slate-200 text-slate-700 hover:bg-slate-50";
                }
                return (
                  <label key={oi} className={className}>
                    <input
                      type="radio"
                      name={`q-${qi}`}
                      className="mr-2"
                      disabled={submitted}
                      checked={isSelected}
                      onChange={() => setAnswers({ ...answers, [qi]: oi })}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
            {submitted && q.explanation && (
              <p className="mt-2 text-xs text-slate-500">{q.explanation}</p>
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-3">
        {!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            className="px-4 py-2 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700"
          >
            Check answers
          </button>
        ) : (
          <>
            <span className="font-medium text-slate-800">
              Score: {correctCount} / {questions.length}
            </span>
            <button
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
