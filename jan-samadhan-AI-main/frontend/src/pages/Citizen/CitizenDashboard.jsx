import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complaintApi } from "../../api";
import { PriorityBadge, StatusBadge, CategoryIcon, StatCard, LoadingSpinner, EmptyState } from "../../components/Shared";
import VideoRecorder from "../../components/Shared/VideoRecorder";
import AudioRecorder from "../../components/Shared/AudioRecorder";
import { formatDate } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import toast from "react-hot-toast";
import { CheckCircle2, ExternalLink, Loader2, LocateFixed, MailCheck, MapPin, Mic, MicOff, Plus, RefreshCw, ShieldCheck, Volume2, X, Zap } from "lucide-react";

const speechLanguageMap = {
  en: "en-IN",
  hi: "hi-IN",
  as: "as-IN",
  bn: "bn-IN",
  brx: "hi-IN",
  doi: "hi-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ks: "ur-IN",
  kok: "hi-IN",
  mai: "hi-IN",
  ml: "ml-IN",
  mni: "hi-IN",
  mr: "mr-IN",
  ne: "ne-NP",
  or: "or-IN",
  pa: "pa-IN",
  sa: "hi-IN",
  sat: "hi-IN",
  sd: "hi-IN",
  ta: "ta-IN",
  te: "te-IN",
  ur: "ur-IN",
};

function suggestTitleFromSpeech(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length > 64 ? `${clean.slice(0, 61).trim()}...` : clean;
}

function getApiErrorMessage(err, fallback) {
  const data = err.response?.data;
  if (!data) return err.message || fallback;
  if (typeof data === "string") {
    if (data.includes("<html") || data.includes("<!doctype")) {
      return "Server error while submitting complaint. Please redeploy the backend and try again.";
    }
    return data;
  }
  if (data.detail) return data.detail;
  if (data.error) return data.error;

  const fieldErrors = Object.entries(data)
    .flatMap(([field, value]) => {
      const messages = Array.isArray(value) ? value : [value];
      return messages.map((message) => `${field}: ${message}`);
    })
    .join(" ");
  return fieldErrors || fallback;
}

export default function CitizenDashboard() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceInterim, setVoiceInterim] = useState("");
  const [complaintOtp, setComplaintOtp] = useState("");
  const [complaintOtpSent, setComplaintOtpSent] = useState(false);
  const [otpFallback, setOtpFallback] = useState("");
  const [lastSubmittedComplaint, setLastSubmittedComplaint] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const emptyForm = {
    complainant_name: user?.first_name || "",
    complainant_email: user?.email || "",
    title: "",
    description: "",
    location: "",
    sector: "",
    pin_code: "",
    latitude: "",
    longitude: "",
    attachment: null,
    video: null,
    audio: null,
  };
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["my-complaints"],
    queryFn: () => complaintApi.list().then((r) => r.data),
  });

  const complaints = data?.results || data || [];

  const openComplaintForm = useCallback(() => {
    setComplaintOtp("");
    setComplaintOtpSent(false);
    setOtpFallback("");
    setShowForm(true);
  }, []);

  const closeComplaintForm = useCallback(() => {
    setShowForm(false);
    setComplaintOtp("");
    setComplaintOtpSent(false);
    setOtpFallback("");
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      openComplaintForm();
      setSearchParams({}, { replace: true });
    }
  }, [openComplaintForm, searchParams, setSearchParams]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const createMutation = useMutation({
    mutationFn: (fd) => complaintApi.create(fd),
    onSuccess: (data) => {
      qc.invalidateQueries(["my-complaints"]);
      const ticketId = data?.data?.ticket_id || data?.ticket_id;
      setLastSubmittedComplaint(data?.data || null);
      const message = ticketId 
        ? `Complaint submitted! Tracking ID: ${ticketId}` 
        : "Complaint submitted! AI is classifying it now.";
      toast.success(t(message), { duration: 10000 });
      closeComplaintForm();
      setForm(emptyForm);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t("Submission failed"))),
  });

  const requestOtpMutation = useMutation({
    mutationFn: () => complaintApi.requestOtp(),
    onSuccess: (res) => {
      setComplaintOtpSent(true);
      setOtpFallback(res.data?.otp_fallback || "");
      const message = t(res.data?.detail || "Complaint OTP sent to your registered email.");
      if (res.data?.email_sent === false) toast.error(message);
      else toast.success(message);
      if (res.data?.otp_fallback) toast.success(`Use OTP ${res.data.otp_fallback}`, { duration: 10000 });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t("Could not send complaint OTP"))),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("complainant_name", form.complainant_name);
    fd.append("complainant_email", form.complainant_email);
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("location", form.location);
    fd.append("sector", form.sector);
    fd.append("pin_code", form.pin_code);
    if (form.latitude) fd.append("latitude", form.latitude);
    if (form.longitude) fd.append("longitude", form.longitude);
    fd.append("complaint_otp", complaintOtp);
    if (form.attachment) fd.append("attachment", form.attachment);
    if (form.video) fd.append("attachment", form.video);
    if (form.audio) fd.append("attachment", form.audio);
    createMutation.mutate(fd);
  };

  const getRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = speechLanguageMap[language] || "en-IN";
    return recognition;
  };

  const startVoiceAssistant = () => {
    const recognition = getRecognition();
    if (!recognition) {
      toast.error(t("Voice typing is not supported in this browser. Try Chrome or Edge."));
      return;
    }

    recognitionRef.current?.stop();
    setVoiceInterim("");
    setVoiceTranscript("");
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      toast.success(t("Listening now. Speak your complaint clearly."));
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += `${text} `;
        else interimText += text;
      }

      if (finalText.trim()) {
        const spokenText = finalText.replace(/\s+/g, " ").trim();
        setVoiceTranscript((current) => [current, spokenText].filter(Boolean).join(" "));
        setForm((current) => {
          const description = [current.description, spokenText].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
          return {
            ...current,
            description,
            title: current.title || suggestTitleFromSpeech(spokenText),
          };
        });
      }
      setVoiceInterim(interimText);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      const errorMessages = {
        "not-allowed": "Microphone permission was blocked. Allow microphone access from the browser address bar.",
        "service-not-allowed": "Voice typing service is blocked in this browser. Try Chrome or Edge for speech-to-text.",
        "no-speech": "No speech was detected. Please speak clearly after pressing Speak.",
        "audio-capture": "No microphone was found. Check your microphone and browser permission.",
        network: "Voice typing needs the browser speech service. Check internet access or try Chrome/Edge.",
      };
      const message = t(errorMessages[event.error] || "Voice assistant stopped. Please try again.");
      toast.error(message);
    };

    recognition.onend = () => {
      setIsListening(false);
      setVoiceInterim("");
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      toast.error(t("Voice assistant is already starting. Please wait a moment and try again."));
    }
  };

  const stopVoiceAssistant = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const speakComplaintGuide = () => {
    if (!window.speechSynthesis) {
      toast.error(t("Voice guide is not supported in this browser."));
      return;
    }
    window.speechSynthesis.cancel();
    const guide = new SpeechSynthesisUtterance(
      t("Tell your issue, location, nearby landmark, and how long the problem has happened.")
    );
    guide.lang = speechLanguageMap[language] || "en-IN";
    window.speechSynthesis.speak(guide);
  };

  const googleMapsUrl = form.latitude && form.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${form.latitude},${form.longitude}`
    : "";
  const googleMapsEmbedUrl = form.latitude && form.longitude
    ? `https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=16&output=embed`
    : "";

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t("GPS location is not supported in this browser."));
      return;
    }

    setIsLocating(true);
    const applyPosition = (position) => {
      const latitude = position.coords.latitude.toFixed(6);
      const longitude = position.coords.longitude.toFixed(6);
      setForm((current) => ({
        ...current,
        latitude,
        longitude,
        location: current.location || `GPS location: ${latitude}, ${longitude}`,
      }));
      setIsLocating(false);
      toast.success(t("GPS location added to the complaint."));
    };

    const handleLocationError = (error) => {
      setIsLocating(false);
      const messages = {
        1: "Location permission was blocked. Click the location icon in the address bar and allow location access.",
        2: "Current location is unavailable. Check device location services or enter latitude and longitude manually.",
        3: "GPS took too long. Move near a window, enable device location, or enter coordinates manually.",
      };
      toast.error(t(messages[error.code] || "Could not access GPS location. Please allow location permission."));
    };

    navigator.geolocation.getCurrentPosition(
      applyPosition,
      handleLocationError,
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 }
    );
  };

  const watchCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t("GPS location is not supported in this browser."));
      return;
    }

    setIsLocating(true);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        setForm((current) => ({
          ...current,
          latitude,
          longitude,
          location: current.location || `GPS location: ${latitude}, ${longitude}`,
        }));
        setIsLocating(false);
        navigator.geolocation.clearWatch(watchId);
        toast.success(t("GPS location added to the complaint."));
      },
      (error) => {
        setIsLocating(false);
        navigator.geolocation.clearWatch(watchId);
        const message = error.code === 1
          ? "Location permission was blocked. Allow location from the browser address bar."
          : "Could not capture live GPS. Enter latitude and longitude manually.";
        toast.error(t(message));
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  };

  const stats = [
    { label: t("Total Complaints"), value: complaints.length, icon: "📋", color: "blue" },
    { label: t("Pending"), value: complaints.filter((c) => c.status === "PENDING").length, icon: "⏳", color: "yellow" },
    { label: t("Resolved"), value: complaints.filter((c) => c.status === "RESOLVED").length, icon: "✅", color: "green" },
    { label: t("Escalated"), value: complaints.filter((c) => c.status === "ESCALATED").length, icon: "🔴", color: "red" },
  ];

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 rounded border border-slate-800 bg-slate-950 p-5 text-white shadow-sm md:flex-row md:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-cyan-300">{t("Citizen Dashboard")}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">{t("My Complaints")}</h1>
          <p className="mt-1 text-sm text-slate-300">{t("Welcome,")} {user?.first_name || user?.username}. {t("Submit, track, and rate grievances from one place.")}</p>
          {user?.is_verified && (
            <p className="mt-3 inline-flex items-center gap-2 rounded border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-200">
              <ShieldCheck size={14} /> {t("Email verified")}
            </p>
          )}
        </div>
        <button onClick={openComplaintForm} className="inline-flex items-center justify-center gap-2 rounded bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-300">
          <Plus size={16} /> {t("New Complaint")}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {user && !user.is_verified && (
        <div className="mb-6 rounded border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          {t("Please verify your email before submitting a complaint.")}
        </div>
      )}

      {lastSubmittedComplaint?.ticket_id && (
        <div className="mb-6 rounded border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black">{t("Complaint submitted successfully")}</p>
              <p className="mt-1 text-sm font-semibold">
                {t("Tracking ID")}: <span className="font-mono">{lastSubmittedComplaint.ticket_id}</span>
              </p>
            </div>
            <a
              href={`/track?ticket=${encodeURIComponent(lastSubmittedComplaint.ticket_id)}`}
              className="inline-flex items-center justify-center gap-2 rounded bg-emerald-700 px-4 py-2 text-sm font-black text-white hover:bg-emerald-800"
            >
              <ExternalLink size={15} /> {t("Track Complaint")}
            </a>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card mb-6 overflow-hidden">
          <div className="flex flex-col gap-3 bg-slate-950 px-6 py-4 text-white md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black">{t("Submit New Complaint")}</h2>
              <p className="text-sm text-slate-300">{t("AI will classify and route it after submission.")}</p>
            </div>
            <div className={`inline-flex w-fit items-center gap-2 rounded border px-3 py-2 text-xs font-black uppercase tracking-wide ${
              user?.is_verified
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                : "border-amber-300/40 bg-amber-300/10 text-amber-100"
            }`}>
              <ShieldCheck size={15} />
              {user?.is_verified ? (
                <span>{t("✓ Email authenticated")}</span>
              ) : (
                <span>{t("⚠ Email verification required")}</span>
              )}
            </div>
          </div>
          <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={closeComplaintForm} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
          </div>
          
          {!user?.is_verified && (
            <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <Zap className="text-amber-600 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-amber-950">{t("Email Verification Required")}</p>
                  <p className="text-sm text-amber-800 mt-1">
                    {t("Your email must be verified to submit complaints. You will receive an OTP for verification.")}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-black text-slate-950">
                    <Mic size={17} className="text-cyan-700" /> {t("Speak to write complaint")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">
                    {t("Use the voice assistant to convert speech into complaint text, then upload your proof and submit.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={isListening ? stopVoiceAssistant : startVoiceAssistant}
                  className={`inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-black ${
                    isListening
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                  }`}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  {isListening ? t("Stop listening") : t("Start speaking")}
                </button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("Citizen Name")}</label>
                <input className="input" value={form.complainant_name}
                  onChange={(e) => setForm({ ...form, complainant_name: e.target.value })}
                  placeholder={t("Full name of complainant")} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("Email")}</label>
                <input className="input" type="email" value={form.complainant_email}
                  readOnly
                  placeholder={t("name@example.com")} required />
                <p className="mt-1 text-xs font-semibold text-slate-500">{t("OTP and complaint updates go to this registered email.")}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("Title")}</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t("Brief title of your complaint")} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("Description")} <span className="text-gray-400 font-normal">({t("Hindi or English both accepted")})</span>
              </label>
              <div className="mb-2 rounded border border-cyan-100 bg-cyan-50 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-900">{t("Voice Assistant")}</p>
                    <p className="text-xs font-semibold text-slate-600">{t("Speak your complaint and the form will fill the description.")}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={isListening ? stopVoiceAssistant : startVoiceAssistant}
                      className={`inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-black ${
                        isListening
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-slate-950 text-cyan-200 hover:bg-slate-800"
                      }`}
                    >
                      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                      {isListening ? t("Stop") : t("Speak")}
                    </button>
                    <button
                      type="button"
                      onClick={speakComplaintGuide}
                      className="inline-flex items-center gap-2 rounded border border-cyan-200 bg-white px-3 py-2 text-sm font-black text-slate-800 hover:border-cyan-500"
                    >
                      <Volume2 size={16} /> {t("Guide")}
                    </button>
                  </div>
                </div>
                {(isListening || voiceTranscript || voiceInterim) && (
                  <div className="mt-3 rounded border border-cyan-200 bg-white p-3 text-sm text-slate-700">
                    <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-cyan-700">
                      {isListening ? <Mic size={14} /> : <CheckCircle2 size={14} />}
                      {isListening ? t("Listening") : t("Captured voice text")}
                    </div>
                    <p>{[voiceTranscript, voiceInterim].filter(Boolean).join(" ") || t("Start speaking after allowing microphone access.")}</p>
                  </div>
                )}
              </div>
              <textarea className="input min-h-24 resize-y" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t("Describe your complaint in detail. AI will auto-classify it.")} required />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("Location / Address")}</label>
              <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  <input className="input pl-9" value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder={t("Ward no., area, city")} />
                </div>
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={isLocating}
                  className="inline-flex items-center justify-center gap-2 rounded bg-slate-950 px-4 py-2 text-sm font-black text-cyan-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLocating ? <Loader2 className="animate-spin" size={16} /> : <LocateFixed size={16} />}
                  {isLocating ? t("Locating") : t("Use GPS")}
                </button>
              </div>
              <button
                type="button"
                onClick={watchCurrentLocation}
                disabled={isLocating}
                className="mt-2 inline-flex items-center gap-2 rounded border border-cyan-200 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LocateFixed size={14} /> {t("Try live GPS")}
              </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("Sector / Ward")}</label>
                <input className="input" value={form.sector}
                  onChange={(e) => setForm({ ...form, sector: e.target.value })}
                  placeholder={t("Sector 4 or Ward 12")} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("PIN Code")}</label>
                <input className="input" inputMode="numeric" maxLength={6} value={form.pin_code}
                  onChange={(e) => setForm({ ...form, pin_code: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  placeholder="452001" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("Latitude")}</label>
                <input className="input" inputMode="decimal" value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  placeholder="22.719568" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("Longitude")}</label>
                <input className="input" inputMode="decimal" value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  placeholder="75.857727" />
              </div>
            </div>

            {googleMapsEmbedUrl && (
              <div className="overflow-hidden rounded border border-slate-200 bg-slate-50">
                <iframe
                  title="Complaint GPS location on Google Maps"
                  src={googleMapsEmbedUrl}
                  className="h-56 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="flex flex-col gap-2 p-3 text-sm font-semibold text-slate-700 sm:flex-row sm:items-center sm:justify-between">
                  <span>{t("GPS coordinates will be saved with this complaint.")}</span>
                  <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-700 hover:underline">
                    <ExternalLink size={15} /> {t("Open in Google Maps")}
                  </a>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <VideoRecorder onVideoCapture={(file) => setForm({ ...form, video: file })} />
              <AudioRecorder onAudioCapture={(file) => setForm({ ...form, audio: file })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("Complaint File / Picture / Audio / Video")}</label>
              <input type="file" accept="image/*,video/*,audio/*,application/pdf" className="input text-sm"
                onChange={(e) => setForm({ ...form, attachment: e.target.files[0] })} />
            </div>

            <div className="rounded border border-cyan-100 bg-cyan-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-black text-slate-950">
                    <MailCheck size={17} className="text-cyan-700" /> {t("Email OTP for complaint submission")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">
                    {complaintOtpSent
                      ? t("Enter the 6 digit OTP sent to your registered email.")
                      : t("Send an OTP to authenticate this complaint before submitting.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => requestOtpMutation.mutate()}
                  disabled={requestOtpMutation.isPending || !user?.is_verified}
                  className="inline-flex items-center justify-center gap-2 rounded bg-slate-950 px-4 py-2 text-sm font-black text-cyan-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {requestOtpMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                  {complaintOtpSent ? t("Resend OTP") : t("Send OTP")}
                </button>
              </div>
              <div className="mt-3 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("Complaint OTP")}</label>
                {otpFallback && (
                  <div className="mb-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs font-semibold text-amber-900">
                    {t("Email delivery is not configured. Use OTP")} <span className="font-mono text-sm font-black">{otpFallback}</span>
                  </div>
                )}
                <input
                  className="input text-center font-mono text-lg tracking-[0.35em]"
                  inputMode="numeric"
                  maxLength={6}
                  value={complaintOtp}
                  onChange={(e) => setComplaintOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending || !user?.is_verified || complaintOtp.length !== 6} className="btn-primary">
                {createMutation.isPending ? t("Submitting...") : t("Submit Complaint")}
              </button>
              <button type="button" onClick={closeComplaintForm} className="btn-secondary">{t("Cancel")}</button>
            </div>
          </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : complaints.length === 0 ? (
        <EmptyState icon="📭" title={t("No complaints yet")}
          description={t("Submit your first complaint and we'll route it to the right department.")}
          action={<button onClick={openComplaintForm} className="btn-primary">{t("Submit Complaint")}</button>} />
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
              className="card cursor-pointer p-4 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-2xl"><CategoryIcon category={c.category} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 truncate">{c.title}</p>
                      <span className="text-xs text-gray-400 font-mono">#{c.ticket_id}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{c.description}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                      {c.department_name && <span className="text-xs text-gray-500">🏛️ {t(c.department_name)}</span>}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(c.created_at)}</p>
              </div>
              {selected?.id === c.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-400">{t("AI Category")}:</span> <span className="font-medium">{t(c.ai_category)} ({Math.round(c.ai_confidence * 100)}%)</span></div>
                    {c.complainant_name && <div><span className="text-gray-400">{t("Citizen")}:</span> <span className="font-medium">{c.complainant_name}</span></div>}
                    {c.complainant_email && <div><span className="text-gray-400">{t("Email")}:</span> <span className="font-medium">{c.complainant_email}</span></div>}
                    <div><span className="text-gray-400">{t("SLA Deadline")}:</span> <span className="font-medium">{formatDate(c.sla_deadline)}</span></div>
                    {c.officer_name && <div><span className="text-gray-400">{t("Officer")}:</span> <span className="font-medium">{c.officer_name}</span></div>}
                    {(c.sector || c.pin_code) && <div><span className="text-gray-400">{t("Area")}:</span> <span className="font-medium">{[c.sector, c.pin_code].filter(Boolean).join(" / ")}</span></div>}
                    {(c.latitude && c.longitude) && <div><span className="text-gray-400">{t("GPS")}:</span> <a className="font-medium text-cyan-700 hover:underline" href={`https://www.google.com/maps/search/?api=1&query=${c.latitude},${c.longitude}`} target="_blank" rel="noreferrer">{c.latitude}, {c.longitude}</a></div>}
                  </div>
                  {c.routing_note && (
                    <div className="mt-3 rounded border border-teal-100 bg-teal-50 p-3 text-sm text-teal-900">
                      {c.routing_note}
                    </div>
                  )}
                  {c.officer_remarks && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                      <span className="font-medium text-blue-700">{t("Officer remarks")}:</span> {c.officer_remarks}
                    </div>
                  )}
                  {c.status === "RESOLVED" && !c.citizen_rating && (
                    <FeedbackForm complaintId={c.id} onDone={() => qc.invalidateQueries(["my-complaints"])} t={t} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackForm({ complaintId, onDone, t }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const mutation = useMutation({
    mutationFn: () => complaintApi.feedback(complaintId, { citizen_rating: rating, citizen_feedback: feedback }),
    onSuccess: () => { toast.success(t("Thank you for your feedback!")); onDone(); },
  });
  return (
    <div className="mt-3 p-4 bg-green-50 rounded-lg">
      <p className="text-sm font-medium text-green-800 mb-2">{t("Rate your experience:")}</p>
      <div className="flex gap-2 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)}
            className={`text-2xl ${n <= rating ? "text-yellow-400" : "text-gray-300"}`}>★</button>
        ))}
      </div>
      <textarea className="input text-sm mb-2" value={feedback} onChange={(e) => setFeedback(e.target.value)}
        placeholder={t("Any comments?")} rows={2} />
      <button onClick={() => mutation.mutate()} disabled={!rating || mutation.isPending} className="btn-primary text-sm py-1.5">
        {t("Submit Feedback")}
      </button>
    </div>
  );
}
