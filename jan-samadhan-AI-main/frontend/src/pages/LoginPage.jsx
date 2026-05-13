import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../api";
import toast from "react-hot-toast";
import { LogIn, MailCheck, RefreshCw, Search } from "lucide-react";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const verificationEmail = location.state?.verificationEmail || "";
  const verificationMessage = location.state?.verificationMessage;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.username.includes("*")) {
      toast.error("Use an exact username, for example officer_electricity or head_water.");
      return;
    }
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.first_name || user.username}!`);
      if (from && user.role === "CITIZEN") navigate(from, { replace: true });
      else if (user.role === "ADMIN") navigate("/admin/dashboard");
      else if (user.role === "OFFICER") navigate("/officer/dashboard");
      else navigate("/citizen/dashboard");
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail) {
        toast.error(detail);
      } else if (!err.response) {
        toast.error("Login server is not reachable. Please try again after the backend wakes up.");
      } else if (err.response.status === 401) {
        toast.error("Invalid credentials");
      } else {
        toast.error("Login server configuration error. Please redeploy the backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const identifier = verificationEmail || form.username.trim();
    if (!identifier) {
      toast.error("Enter your username or email first.");
      return;
    }

    setResending(true);
    try {
      const { data } = await authApi.resendVerification({ identifier });
      toast.success(data?.detail || "Verification OTP sent.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not send verification OTP.");
    } finally {
      setResending(false);
    }
  };

  const demoAccounts = [
    { label: "Electricity Officer", username: "officer_electricity", password: "Officer@1234" },
    { label: "Water Head", username: "head_water", password: "Head@1234" },
    { label: "Admin", username: "admin", password: "Admin@1234" },
    { label: "Citizen", username: "citizen_demo", password: "Citizen@1234" },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.18),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)]">
      <div className="bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span>Jan Samadhan AI</span>
          <Link to="/" className="hover:underline">Home</Link>
        </div>
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-7xl items-center justify-center p-4">
        <div className="w-full max-w-lg rounded border border-slate-200 bg-white/95 p-7 shadow-xl shadow-slate-200/70">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded bg-cyan-400 text-lg font-black text-slate-950">JS</div>
            <h1 className="text-2xl font-extrabold text-slate-950">Sign in</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Access citizen, officer, or admin dashboard</p>
          </div>
          {verificationMessage && (
            <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
              <div className="flex items-start gap-2">
                <MailCheck className="mt-0.5 shrink-0" size={17} />
                <span>{verificationMessage}</span>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              className="input"
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 py-2.5 text-base">
            <LogIn size={18} />
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resending}
            className="btn-secondary flex w-full items-center justify-center gap-2 py-2.5 text-sm"
          >
            <RefreshCw size={16} className={resending ? "animate-spin" : ""} />
            {resending ? "Sending OTP..." : "Resend verification OTP"}
          </button>
        </form>
          <div className="mt-5 rounded border border-cyan-100 bg-cyan-50 p-3">
            <p className="text-xs font-black uppercase tracking-wide text-cyan-800">Demo Logins</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => setForm({ username: account.username, password: account.password })}
                  className="rounded border border-cyan-200 bg-white px-3 py-2 text-left text-xs font-bold text-slate-800 hover:border-cyan-500 hover:text-cyan-800"
                >
                  <span className="block">{account.label}</span>
                  <span className="font-mono text-[11px] text-slate-500">{account.username}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 border-t border-gray-200 pt-4 text-center text-sm font-semibold">
            <Link to="/register" state={{ from }} className="mr-4 text-cyan-700 hover:underline">
              Click here to sign up
            </Link>
            <Link to="/track" className="inline-flex items-center gap-1 text-slate-900 hover:underline">
              <Search size={15} /> Track by Ticket ID
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
