import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../api";
import { PriorityBadge, StatusBadge, CategoryIcon, StatCard, LoadingSpinner, EmptyState } from "../../components/Shared";
import { useLanguage } from "../../hooks/useLanguage";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Bot, Building2, CheckCircle2, FileText, GitBranch, Languages, Network, ShieldCheck, Timer, Trash2 } from "lucide-react";

const COLORS = ["#1D6FA5", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#be185d", "#6b7280"];
const OFFICER_LEVELS = [
  ["DEPARTMENT_HEAD", "Department Main Officer"],
  ["DEPARTMENT_OFFICER", "Senior Officer"],
  ["SUB_OFFICER", "Sub Officer"],
  ["FIELD_OFFICER", "Field Officer"],
];

const ADMIN_TRANSLATIONS = {
  hi: {
    "Admin / Main Admin Panel": "प्रशासक / मुख्य प्रशासक पैनल",
    "Assign Department and Officer": "विभाग और अधिकारी नियुक्त करें",
    "Admin only manages departments and department main officers. The rest of the officer chain is handled from the main officer and officer dashboards.": "प्रशासक केवल विभाग और विभाग मुख्य अधिकारियों का प्रबंधन करता है। बाकी अधिकारी श्रृंखला मुख्य अधिकारी और अधिकारी डैशबोर्ड से संभाली जाती है।",
    "Add Department": "विभाग जोड़ें",
    "Edit Department": "विभाग संपादित करें",
    "Delete Department": "विभाग हटाएं",
    "Add Main Officer": "मुख्य अधिकारी जोड़ें",
    "Assign Department": "विभाग नियुक्त करें",
    "Departments": "विभाग",
    "Main Officers": "मुख्य अधिकारी",
    "Assigned Departments": "नियुक्त विभाग",
    "Unassigned Departments": "अनियुक्त विभाग",
    "Assign Department and Main Officer": "विभाग और मुख्य अधिकारी नियुक्त करें",
    "Hierarchy": "पदक्रम",
    "Monitor All Complaints": "सभी शिकायतें देखें",
    "Main Officer (Super Admin)": "मुख्य अधिकारी (सुपर एडमिन)",
    "Department and Assignment Command": "विभाग और नियुक्ति नियंत्रण",
    "Add / Edit / Delete Departments": "विभाग जोड़ें / संपादित करें / हटाएं",
    "Manage State Government Departments": "राज्य सरकार विभाग प्रबंधित करें",
    "Manage Central Government Departments": "केंद्र सरकार विभाग प्रबंधित करें",
    "Assign Department Heads": "विभाग प्रमुख नियुक्त करें",
    "All Departments": "सभी विभाग",
    "Central Government": "केंद्र सरकार",
    "State Government": "राज्य सरकार",
    "Local Body": "स्थानीय निकाय",
    "Manage state, central, and local department routing.": "राज्य, केंद्र और स्थानीय विभाग रूटिंग प्रबंधित करें।",
    "Department name": "विभाग का नाम",
    "Department code, e.g. ELECTRICITY": "विभाग कोड, जैसे ELECTRICITY",
    "Assign Department Main Officer": "विभाग मुख्य अधिकारी नियुक्त करें",
    "Department email": "विभाग ईमेल",
    "Description": "विवरण",
    "Saving...": "सहेजा जा रहा है...",
    "Save Department": "विभाग सहेजें",
    "Cancel": "रद्द करें",
    "Inactive": "निष्क्रिय",
    "No description added.": "कोई विवरण नहीं जोड़ा गया।",
    "open complaints": "खुली शिकायतें",
    "officers": "अधिकारी",
    "Head": "प्रमुख",
    "Not assigned": "नियुक्त नहीं",
    "Edit": "संपादित करें",
    "Disable department": "विभाग निष्क्रिय करें",
    "No departments found for this government type.": "इस सरकारी प्रकार के लिए कोई विभाग नहीं मिला।",
    "Main Officer Management": "मुख्य अधिकारी प्रबंधन",
    "Add, Edit, Delete Department Main Officers": "विभाग मुख्य अधिकारी जोड़ें, संपादित करें, हटाएं",
    "Admin creates only department main officers here. Main officers create the next officer chain from their dashboard.": "यहां प्रशासक केवल विभाग मुख्य अधिकारी बनाता है। मुख्य अधिकारी अपने डैशबोर्ड से आगे की अधिकारी श्रृंखला बनाते हैं।",
    "Edit Main Officer": "मुख्य अधिकारी संपादित करें",
    "Create Main Officer Account": "मुख्य अधिकारी खाता बनाएं",
    "Attach this main officer to one department.": "इस मुख्य अधिकारी को एक विभाग से जोड़ें।",
    "First Name": "पहला नाम",
    "Last Name": "अंतिम नाम",
    "Username": "उपयोगकर्ता नाम",
    "Email": "ईमेल",
    "Phone": "फोन",
    "Employee ID": "कर्मचारी ID",
    "Area / Jurisdiction": "क्षेत्र / अधिकार क्षेत्र",
    "Sector / Ward": "सेक्टर / वार्ड",
    "PIN Code": "पिन कोड",
    "Password": "पासवर्ड",
    "Department": "विभाग",
    "-- Select --": "-- चुनें --",
    "Save Main Officer": "मुख्य अधिकारी सहेजें",
    "Create Main Officer": "मुख्य अधिकारी बनाएं",
    "Department Main Officer": "विभाग मुख्य अधिकारी",
    "Senior Officer": "वरिष्ठ अधिकारी",
    "Sub Officer": "उप अधिकारी",
    "Field Officer": "फील्ड अधिकारी",
    "No Dept": "कोई विभाग नहीं",
    "No main officers created yet.": "अभी तक कोई मुख्य अधिकारी नहीं बनाया गया।",
    "Reports to": "रिपोर्ट करता है",
  },
};

function adminText(language, fallbackT, text) {
  return ADMIN_TRANSLATIONS[language]?.[text] || fallbackT(text);
}

export default function AdminDashboard() {
  const qc = useQueryClient();
  const { t: baseT, language } = useLanguage();
  const t = (text) => adminText(language, baseT, text);
  const [tab, setTab] = useState("assign");
  const [filters, setFilters] = useState({ status: "", department: "", priority: "", search: "" });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.stats().then((r) => r.data),
    refetchInterval: 60000,
  });

  const { data: complaintsData, isLoading: complaintsLoading } = useQuery({
    queryKey: ["admin-complaints", filters],
    queryFn: () => adminApi.complaints(filters).then((r) => r.data),
  });

  const { data: deptData } = useQuery({
    queryKey: ["departments"],
    queryFn: () => adminApi.departments().then((r) => r.data),
  });

  const { data: officersData } = useQuery({
    queryKey: ["officers"],
    queryFn: () => adminApi.users({ role: "OFFICER" }).then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateComplaint(id, data),
    onSuccess: () => {
      qc.invalidateQueries(["admin-complaints"]);
      qc.invalidateQueries(["admin-stats"]);
      toast.success(t("Complaint updated successfully"));
      setEditing(null);
    },
    onError: () => toast.error(t("Update failed")),
  });

  const complaints = complaintsData?.results || complaintsData || [];
  const departments = deptData?.results || deptData || [];
  const officers = officersData?.results || officersData || [];
  const mainOfficers = officers.filter((o) => o.officer_level === "DEPARTMENT_HEAD");
  const assignedHeadIds = new Set(departments.map((d) => d.head_officer).filter(Boolean));

  const statCards = stats ? [
    { label: "Total Complaints", value: stats.total, icon: "📋", color: "blue" },
    { label: "Pending", value: stats.pending, icon: "⏳", color: "yellow" },
    { label: "Resolved", value: stats.resolved, icon: "✅", color: "green" },
    { label: "SLA Breached", value: stats.sla_breached, icon: "🚨", color: "red" },
    { label: "Avg. Rating", value: stats.average_rating || "—", icon: "⭐", color: "purple" },
  ] : [];

  const categoryChartData = stats?.by_category
    ? Object.entries(stats.by_category).map(([k, v]) => ({ name: k, value: v }))
    : [];

  const deptChartData = stats?.by_department || [];

  const startEdit = (c) => {
    setEditing(c.id);
    setEditForm({
      category: c.category,
      priority: c.priority,
      status: c.status,
      department: c.department,
      assigned_officer: c.assigned_officer || "",
      admin_override_note: c.admin_override_note || "",
    });
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-[linear-gradient(135deg,#fffdf4_0%,#fff7d6_48%,#f8fafc_100%)] px-4 py-6 dark:bg-none">
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 overflow-hidden rounded border border-amber-200 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="h-1.5 bg-amber-500" />
        <div className="p-5 md:p-6">
          <p className="text-sm font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">{t("Admin / Main Admin Panel")}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-100">{t("Assign Department and Officer")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t("Admin only manages departments and department main officers. The rest of the officer chain is handled from the main officer and officer dashboards.")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Add Department", "Edit Department", "Delete Department", "Add Main Officer", "Assign Department"].map((item) => (
              <span key={item} className="rounded bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20">{t(item)}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <SummaryCard label={t("Departments")} value={departments.length} />
        <SummaryCard label={t("Main Officers")} value={mainOfficers.length} />
        <SummaryCard label={t("Assigned Departments")} value={assignedHeadIds.size} />
        <SummaryCard label={t("Unassigned Departments")} value={departments.filter((d) => !d.head_officer).length} />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex w-fit flex-wrap gap-1 rounded bg-white/90 p-1 shadow-sm ring-1 ring-amber-100 dark:bg-slate-900 dark:ring-slate-700">
        {[
          ["assign", "Assign Department and Main Officer"],
          ["hierarchy", "Hierarchy"],
          ["monitor", "Monitor All Complaints"],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`rounded px-4 py-1.5 text-sm font-bold transition-all ${tab === key ? "bg-amber-500 text-slate-950 shadow dark:bg-amber-400 dark:text-slate-950" : "text-slate-500 hover:bg-amber-50 hover:text-amber-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"}`}>
            {t(label)}
          </button>
        ))}
      </div>

      {false && tab === "complaints" && (
        <>
          {/* Filters */}
          <div className="card mb-4 grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
            <input className="input text-sm" placeholder="Search ticket / title..."
              value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            <select className="input text-sm" value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Statuses</option>
              {["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "ESCALATED", "CLOSED"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select className="input text-sm" value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
              <option value="">All Priorities</option>
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className="input text-sm" value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {complaintsLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : complaints.length === 0 ? (
            <EmptyState icon="✅" title="No complaints match filters" />
          ) : (
            <div className="space-y-2">
              {complaints.map((c) => (
                <div key={c.id} className="card p-4 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-xl mt-0.5"><CategoryIcon category={c.category} /></span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900">{c.title}</p>
                          <span className="text-xs font-mono text-gray-400">#{c.ticket_id}</span>
                          {c.is_sla_breached && <span className="badge bg-red-100 text-red-700">⚠️ SLA Breach</span>}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{c.description}</p>
                        <div className="flex gap-2 mt-1.5 flex-wrap">
                          <StatusBadge status={c.status} />
                          <PriorityBadge priority={c.priority} />
                          <span className="text-xs text-gray-500">👤 {c.citizen_name}</span>
                          {c.department_name && <span className="text-xs text-gray-500">🏛️ {c.department_name}</span>}
                        </div>
                        {c.proof_of_resolution && (
                          <a
                            href={c.proof_of_resolution}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                          >
                            📎 View proof of resolution
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="text-xs text-gray-400">{formatDate(c.created_at)}</p>
                      {editing === c.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => updateMutation.mutate({ id: c.id, data: editForm })}
                            disabled={updateMutation.isPending}
                            className="btn-primary text-xs py-1 px-3">Save</button>
                          <button onClick={() => setEditing(null)} className="btn-secondary text-xs py-1 px-3">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(c)} className="btn-secondary text-xs py-1 px-3">Edit</button>
                      )}
                    </div>
                  </div>

                  {editing === c.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Status</label>
                        <select className="input text-sm" value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                          {["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "ESCALATED", "REJECTED"].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Priority</label>
                        <select className="input text-sm" value={editForm.priority}
                          onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
                          {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Category</label>
                        <select className="input text-sm" value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                          {["ELECTRICITY", "WATER", "SANITATION", "ROADS", "PUBLIC_SERVICES", "HEALTH", "EDUCATION", "OTHER"].map((cat) => (
                            <option key={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Department</label>
                        <select className="input text-sm" value={editForm.department || ""}
                          onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}>
                          <option value="">-- Select --</option>
                          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Assign Officer</label>
                        <select className="input text-sm" value={editForm.assigned_officer || ""}
                          onChange={(e) => setEditForm({ ...editForm, assigned_officer: e.target.value })}>
                          <option value="">-- Select --</option>
                          {officers.map((o) => (
                            <option key={o.id} value={o.id}>{o.first_name} {o.last_name} ({o.department_name})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Override Note</label>
                        <input className="input text-sm" value={editForm.admin_override_note}
                          onChange={(e) => setEditForm({ ...editForm, admin_override_note: e.target.value })}
                          placeholder="Reason for override..." />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab === "analytics" && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Complaints by Category</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                  {categoryChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Top Departments by Volume</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={deptChartData.slice(0, 6)}>
                <XAxis dataKey="department__name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1D6FA5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Status Distribution</h3>
            <div className="space-y-2">
              {Object.entries(stats.by_status || {}).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-28">{status}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(count / stats.total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Priority Breakdown</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(stats.by_priority || {}).map(([p, count]) => (
                <div key={p} className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-center">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <PriorityBadge priority={p} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "ai-flow" && <AiFlowPanel />}

      {tab === "assign" && (
        <DepartmentManagement
          departments={departments}
          officers={officers}
          t={t}
          onOfficerCreated={() => qc.invalidateQueries({ queryKey: ["officers"] })}
          onChanged={() => {
            qc.invalidateQueries({ queryKey: ["departments"] });
            qc.invalidateQueries({ queryKey: ["admin-stats"] });
          }}
        />
      )}

      {tab === "hierarchy" && <HierarchyPanel departments={departments} officers={officers} t={t} />}

      {tab === "monitor" && (
        <ComplaintMonitorPanel
          complaints={complaints}
          departments={departments}
          filters={filters}
          setFilters={setFilters}
          isLoading={complaintsLoading}
        />
      )}
    </div>
    </div>
  );
}

function ComplaintMonitorPanel({ complaints, departments, filters, setFilters, isLoading }) {
  return (
    <div className="grid gap-4">
      <div className="card grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
        <input className="input text-sm" placeholder="Search ticket / title..."
          value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select className="input text-sm" value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Statuses</option>
          {["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "ESCALATED", "CLOSED"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="input text-sm" value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All Priorities</option>
          {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className="input text-sm" value={filters.department}
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : complaints.length === 0 ? (
        <EmptyState icon="✅" title="No complaints match filters" />
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div key={c.id} className="card p-4 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="mt-0.5 text-xl"><CategoryIcon category={c.category} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-slate-100">{c.title}</p>
                      <span className="font-mono text-xs text-gray-400 dark:text-slate-500">#{c.ticket_id}</span>
                      {c.is_sla_breached && <span className="badge bg-red-100 text-red-700">SLA Breach</span>}
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-sm text-gray-500 dark:text-slate-400">{c.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                      <span className="text-xs text-gray-500 dark:text-slate-400">Citizen: {c.complainant_name || c.citizen_name}</span>
                      {c.department_name && <span className="text-xs text-gray-500 dark:text-slate-400">Department: {c.department_name}</span>}
                      {c.officer_name && <span className="text-xs text-gray-500 dark:text-slate-400">Officer: {c.officer_name}</span>}
                    </div>
                    {c.routing_note && (
                      <div className="mt-2 rounded border border-cyan-100 bg-cyan-50 p-2 text-xs font-medium text-cyan-900 dark:border-slate-700 dark:bg-slate-800 dark:text-cyan-200">
                        {c.routing_note}
                      </div>
                    )}
                  </div>
                </div>
                <p className="shrink-0 text-xs text-gray-400 dark:text-slate-500">{formatDate(c.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AiFlowPanel() {
  const flow = [
    { icon: FileText, title: "Grievance ingestion", text: "Complaint enters from Jan Samadhan UI or an existing CPGRAMS/state portal API." },
    { icon: Languages, title: "Language handling", text: "System detects language and translates text when required." },
    { icon: Bot, title: "AI classification", text: "NLP/LLM engine predicts category and confidence." },
    { icon: Timer, title: "Priority detection", text: "Urgent issues are marked HIGH or CRITICAL for faster redressal." },
    { icon: GitBranch, title: "Routing", text: "Category and department mapping transmit the grievance to the right officer queue." },
    { icon: CheckCircle2, title: "Tracking", text: "Status, SLA, feedback, and closure create accountability." },
  ];

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">AI grievance processing engine</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          This dashboard explains how Jan Samadhan AI satisfies the problem statement: automated classification, multilingual processing, priority detection, routing, tracking, and secure role-based access.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {flow.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <Icon size={19} className="text-blue-700" />
                <h3 className="mt-3 text-sm font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Building2 size={19} className="text-blue-700" />
            <h3 className="font-semibold text-gray-900">Existing portal integration</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Government portals can call <span className="font-mono text-gray-800">POST /api/ai/classify/</span> with complaint text and location. Jan Samadhan AI returns category, priority, confidence, language, summary, and department routing.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={19} className="text-blue-700" />
            <h3 className="font-semibold text-gray-900">Full portal deployment</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Smaller departments can use Jan Samadhan AI directly for citizen registration, grievance lodging, officer assignment, SLA escalation, status updates, feedback, and closure.
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded border border-amber-100 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-amber-600 dark:text-amber-300">{value}</p>
    </div>
  );
}

function OfficerManagement({ departments, officers, onCreated, t }) {
  const emptyForm = { username: "", email: "", password: "", phone: "", first_name: "", last_name: "", employee_id: "", department_id: "", officer_level: "DEPARTMENT_HEAD", supervisor_id: "", jurisdiction: "", sector: "", pin_code: "" };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingOfficerId, setEditingOfficerId] = useState(null);
  const mainOfficers = officers.filter((o) => o.officer_level === "DEPARTMENT_HEAD");

  const mutation = useMutation({
    mutationFn: (data) => editingOfficerId
      ? adminApi.updateOfficer(editingOfficerId, officerUpdatePayload(data))
      : adminApi.createOfficer({ ...data, officer_level: "DEPARTMENT_HEAD", supervisor_id: "" }),
    onSuccess: () => {
      toast.success(editingOfficerId ? t("Main officer updated") : t("Main officer created"));
      setForm(emptyForm);
      setShowForm(false);
      setEditingOfficerId(null);
      onCreated();
    },
    onError: (err) => toast.error(formatOfficerError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteOfficer(id),
    onSuccess: () => {
      toast.success(t("Main officer deleted"));
      onCreated();
    },
    onError: () => toast.error(t("Delete failed")),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const startOfficerEdit = (officer) => {
    setEditingOfficerId(officer.id);
    setShowForm(true);
    setForm({
      username: officer.username || "",
      email: officer.email || "",
      password: "",
      phone: officer.phone || "",
      first_name: officer.first_name || "",
      last_name: officer.last_name || "",
      employee_id: officer.employee_id || "",
      department_id: officer.department || "",
      officer_level: "DEPARTMENT_HEAD",
      supervisor_id: "",
      jurisdiction: officer.jurisdiction || "",
      sector: officer.sector || "",
      pin_code: officer.pin_code || "",
    });
  };

  return (
    <div className="rounded border border-amber-100 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">{t("Main Officer Management")}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-slate-100">{t("Main Officers")}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("Admin creates only department main officers here. Main officers create the next officer chain from their dashboard.")}</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingOfficerId(null); setForm(emptyForm); }} className="shrink-0 rounded bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 shadow-sm hover:bg-amber-400 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300">+ {t("Add Main Officer")}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-5 overflow-hidden rounded border border-amber-100 bg-amber-50/40 dark:border-slate-700 dark:bg-slate-800">
          <div className="bg-amber-500 px-5 py-4 text-slate-950 dark:bg-amber-400">
            <h3 className="font-black">{editingOfficerId ? t("Edit Main Officer") : t("Create Main Officer Account")}</h3>
            <p className="text-sm text-slate-700">{t("Attach this main officer to one department.")}</p>
          </div>
          <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[["first_name", "First Name"], ["last_name", "Last Name"], ["username", "Username"],
              ["email", "Email"], ["phone", "Phone"], ["employee_id", "Employee ID"], ["jurisdiction", "Area / Jurisdiction"], ["sector", "Sector / Ward"], ["pin_code", "PIN Code"]].map(([k, l]) => (
              <div key={k}>
                <label className="text-xs text-gray-500 mb-1 block dark:text-slate-400">{t(l)}</label>
                <input
                  className="input text-sm"
                  type={k === "email" ? "email" : k === "phone" ? "tel" : "text"}
                  required={["first_name", "username", "email"].includes(k)}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-500 mb-1 block dark:text-slate-400">{t("Password")}</label>
              <input className="input text-sm" type="password" required={!editingOfficerId} minLength={editingOfficerId ? 0 : 6} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block dark:text-slate-400">{t("Department")}</label>
              <select className="input text-sm" required value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value, supervisor_id: "" })}>
                <option value="">{t("-- Select --")}</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={mutation.isPending} className="rounded bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 shadow-sm hover:bg-amber-400 disabled:opacity-60 dark:bg-amber-400 dark:hover:bg-amber-300">
              {mutation.isPending ? t("Saving...") : editingOfficerId ? t("Save Main Officer") : t("Create Main Officer")}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingOfficerId(null); setForm(emptyForm); }} className="btn-secondary text-sm">{t("Cancel")}</button>
          </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3">
        {mainOfficers.map((o) => (
          <div key={o.id} className="rounded border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-amber-500 font-black text-slate-950 dark:bg-amber-400">
                  {o.first_name?.[0] || o.username?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900 dark:text-slate-100">{displayName(o)}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-slate-400">{o.email}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => startOfficerEdit(o)} className="btn-secondary px-3 py-1 text-xs">{t("Edit")}</button>
                <button type="button" onClick={() => deleteMutation.mutate(o.id)} className="btn-danger px-3 py-1 text-xs">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <span className="badge bg-blue-50 text-blue-700">{o.department_name || t("No Dept")}</span>
              <span className="badge bg-emerald-50 text-emerald-700">{t("Department Main Officer")}</span>
              {o.employee_id && <span className="badge bg-gray-100 text-gray-600">ID: {o.employee_id}</span>}
              {o.jurisdiction && <span className="badge bg-amber-50 text-amber-700">{o.jurisdiction}</span>}
              {(o.sector || o.pin_code) && <span className="badge bg-orange-50 text-orange-700">{[o.sector, o.pin_code].filter(Boolean).join(" / ")}</span>}
            </div>
            {o.supervisor_name && <p className="mt-2 text-xs text-slate-500">{t("Reports to")} {o.supervisor_name}</p>}
          </div>
        ))}
        {mainOfficers.length === 0 && (
          <div className="rounded border border-dashed border-slate-300 bg-white p-5 text-center text-sm font-semibold text-slate-500">
            {t("No main officers created yet.")}
          </div>
        )}
      </div>
    </div>
  );
}

function DepartmentManagement({ departments, officers, onChanged, onOfficerCreated, t }) {
  const empty = { name: "", code: "", government_level: "STATE", description: "", email: "", head_officer: "", parent_department: "" };
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [governmentFilter, setGovernmentFilter] = useState("ALL");

  const saveMutation = useMutation({
    mutationFn: (payload) => editingId ? adminApi.updateDepartment(editingId, payload) : adminApi.createDepartment(payload),
    onSuccess: () => {
      toast.success(editingId ? t("Department updated") : t("Department added"));
      setForm(empty);
      setEditingId(null);
      onChanged();
    },
    onError: (err) => toast.error(err.response?.data?.detail || t("Department save failed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteDepartment(id),
    onSuccess: () => {
      toast.success(t("Department disabled"));
      onChanged();
    },
    onError: () => toast.error(t("Delete failed")),
  });

  const submit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      ...form,
      code: form.code.toUpperCase().replace(/\s+/g, "_"),
      head_officer: form.head_officer || null,
      parent_department: form.parent_department || null,
    });
  };

  const startEdit = (dept) => {
    setEditingId(dept.id);
    setForm({
      name: dept.name || "",
      code: dept.code || "",
      government_level: dept.government_level || "STATE",
      description: dept.description || "",
      email: dept.email || "",
      head_officer: dept.head_officer || "",
      parent_department: dept.parent_department || "",
    });
  };

  const filteredDepartments = departments.filter((dept) => (
    governmentFilter === "ALL" ? true : dept.government_level === governmentFilter
  ));

  const governmentCounts = {
    ALL: departments.length,
    CENTRAL: departments.filter((dept) => dept.government_level === "CENTRAL").length,
    STATE: departments.filter((dept) => dept.government_level === "STATE").length,
    LOCAL: departments.filter((dept) => dept.government_level === "LOCAL").length,
  };

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid content-start gap-5">
          <form onSubmit={submit} className="overflow-hidden rounded border border-amber-100 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="bg-amber-500 px-5 py-4 text-slate-950 dark:bg-amber-400">
              <h2 className="font-black">{editingId ? t("Edit Department") : t("Add Department")}</h2>
              <p className="text-sm text-slate-700">{t("Manage state, central, and local department routing.")}</p>
            </div>
            <div className="grid gap-3 p-5">
              <input className="input" required placeholder={t("Department name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="input" required placeholder={t("Department code, e.g. ELECTRICITY")} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              <select className="input" value={form.government_level} onChange={(e) => setForm({ ...form, government_level: e.target.value })}>
                <option value="STATE">{t("State Government")}</option>
                <option value="CENTRAL">{t("Central Government")}</option>
                <option value="LOCAL">{t("Local Body")}</option>
              </select>
              <select className="input" value={form.head_officer} onChange={(e) => setForm({ ...form, head_officer: e.target.value })}>
                <option value="">{t("Assign Department Main Officer")}</option>
                {officers.filter((o) => o.officer_level === "DEPARTMENT_HEAD").map((o) => <option key={o.id} value={o.id}>{displayName(o)}</option>)}
              </select>
              <input className="input" type="email" placeholder={t("Department email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <textarea className="input" rows={3} placeholder={t("Description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="flex gap-2">
                <button className="rounded bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 shadow-sm hover:bg-amber-400 disabled:opacity-60 dark:bg-amber-400 dark:hover:bg-amber-300" disabled={saveMutation.isPending}>{saveMutation.isPending ? t("Saving...") : t("Save Department")}</button>
                {editingId && <button type="button" className="btn-secondary text-sm" onClick={() => { setEditingId(null); setForm(empty); }}>{t("Cancel")}</button>}
              </div>
            </div>
          </form>

          <OfficerManagement departments={departments} officers={officers} onCreated={onOfficerCreated} t={t} />
        </div>

        <div className="grid content-start gap-3">
          <div className="flex flex-wrap gap-2 rounded border border-amber-100 bg-white/90 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {[
              ["ALL", "All Departments"],
              ["CENTRAL", "Central Government"],
              ["STATE", "State Government"],
              ["LOCAL", "Local Body"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setGovernmentFilter(value)}
                className={`rounded px-4 py-2 text-sm font-bold transition ${governmentFilter === value ? "bg-amber-500 text-slate-950 shadow-sm dark:bg-amber-400" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-amber-50 hover:text-amber-800 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"}`}
              >
                {t(label)} ({governmentCounts[value]})
              </button>
            ))}
          </div>
          {filteredDepartments.map((dept) => {
            const deptOfficers = officers.filter((o) => o.department === dept.id);
            return (
              <div key={dept.id} className="rounded border border-amber-100 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-950 dark:text-slate-100">{dept.name}</h3>
                      <span className="badge bg-amber-50 text-amber-700">{dept.government_level_display || dept.government_level}</span>
                      {!dept.is_active && <span className="badge bg-red-50 text-red-700">{t("Inactive")}</span>}
                    </div>
                    <p className="mt-1 text-xs font-mono text-slate-400 dark:text-slate-500">{dept.code}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{dept.description || t("No description added.")}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="badge bg-slate-100 text-slate-700">{dept.complaint_count} {t("open complaints")}</span>
                      <span className="badge bg-indigo-50 text-indigo-700">{deptOfficers.length} {t("officers")}</span>
                      {dept.head_officer_name && <span className="badge bg-emerald-50 text-emerald-700">{t("Head")}: {dept.head_officer_name}</span>}
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {OFFICER_LEVELS.map(([value, label]) => (
                        <div key={value} className="rounded border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                          <p className="text-xs font-black text-slate-500 dark:text-slate-400">{t(label)}</p>
                          <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                            {deptOfficers.filter((o) => o.officer_level === value).map(displayName).join(", ") || t("Not assigned")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(dept)} className="btn-secondary px-3 py-1 text-xs">{t("Edit")}</button>
                    <button type="button" onClick={() => deleteMutation.mutate(dept.id)} className="btn-danger px-3 py-1 text-xs" title={t("Disable department")}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredDepartments.length === 0 && (
            <div className="rounded border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500">
              {t("No departments found for this government type.")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HierarchyPanel({ departments, officers, t }) {
  const stages = [
    { title: "Citizen Complaint Submitted", text: "Citizen submits name, valid ID, PIN, complaint details, and file/photo." },
    { title: "Central Complaint Portal / State Grievance Portal", text: "Portal classifies and routes the complaint by department." },
    { title: "Main Officer (Super Admin)", text: "Add/edit/delete departments, manage government departments, monitor complaints, assign department heads." },
    { title: "Department-Wise Main Officer", text: "Electricity, water supply, road/transport, sanitation, and other department heads." },
    { title: "Department Officers", text: "Review complaints, verify details, and assign complaints to sub officers." },
    { title: "Sub Officers", text: "Handle area-wise complaints, update status, coordinate field staff." },
    { title: "Sub-Section Officers / Field Officers", text: "Perform ground-level work, resolve citizen issues, upload proof/reports." },
    { title: "Complaint Resolution & Status Update", text: "Citizen receives resolution notification and can track status." },
  ];

  return (
    <div className="grid gap-5">
      <div className="rounded border border-cyan-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Network size={20} className="text-cyan-700 dark:text-cyan-300" />
          <h2 className="text-xl font-black text-slate-950 dark:text-slate-100">{t("Complaint Assignment Structure")}</h2>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {stages.map((stage, index) => (
            <div key={stage.title} className="rounded border border-cyan-100 bg-cyan-50 p-3 dark:border-cyan-400/20 dark:bg-cyan-400/10">
              <p className="text-xs font-black text-cyan-700 dark:text-cyan-300">{String(index + 1).padStart(2, "0")}</p>
              <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{t(stage.title)}</p>
              <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{t(stage.text)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {departments.map((dept) => {
          const deptOfficers = officers.filter((o) => o.department === dept.id);
          return (
            <div key={dept.id} className="rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-950 dark:text-slate-100">{dept.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{dept.government_level_display || dept.government_level}</p>
                </div>
                <span className="badge bg-teal-50 text-teal-700">{deptOfficers.length} {t("officers")}</span>
              </div>
              <div className="mt-4 space-y-2">
                {OFFICER_LEVELS.map(([value, label]) => (
                  <div key={value} className="rounded border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-xs font-black text-slate-500 dark:text-slate-400">{t(label)}</p>
                    <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                      {deptOfficers.filter((o) => o.officer_level === value).map(displayName).join(", ") || t("Not assigned")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function displayName(user) {
  return `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;
}

function withoutPassword(data) {
  const { password, ...rest } = data;
  return rest;
}

function officerUpdatePayload(data) {
  const payload = withoutPassword(data);
  payload.department = payload.department_id || null;
  delete payload.department_id;
  delete payload.supervisor_id;
  return payload;
}

function formatOfficerError(err) {
  const data = err.response?.data;
  const errors = data?.errors;
  if (errors) {
    return Object.entries(errors)
      .map(([field, message]) => `${field.replace("_", " ")}: ${message}`)
      .join(" ");
  }
  return data?.error || data?.detail || "Failed to create officer";
}
