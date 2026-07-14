import { useCallback, useEffect, useRef, useState } from "react";
import { transcribe, type TranscribeOptions } from "../lib/transcribe";

export type DictationStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "transcribing"
  | "error";

interface UseDictationArgs {
  onResult: (text: string, mocked: boolean) => void;
  getContext?: () => string;
}

const LEVEL_BARS = 28;

export function useDictation({ onResult, getContext }: UseDictationArgs) {
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>(() =>
    new Array(LEVEL_BARS).fill(0.06),
  );
  const [elapsed, setElapsed] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const cancelledRef = useRef<boolean>(false);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      void audioCtxRef.current.close();
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const runMeter = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buf = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(buf);
      // Sample the lower-mid range where speech energy lives.
      const next: number[] = [];
      const span = Math.floor(buf.length * 0.6);
      for (let i = 0; i < LEVEL_BARS; i++) {
        const idx = Math.floor((i / LEVEL_BARS) * span);
        const v = buf[idx] / 255;
        next.push(Math.max(0.06, Math.min(1, v * 1.4)));
      }
      setLevels(next);
      setElapsed((performance.now() - startedAtRef.current) / 1000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async () => {
    if (status === "recording" || status === "requesting") return;
    setError(null);
    cancelledRef.current = false;
    setStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        cleanup();
        setLevels(new Array(LEVEL_BARS).fill(0.06));
        if (cancelledRef.current) {
          setStatus("idle");
          setElapsed(0);
          return;
        }
        const blob = new Blob(chunksRef.current, { type: mime });
        setStatus("transcribing");
        try {
          const opts: TranscribeOptions = { context: getContext?.() };
          const { text, mocked } = await transcribe(blob, opts);
          onResult(text, mocked);
          setStatus("idle");
          setElapsed(0);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Transcription failed");
          setStatus("error");
        }
      };

      recorderRef.current = recorder;
      startedAtRef.current = performance.now();
      recorder.start();
      setStatus("recording");
      runMeter();
    } catch (err) {
      cleanup();
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access denied"
          : err instanceof Error
            ? err.message
            : "Could not start recording";
      setError(message);
      setStatus("error");
    }
  }, [status, cleanup, runMeter, getContext, onResult]);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    } else {
      cleanup();
      setStatus("idle");
      setElapsed(0);
      setLevels(new Array(LEVEL_BARS).fill(0.06));
    }
  }, [cleanup]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setElapsed(0);
  }, []);

  return { status, error, levels, elapsed, start, stop, cancel, reset };
}
