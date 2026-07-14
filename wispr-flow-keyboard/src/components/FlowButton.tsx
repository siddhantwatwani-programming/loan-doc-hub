import { Loader2, Mic, Square } from "lucide-react";
import type { DictationStatus } from "../hooks/useDictation";

interface FlowButtonProps {
  status: DictationStatus;
  onClick: () => void;
}

/** The purple dictation key that lives in the keyboard's function row. */
export function FlowButton({ status, onClick }: FlowButtonProps) {
  const recording = status === "recording";
  const busy = status === "transcribing" || status === "requesting";

  return (
    <button
      type="button"
      aria-label={recording ? "Stop dictation" : "Start Flow dictation"}
      onPointerDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      style={{ flex: 1.3 }}
      className={[
        "relative flex h-[42px] items-center justify-center rounded-[6px]",
        "shadow-[0_1px_0_rgba(0,0,0,0.28)] transition-transform active:scale-95",
        recording
          ? "bg-red-500"
          : "bg-gradient-to-b from-flow-glow to-flow-dark",
      ].join(" ")}
    >
      {recording && (
        <span className="absolute inset-0 animate-flow-pulse rounded-[6px] bg-red-500/40" />
      )}
      {busy ? (
        <Loader2 className="h-5 w-5 animate-spin text-white" strokeWidth={2.25} />
      ) : recording ? (
        <Square className="h-4 w-4 fill-white text-white" />
      ) : (
        <Mic className="relative h-5 w-5 text-white" strokeWidth={2} />
      )}
    </button>
  );
}
