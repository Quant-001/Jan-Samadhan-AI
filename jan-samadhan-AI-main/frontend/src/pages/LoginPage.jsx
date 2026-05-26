import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { authApi } from "../api";
import toast from "react-hot-toast";
import { LogIn, MailCheck, RefreshCw, Search, ShieldCheck, Loader2, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [step, setStep] = useState("credentials"); // credentials, otp
  const [form, setForm] = useState({ username: "", password: "" });
  const [otpForm, setOtpForm] = useState({ otp: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpData, setOtpData] = useState(null); // Store user_id and email for OTP verification
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const verificationMessage = location.state?.verificationMessage;

  const showOtpFallback = (data) => {
    if (!data?.otp_fallback) return;
    toast.success(`Use OTP ${data.otp_fallback}`, { duration: 10000 });
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (form.username.includes("*")) {
      toast.error("Use an exact username, for example officer_electricity or head_water.");
      return;
    }
    setLoading(true);
    try {
      // Try OTP-based login first (for citizens)
      const { data } = await authApi.requestLoginOtp({
        username: form.username,
        password: form.password,
      });

      // If we get here and it's a citizen, we need OTP
      if (data.user_id) {
        setOtpData({
          user_id: data.user_id,
          email: data.email,
          username: data.username,
        });
        setStep("otp");
        const message = data?.detail || "OTP sent to your email";
        if (data?.email_sent === false) toast.error(message);
        else toast.success(message);
        showOtpFallback(data);
      } else {
        // For officers/admins, they got tokens directly
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        const userData = data.user;
        toast.success(`Welcome back, ${userData.first_name || userData.username}!`);
        if (from && userData.role === "CITIZEN") navigate(from, { replace: true });
        else if (userData.role === "ADMIN") navigate("/admin/dashboard");
        else if (userData.role === "OFFICER") navigate("/officer/dashboard");
        else navigate("/citizen/dashboard");
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail) {
        toast.error(detail);
        if (err.response?.status === 403 && detail.toLowerCase().includes("verify your email")) {
          navigate("/verify-email", {
            state: {
              from,
              verificationEmail: err.response?.data?.email || form.username,
              verificationMessage: "Verify your email with the OTP before signing in.",
            },
          });
        }
      } else if (!err.response) {
        toast.error("Login server is not reachable. Please try again later.");
      } else if (err.response.status === 401) {
        toast.error("Invalid credentials");
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otpForm.otp.length !== 6) {
      toast.error("Enter a 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.verifyLoginOtp({
        user_id: otpData.user_id,
        otp: otpForm.otp,
      });

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      const userData = data.user;
      toast.success(`Welcome back, ${userData.first_name || userData.username}!`);
      if (from) navigate(from, { replace: true });
      else navigate("/citizen/dashboard");
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail) {
        toast.error(detail);
      } else {
        toast.error("OTP verification failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpData?.user_id) {
      toast.error("Unable to resend OTP");
      return;
    }

    setResending(true);
    try {
      const { data } = await authApi.resendLoginOtp({ user_id: otpData.user_id });
      const message = data?.detail || "OTP sent to your email";
      if (data?.email_sent === false) toast.error(message);
      else toast.success(message);
      showOtpFallback(data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not send OTP");
    } finally {
      setResending(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep("credentials");
    setOtpForm({ otp: "" });
    setOtpData(null);
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
            <h1 className="text-2xl font-extrabold text-slate-950">
              {step === "credentials" ? "Sign in" : "Verify OTP"}
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {step === "credentials" 
                ? "Access citizen, officer, or admin dashboard"
                : `We sent an OTP to ${otpData?.email}`}
            </p>
          </div>

          {verificationMessage && step === "credentials" && (
            <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
              <div className="flex items-start gap-2">
                <MailCheck className="mt-0.5 shrink-0" size={17} />
                <span>{verificationMessage}</span>
              </div>
            </div>
          )}

          {step === "credentials" ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username or Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    className="input pl-9"
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="Enter username or email"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    className="input pl-9 pr-11"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm">
                <div className="flex gap-2">
                  <AlertCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-blue-800 text-xs">
                    <span className="font-semibold">Citizens:</span> You'll verify with an OTP sent to your email after login.
                  </p>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 py-2.5 text-base">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
                {loading ? "Please wait..." : "Continue"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">6-Digit OTP</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    className="input pl-9 text-center font-mono text-lg tracking-[0.35em]"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpForm.otp}
                    onChange={(e) => setOtpForm({ otp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    placeholder="000000"
                    required
                    autoFocus
                  />
                </div>
                <p className="mt-2 text-xs text-slate-600">Check your email inbox for the verification code</p>
              </div>
              <button type="submit" disabled={loading || otpForm.otp.length !== 6} className="btn-primary flex w-full items-center justify-center gap-2 py-2.5 text-base">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="btn-secondary flex w-full items-center justify-center gap-2 py-2.5 text-sm"
              >
                <RefreshCw size={16} className={resending ? "animate-spin" : ""} />
                {resending ? "Sending..." : "Resend OTP"}
              </button>

              <button
                type="button"
                onClick={handleBackToCredentials}
                className="w-full text-sm text-slate-600 hover:text-slate-900 py-2 font-semibold"
              >
                ← Back to login
              </button>
            </form>
          )}

          {step === "credentials" && (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
