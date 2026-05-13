import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh/`, { refresh }, { timeout: 5000 });
          localStorage.setItem("access_token", data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── API helpers ─────────────────────────────────────────────────────────────

export const authApi = {
  login: (data) => api.post("/auth/login/", data),
  register: (data) => api.post("/auth/register/", data),
  me: () => api.get("/auth/me/"),
  verifyEmail: (uidb64, token) => api.get(`/auth/verify-email/${uidb64}/${encodeURIComponent(token)}/`),
  verifyEmailOtp: (data) => api.post("/auth/verify-email/", data),
  resendVerification: (data) => api.post("/auth/resend-verification/", data),
};

export const complaintApi = {
  list: (params) => api.get("/complaints/", { params }),
  create: (data) => api.post("/complaints/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  get: (id) => api.get(`/complaints/${id}/`),
  feedback: (id, data) => api.patch(`/complaints/${id}/feedback/`, data),
  track: (ticketId) => api.get(`/track/${ticketId}/`),
};

export const adminApi = {
  complaints: (params) => api.get("/admin/complaints/", { params }),
  updateComplaint: (id, data) => api.patch(`/admin/complaints/${id}/`, data),
  stats: () => api.get("/admin/stats/"),
  users: (params) => api.get("/admin/users/", { params }),
  createOfficer: (data) => api.post("/admin/create-officer/", data),
  updateOfficer: (id, data) => api.patch(`/admin/officers/${id}/`, data),
  deleteOfficer: (id) => api.delete(`/admin/officers/${id}/`),
  departments: () => api.get("/admin/departments/"),
  createDepartment: (data) => api.post("/admin/departments/", data),
  updateDepartment: (id, data) => api.patch(`/admin/departments/${id}/`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}/`),
};

export const officerApi = {
  complaints: () => api.get("/officer/complaints/"),
  createComplaint: (data) => api.post("/officer/add-complaint/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  assignableOfficers: () => api.get("/officer/assignable-officers/"),
  createSubordinate: (data) => api.post("/officer/subordinates/", data),
  updateSubordinate: (id, data) => api.patch(`/officer/subordinates/${id}/`, data),
  deleteSubordinate: (id) => api.delete(`/officer/subordinates/${id}/`),
  update: (id, data) => api.patch(`/officer/complaints/${id}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
};

export const notificationApi = {
  list: () => api.get("/notifications/"),
  markRead: (id) => api.post(`/notifications/${id}/read/`),
};

export const departmentApi = {
  list: () => api.get("/departments/"),
};

export const chatbotApi = {
  ask: (message) => api.post("/chatbot/help/", { message }),
};

export const aiApi = {
  classify: (data) => api.post("/ai/classify/", data),
};

export const publicApi = {
  stats: () => api.get("/public/stats/"),
};
