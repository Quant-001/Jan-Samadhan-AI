import { useState, useRef } from "react";
import { Mic, Square, Play, Pause, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AudioRecorder({ onAudioCapture }) {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const [durationInterval, setDurationInterval] = useState(null);

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true 
        } 
      });
      streamRef.current = stream;

      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        setHasRecording(true);
        setRecordDuration(0);
        if (durationInterval) clearInterval(durationInterval);
        if (onAudioCapture) {
          const file = new File([blob], "audio_complaint.webm", { type: "audio/webm" });
          onAudioCapture(file);
        }
        stopAudioStream();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start duration counter
      let seconds = 0;
      const interval = setInterval(() => {
        seconds += 1;
        setRecordDuration(seconds);
      }, 1000);
      setDurationInterval(interval);

      toast.success("Audio recording started");
    } catch (err) {
      toast.error(
        err.message === "Permission denied"
          ? "Microphone permission denied"
          : "Could not access microphone: " + err.message
      );
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (durationInterval) clearInterval(durationInterval);
      toast.success("Audio recording stopped");
    }
  };

  const stopAudioStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setHasRecording(false);
    setRecordDuration(0);
    chunksRef.current = [];
    if (isPlaying) setIsPlaying(false);
    if (durationInterval) clearInterval(durationInterval);
    onAudioCapture?.(null);
    toast.success("Recording cleared");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-slate-950">
            <Mic size={17} className="text-cyan-700" /> Audio Complaint
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            Record an audio message describing your grievance
          </p>
        </div>
        {hasRecording && (
          <button
            type="button"
            onClick={resetRecording}
            className="inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            <Trash2 size={16} /> Clear
          </button>
        )}
      </div>

      {!hasRecording ? (
        <div className="space-y-3">
          <div className="rounded border border-slate-300 bg-gradient-to-r from-cyan-50 to-blue-50 p-6 text-center">
            <div className="flex justify-center mb-3">
              {isRecording ? (
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-600 animate-pulse">
                  <Mic size={24} className="text-white" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-200">
                  <Mic size={24} className="text-slate-600" />
                </div>
              )}
            </div>
            {isRecording && (
              <div>
                <p className="text-lg font-bold text-red-600">{formatTime(recordDuration)}</p>
                <p className="text-xs text-red-600 font-semibold">Recording...</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={isRecording ? stopAudioRecording : startAudioRecording}
            className={`w-full inline-flex items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-bold ${
              isRecording
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isRecording ? (
              <>
                <Square size={16} /> Stop Recording
              </>
            ) : (
              <>
                <Mic size={16} /> Start Recording
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded border border-slate-300 bg-gradient-to-r from-cyan-50 to-blue-50 p-4">
            <audio
              src={URL.createObjectURL(recordedBlob)}
              controls
              className="w-full"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          </div>

          <p className="text-xs text-center text-green-700 font-semibold">
            ✓ Audio captured - {formatTime(recordDuration)} ({(recordedBlob.size / 1024).toFixed(1)} KB)
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetRecording}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-semibold border border-slate-300 hover:bg-slate-100"
            >
              <Trash2 size={16} /> Retake
            </button>
            <button
              type="button"
              onClick={startAudioRecording}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-semibold bg-green-50 text-green-700 hover:bg-green-100"
            >
              <Mic size={16} /> Record Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
