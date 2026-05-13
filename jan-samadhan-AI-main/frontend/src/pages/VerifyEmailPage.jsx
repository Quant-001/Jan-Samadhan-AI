import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Loader2, MailWarning, RefreshCw, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "../api";

export default function VerifyEmailPage() {
  const { uidb64, token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    identifier: location.state?.verificationEmail || "",
    otp: "",
  });
  const [state, setState] = useState({
    status: uidb64 && token ? "loading" : "otp",
    message: location.state?.verificationMessage || "Enter the OTP sent to your registered email.",
  });
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!uidb64 || !token) return undefined;

    let active = true;
    authApi.verifyEmail(uidb64, token)
      .then((res) => {
        if (active) setState({ status: "success", message: res.data?.detail || "Email verified successfully." });
      })
      .catch((err) => {
        if (active) {
          setState({
            status: "error",
            message: err.response?.data?.detail || "Verification link is invalid or expired.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [uidb64, token]);

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!form.identifier.trim() || form.otp.length !== 6) {
      toast.error("Enter your email and 6 digit OTP.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await authApi.verifyEmailOtp(form);
      setState({ status: "success", message: data?.detail || "Email verified successfully." });
      toast.success("Email verified. Please sign in.");
    } catch (err) {
      const message = err.response?.data?.detail || "Invalid OTP. Please try again.";
      setState({ status: "otp", message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!form.identifier.trim()) {
      toast.error("Enter your registered email first.");
      return;
    }

    setResending(true);
    try {
      const { data } = await authApi.resendVerification({ identifier: form.identifier });
      const message = data?.detail || "OTP sent. Please check your inbox.";
      setState({ status: "otp", message });
      toast.success(message);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not send OTP.");
    } finally {
      setResending(false);
    }
  };

  const isLoading = state.status === "loading";
  const isSuccess = state.status === "success";
  const isOtp = state.status === "otp";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.18),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)]">
      <div className="bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span>Jan Samadhan AI</span>
          <Link to="/" className="hover:underline">Home</Link>
        </div>
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-7xl items-center justify-center p-4">
        <div className="w-full max-w-md rounded border border-slate-200 bg-white/95 p-7 text-center shadow-xl shadow-slate-200/70">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded bg-cyan-50 text-cyan-700">
            {isLoading ? <Loader2 className="animate-spin" size={28} /> : isSuccess ? <CheckCircle2 size={30} /> : <MailWarning size={30} />}
          </div>
          <h1 className="text-xl font-extrabold text-slate-950">
            {isLoading ? "Verifying email" : isSuccess ? "Email verified" : "Verify email OTP"}
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">{state.message}</p>

          {isOtp && (
            <form onSubmit={handleOtpSubmit} className="mt-6 space-y-4 text-left">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Registered Email</label>
                <input
                  className="input"
                  type="email"
                  value={form.identifier}
                  onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                  placeholder="citizen@example.com"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">OTP</label>
                <input
                  className="input text-center font-mono text-lg tracking-[0.35em]"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.otp}
                  onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  placeholder="000000"
                  required
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary flex w-full items-center justify-center gap-2 py-2.5">
                <ShieldCheck size={17} />
                {submitting ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="btn-secondary flex w-full items-center justify-center gap-2 py-2.5"
              >
                <RefreshCw size={16} className={resending ? "animate-spin" : ""} />
                {resending ? "Sending OTP..." : "Resend OTP"}
              </button>
            </form>
          )}

          {isSuccess && (
            <button
              type="button"
              onClick={() => navigate("/login", { state: { from: location.state?.from } })}
              className="btn-primary mt-6 inline-flex items-center justify-center"
            >
              Go to sign in
            </button>
          )}

          {!isOtp && !isSuccess && !isLoading && (
            <Link to="/login" className="btn-primary mt-6 inline-flex items-center justify-center">
              Go to sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
