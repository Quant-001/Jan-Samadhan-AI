import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { officerApi } from "../../api";
import { PriorityBadge, StatusBadge, CategoryIcon, StatCard, LoadingSpinner, EmptyState } from "../../components/Shared";
import { formatDate } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import toast from "react-hot-toast";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";

export default function OfficerDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ status: "", assigned_officer: "", officer_remarks: "", proof_of_resolution: null });
  const [filter, setFilter] = useState("all");
  const [subForm, setSubForm] = useState({ username: "", email: "", password: "", phone: "", first_name: "", last_name: "", employee_id: "", officer_level: "", jurisdiction: "", sector: "", pin_code: "" });
  const [editingSubId, setEditingSubId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["officer-complaints"],
    queryFn: () => officerApi.complaints().then((r) => r.data),
    refetchInterval: 60000,
  });

  const { data: assignableData } = useQuery({
    queryKey: ["officer-assignable"],
    queryFn: () => officerApi.assignableOfficers().then((r) => r.data),
  });

  const complaints = (data?.results || data || []).filter((c) => {
    if (filter === "active") return ["ASSIGNED", "IN_PROGRESS"].includes(c.status);
    if (filter === "resolved") return c.status === "RESOLVED";
    if (filter === "escalated") return c.status === "ESCALATED";
    return true;
  });

  const all = data?.results || data || [];
  const assignableOfficers = assignableData?.results || assignableData || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }) => officerApi.update(id, fd),
    onSuccess: () => {
      qc.invalidateQueries(["officer-complaints"]);
      toast.success(t("Complaint updated!"));
      setEditing(null);
    },
    onError: () => toast.error(t("Update failed")),
  });

  const subordinateMutation = useMutation({
    mutationFn: (payload) => editingSubId
      ? officerApi.updateSubordinate(editingSubId, stripEmptyPassword(payload))
      : officerApi.createSubordinate(payload),
    onSuccess: () => {
      qc.invalidateQueries(["officer-assignable"]);
      toast.success(editingSubId ? t("Officer updated") : t("Officer added"));
      setSubForm({ username: "", email: "", password: "", phone: "", first_name: "", last_name: "", employee_id: "", officer_level: defaultSubordinateLevel(user), jurisdiction: "", sector: "", pin_code: "" });
      setEditingSubId(null);
    },
    onError: (err) => toast.error(err.response?.data?.error || t("Officer save failed")),
  });

  const deleteSubordinateMutation = useMutation({
    mutationFn: (id) => officerApi.deleteSubordinate(id),
    onSuccess: () => {
      qc.invalidateQueries(["officer-assignable"]);
      toast.success(t("Officer deleted"));
    },
    onError: () => toast.error(t("Delete failed")),
  });

  const handleUpdate = (id) => {
    const fd = new FormData();
    fd.append("status", editForm.status);
    if (editForm.assigned_officer) fd.append("assigned_officer", editForm.assigned_officer);
    fd.append("officer_remarks", editForm.officer_remarks);
    if (editForm.proof_of_resolution) fd.append("proof_of_resolution", editForm.proof_of_resolution);
    updateMutation.mutate({ id, fd });
  };

  const stats = [
    { label: t("Department Complaints"), value: all.length, icon: "📋", color: "blue" },
    { label: t("In Progress"), value: all.filter((c) => c.status === "IN_PROGRESS").length, icon: "🔄", color: "purple" },
    { label: t("Resolved"), value: all.filter((c) => c.status === "RESOLVED").length, icon: "✅", color: "green" },
    { label: t("Escalated"), value: all.filter((c) => c.status === "ESCALATED").length, icon: "🚨", color: "red" },
  ];
  const canManageChain = ["DEPARTMENT_HEAD", "DEPARTMENT_OFFICER", "SUB_OFFICER"].includes(user?.officer_level);
  const dashboardName = user?.officer_level === "DEPARTMENT_HEAD"
    ? "Main Officer Dashboard"
    : user?.officer_level === "DEPARTMENT_OFFICER"
      ? "Officer Dashboard"
      : user?.officer_level === "SUB_OFFICER"
        ? "Sub Officer Dashboard"
        : "Field Officer Dashboard";
  const subordinateLevels = allowedSubordinateLevels(user);
  const sectionLabels = dashboardSections(user);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-6 overflow-hidden rounded border border-teal-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="h-1.5 bg-cyan-500" />
        <div className="p-5">
        <p className="text-sm font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">{t("Officer Workspace")}</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-100">{t(dashboardName)}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {t(user?.department_name || "Department")} — {t(user?.officer_level_display || "Officer")} — {user?.first_name} {user?.last_name}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {sectionLabels.map((label) => (
            <span key={label} className="rounded bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800 ring-1 ring-cyan-100 dark:bg-cyan-400/10 dark:text-cyan-200 dark:ring-cyan-400/20">
              {t(label)}
            </span>
          ))}
        </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {canManageChain && (
        <div className="mb-6 rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700 dark:text-cyan-300">{t(chainSectionName(user))}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-slate-100">{t(chainHeading(user))}</h2>
          <form
            className="mt-4 grid gap-3 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              subordinateMutation.mutate({ ...subForm, officer_level: subForm.officer_level || subordinateLevels[0]?.[0] });
            }}
          >
            {[["first_name", "First Name"], ["last_name", "Last Name"], ["username", "Username"], ["email", "Email"], ["phone", "Phone"], ["employee_id", "Employee ID"], ["jurisdiction", "Area / Region"], ["sector", "Sector / Ward"], ["pin_code", "PIN Code"]].map(([key, label]) => (
              <input key={key} className="input" required={["first_name", "username", "email"].includes(key)} placeholder={t(label)} value={subForm[key]} onChange={(e) => setSubForm({ ...subForm, [key]: e.target.value })} />
            ))}
            <input className="input" type="password" required={!editingSubId} placeholder={editingSubId ? t("Password unchanged") : t("Password")} value={subForm.password} onChange={(e) => setSubForm({ ...subForm, password: e.target.value })} />
            <select className="input" value={subForm.officer_level || subordinateLevels[0]?.[0] || ""} onChange={(e) => setSubForm({ ...subForm, officer_level: e.target.value })}>
              {subordinateLevels.map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
            </select>
            <div className="flex gap-2">
              <button className="rounded bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 dark:text-slate-950 dark:bg-cyan-400 dark:hover:bg-cyan-300" disabled={subordinateMutation.isPending}>
                {editingSubId ? t("Save Officer") : t("Add Officer")}
              </button>
              {editingSubId && <button type="button" className="btn-secondary text-sm" onClick={() => { setEditingSubId(null); setSubForm({ username: "", email: "", password: "", phone: "", first_name: "", last_name: "", employee_id: "", officer_level: defaultSubordinateLevel(user), jurisdiction: "", sector: "", pin_code: "" }); }}>{t("Cancel")}</button>}
            </div>
          </form>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {assignableOfficers.map((officer) => (
              <div key={officer.id} className="rounded border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{displayName(officer)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t(officer.officer_level_display)} — {[officer.jurisdiction, officer.sector, officer.pin_code].filter(Boolean).join(" / ") || t("No area")}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={() => {
                      setEditingSubId(officer.id);
                      setSubForm({ username: officer.username || "", email: officer.email || "", password: "", phone: officer.phone || "", first_name: officer.first_name || "", last_name: officer.last_name || "", employee_id: officer.employee_id || "", officer_level: officer.officer_level || defaultSubordinateLevel(user), jurisdiction: officer.jurisdiction || "", sector: officer.sector || "", pin_code: officer.pin_code || "" });
                    }}>{t("Edit")}</button>
                    <button type="button" className="btn-danger px-3 py-1 text-xs" onClick={() => deleteSubordinateMutation.mutate(officer.id)}>{t("Delete")}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-4 flex w-fit gap-1 rounded bg-white p-1 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        {["all", "active", "resolved", "escalated"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded px-4 py-1.5 text-sm font-bold capitalize transition-all ${filter === f ? "bg-slate-950 text-cyan-200 shadow dark:bg-cyan-400 dark:text-slate-950" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"}`}>
            {t(f)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : complaints.length === 0 ? (
        <EmptyState icon="🎉" title={t("No complaints here")} description={t("Check another filter tab.")} />
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div key={c.id} className="card p-4 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md dark:hover:border-cyan-700">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-2xl"><CategoryIcon category={c.category} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 dark:text-slate-100">{c.title}</p>
                      <span className="text-xs font-mono text-gray-400 dark:text-slate-500">#{c.ticket_id}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 dark:text-slate-400">{c.description}</p>
                    {c.location && (
                      <p className="text-xs text-gray-400 mt-1 dark:text-slate-500">📍 {c.location}</p>
                    )}
                    {(c.sector || c.pin_code) && (
                      <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">{[c.sector, c.pin_code].filter(Boolean).join(" / ")}</p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                      {c.is_sla_breached && (
                        <span className="badge bg-red-100 text-red-700 flex items-center gap-1">
                          <AlertTriangle size={10} /> {t("SLA Breached")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-xs text-gray-400 dark:text-slate-500">{formatDate(c.created_at)}</p>
                  {c.sla_deadline && (
                    <p className={`text-xs flex items-center gap-1 ${c.is_sla_breached ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-slate-400"}`}>
                      <Clock size={11} />
                      {t("SLA")}: {formatDate(c.sla_deadline)}
                    </p>
                  )}
                  {editing !== c.id && !["RESOLVED", "CLOSED"].includes(c.status) && (
                    <button
                      onClick={() => {
                        const nearest = sortOfficersForComplaint(assignableOfficers, c)[0];
                        setEditing(c.id);
                        setEditForm({
                          status: c.status,
                          assigned_officer: c.assigned_officer || nearest?.id || "",
                          officer_remarks: c.officer_remarks || "",
                          proof_of_resolution: null,
                        });
                      }}
                      className="btn-primary text-xs py-1 px-3">
                      {t("Update")}
                    </button>
                  )}
                </div>
              </div>

              {/* Citizen info */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
                <span>👤 {c.citizen_name}</span>
                <span>{t("AI")}: {t(c.ai_category)} ({Math.round(c.ai_confidence * 100)}%)</span>
              </div>
              {c.routing_note && (
                <div className="mt-2 rounded border border-teal-100 bg-teal-50 p-2 text-xs font-medium text-teal-900">
                  {c.routing_note}
                </div>
              )}

              {/* History */}
              {c.history?.length > 0 && (
                <div className="mt-2 text-xs text-gray-400 dark:text-slate-500">
                  {t("Last update")}: {c.history[0].new_status} — {formatDate(c.history[0].created_at)}
                </div>
              )}

              {/* Edit form */}
              {editing === c.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 dark:border-slate-700">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block dark:text-slate-400">{t("Update Status")}</label>
                      <select className="input text-sm" value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                        <option value="ASSIGNED">{t("ASSIGNED")}</option>
                        <option value="IN_PROGRESS">{t("IN_PROGRESS")}</option>
                        <option value="RESOLVED">{t("RESOLVED")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block dark:text-slate-400">{t(assignLabel(user))}</label>
                      <select className="input text-sm" value={editForm.assigned_officer}
                        onChange={(e) => setEditForm({ ...editForm, assigned_officer: e.target.value })}>
                        <option value="">{t("Keep with me")}</option>
                        {sortOfficersForComplaint(assignableOfficers, c).map((o, index) => (
                          <option key={o.id} value={o.id}>
                            {index === 0 && areaScore(o, c) > 0 ? `${t("Nearest:")} ` : ""}{displayName(o)} — {t(o.officer_level_display || o.officer_level)} {[o.sector, o.pin_code].filter(Boolean).join(" / ")}
                          </option>
                        ))}
                      </select>
                      {sortOfficersForComplaint(assignableOfficers, c)[0] && (
                        <button
                          type="button"
                          className="mt-2 rounded bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          onClick={() => setEditForm({ ...editForm, assigned_officer: sortOfficersForComplaint(assignableOfficers, c)[0].id })}
                        >
                          {t("Assign nearest by area / PIN")}
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block dark:text-slate-400">{t("Upload Proof")}</label>
                      <input type="file" accept="image/*,application/pdf" className="input text-xs"
                        onChange={(e) => setEditForm({ ...editForm, proof_of_resolution: e.target.files[0] })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block dark:text-slate-400">{t("Officer Remarks")}</label>
                    <textarea className="input text-sm" rows={3}
                      value={editForm.officer_remarks}
                      onChange={(e) => setEditForm({ ...editForm, officer_remarks: e.target.value })}
                      placeholder={t("Describe action taken, findings, or reason...")} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(c.id)} disabled={updateMutation.isPending}
                      className="btn-primary text-sm flex items-center gap-1">
                      <CheckCircle size={14} />
                      {updateMutation.isPending ? t("Saving...") : t("Save Update")}
                    </button>
                    <button onClick={() => setEditing(null)} className="btn-secondary text-sm">{t("Cancel")}</button>
                  </div>
                </div>
              )}

              {/* Resolved proof */}
              {c.status === "RESOLVED" && c.proof_of_resolution && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                  <a href={c.proof_of_resolution} target="_blank" rel="noreferrer"
                    className="text-sm text-blue-600 hover:underline dark:text-cyan-300">📎 {t("View proof of resolution")}</a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function displayName(user) {
  return `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;
}

function allowedSubordinateLevels(user) {
  if (user?.officer_level === "DEPARTMENT_HEAD") {
    return [
      ["DEPARTMENT_OFFICER", "Senior Officer"],
    ];
  }
  if (user?.officer_level === "DEPARTMENT_OFFICER") {
    return [
      ["SUB_OFFICER", "Sub Officer"],
    ];
  }
  if (user?.officer_level === "SUB_OFFICER") {
    return [["FIELD_OFFICER", "Field Officer"]];
  }
  return [];
}

function defaultSubordinateLevel(user) {
  return allowedSubordinateLevels(user)[0]?.[0] || "";
}

function stripEmptyPassword(data) {
  if (data.password) return data;
  const { password, ...rest } = data;
  return rest;
}

function chainSectionName(user) {
  if (user?.officer_level === "DEPARTMENT_HEAD") return "Assign Senior Officer";
  if (user?.officer_level === "DEPARTMENT_OFFICER") return "Assign Sub Officer";
  if (user?.officer_level === "SUB_OFFICER") return "Assign Field Officer";
  return "Officer Chain";
}

function chainHeading(user) {
  if (user?.officer_level === "DEPARTMENT_HEAD") return "Add, Edit, Delete Senior Officers";
  if (user?.officer_level === "DEPARTMENT_OFFICER") return "Add, Edit, Delete Sub Officers";
  if (user?.officer_level === "SUB_OFFICER") return "Add, Edit, Delete Field Officers";
  return "Officer Chain";
}

function assignLabel(user) {
  if (user?.officer_level === "DEPARTMENT_HEAD") return "Assign to Senior Officer";
  if (user?.officer_level === "DEPARTMENT_OFFICER") return "Assign to Sub Officer";
  if (user?.officer_level === "SUB_OFFICER") return "Assign to Field Officer";
  return "Forward Complaint";
}

function dashboardSections(user) {
  if (user?.officer_level === "DEPARTMENT_HEAD") {
    return ["Assign Officer", "Complaint Management"];
  }
  if (user?.officer_level === "DEPARTMENT_OFFICER") {
    return ["Assign Sub Officer", "Complaint Status"];
  }
  if (user?.officer_level === "SUB_OFFICER") {
    return ["Complaint List", "Update Complaint", "Resolution Report"];
  }
  return ["Complaint List", "Update Complaint", "Resolution Report"];
}

function sortOfficersForComplaint(officers, complaint) {
  return [...officers].sort((a, b) => areaScore(b, complaint) - areaScore(a, complaint));
}

function areaScore(officer, complaint) {
  let score = 0;
  const officerPin = String(officer.pin_code || "").trim();
  const complaintPin = String(complaint.pin_code || "").trim();
  if (officerPin && complaintPin && officerPin === complaintPin) score += 100;

  const officerSector = String(officer.sector || "").trim().toLowerCase();
  const complaintSector = String(complaint.sector || "").trim().toLowerCase();
  if (officerSector && complaintSector && officerSector === complaintSector) score += 60;

  const area = [officer.jurisdiction, officer.sector, officer.pin_code].filter(Boolean).join(" ").toLowerCase();
  [complaintSector, complaintPin, String(complaint.location || "").trim().toLowerCase()].forEach((token) => {
    if (token && area.includes(token)) score += 15;
  });
  return score;
}
