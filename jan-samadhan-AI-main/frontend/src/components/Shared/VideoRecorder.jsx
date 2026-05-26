import { useState, useRef } from "react";
import { Video, Square, Play, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function VideoRecorder({ onVideoCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const [isRecording, setIsRecording] = useState(false);
  const [hasPreview, setHasPreview] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);

  const startVideoCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8,opus",
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setRecordedBlob(blob);
        setHasPreview(true);
        if (onVideoCapture) {
          const file = new File([blob], "video_complaint.webm", { type: "video/webm" });
          onVideoCapture(file);
        }
        stopVideoStream();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Video recording started");
    } catch (err) {
      toast.error(err.message === "Permission denied" 
        ? "Camera/Microphone permission denied" 
        : "Could not access camera: " + err.message);
    }
  };

  const stopVideoCapture = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Video recording stopped");
    }
  };

  const stopVideoStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setHasPreview(false);
    chunksRef.current = [];
    if (videoRef.current) videoRef.current.srcObject = null;
    onVideoCapture?.(null);
    toast.success("Recording cleared");
  };

  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-slate-950">
            <Video size={17} className="text-cyan-700" /> Video Complaint
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            Record a video of the grievance for visual evidence
          </p>
        </div>
        {hasPreview && (
          <button
            type="button"
            onClick={resetRecording}
            className="inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            <Trash2 size={16} /> Clear
          </button>
        )}
      </div>

      {!hasPreview ? (
        <div className="space-y-3">
          <div className="rounded border border-slate-300 bg-black overflow-hidden">
            <video
              ref={videoRef}
              className="w-full bg-slate-950"
              autoPlay
              playsInline
              muted
            />
          </div>
          <button
            type="button"
            onClick={isRecording ? stopVideoCapture : startVideoCapture}
            className={`w-full inline-flex items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-bold ${
              isRecording
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isRecording ? (
              <>
                <Square size={16} /> Stop Recording
              </>
            ) : (
              <>
                <Video size={16} /> Start Recording
              </>
            )}
          </button>
          {isRecording && (
            <p className="text-xs text-center text-red-600 font-semibold animate-pulse">
              ● Recording...
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded border border-slate-300 bg-black overflow-hidden">
            <video
              src={URL.createObjectURL(recordedBlob)}
              className="w-full bg-slate-950"
              controls
              autoPlay
              playsInline
            />
          </div>
          <p className="text-xs text-center text-green-700 font-semibold">
            ✓ Video captured ({(recordedBlob.size / 1024 / 1024).toFixed(1)} MB)
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
              onClick={startVideoCapture}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              <Video size={16} /> Record Again
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
