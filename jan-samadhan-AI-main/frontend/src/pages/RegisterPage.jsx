import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { authApi } from "../api";
import toast from "react-hot-toast";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "", email: "", phone: "", first_name: "", last_name: "", password: "", password2: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      return toast.error("Passwords do not match");
    }
    setLoading(true);
    try {
      const { data } = await authApi.register(form);
      toast.success(data?.detail || "Account created. Check your email for the OTP.");
      navigate("/verify-email", {
        state: {
          from,
          verificationEmail: form.email,
          verificationMessage: data?.email_sent
            ? "OTP sent. Please check your inbox and enter the 6 digit code."
            : "Account created. In local development, check the backend console for the OTP.",
        },
      });
    } catch (err) {
      const errors = err.response?.data;
      const msg = errors ? Object.values(errors).flat().join(" ") : "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type = "text", placeholder = "") => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        className="input"
        type={type}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        placeholder={placeholder}
        required
      />
    </div>
  );

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
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded bg-cyan-400 text-lg font-black text-slate-950">JS</div>
            <h1 className="text-xl font-extrabold text-slate-950">Create citizen account</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Register to add and monitor grievances</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {field("first_name", "First Name", "text", "Rahul")}
            {field("last_name", "Last Name", "text", "Kumar")}
          </div>
          {field("username", "Username", "text", "rahul_kumar")}
          {field("email", "Email", "email", "rahul@example.com")}
          {field("phone", "Phone", "tel", "+91 9876543210")}
          {field("password", "Password", "password", "Min 8 characters")}
          {field("password2", "Confirm Password", "password", "Repeat password")}
          <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 py-2.5">
            <UserPlus size={18} />
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            Already registered?{" "}
            <Link to="/login" state={{ from }} className="font-medium text-cyan-700 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
