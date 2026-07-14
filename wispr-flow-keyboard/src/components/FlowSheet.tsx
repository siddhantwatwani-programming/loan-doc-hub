import { Check, X } from "lucide-react";
import type { DictationStatus } from "../hooks/useDictation";

interface FlowSheetProps {
  status: DictationStatus;
  levels: number[];
  elapsed: number;
  onStop: () => void;
  onCancel: () => void;
}

function fmt(seconds: number) {
  const s = Math.floor(seconds);
  return `0:${s.toString().padStart(2, "0")}`;
}

/**
 * The listening panel that slides up over the keyboard while Flow is active —
 * live waveform, elapsed timer, and cancel / commit controls.
 */
export function FlowSheet({
  status,
  levels,
  elapsed,
  onStop,
  onCancel,
}: FlowSheetProps) {
  const transcribing = status === "transcribing";

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 animate-sheet-up overflow-hidden rounded-t-2xl bg-[#101018] px-5 pb-7 pt-4 shadow-[0_-8px_30px_rgba(0,0,0,0.45)]">
      <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-white/20" />

      <div className="flex items-center gap-2 text-[13px] font-medium text-flow-glow">
        <span
          className={[
            "h-2 w-2 rounded-full",
            transcribing ? "bg-flow-glow" : "animate-flow-pulse bg-red-500",
          ].join(" ")}
        />
        {transcribing ? "Cleaning up your words…" : "Listening"}
        <span className="ml-auto font-mono text-white/50">{fmt(elapsed)}</span>
      </div>

      {/* waveform */}
      <div className="mt-4 flex h-16 items-center justify-center gap-[3px]">
        {levels.map((v, i) => (
          <span
            key={i}
            className="w-[4px] rounded-full bg-gradient-to-t from-flow to-flow-glow transition-[height] duration-75"
            style={{
              height: `${Math.max(6, (transcribing ? 0.18 : v) * 100)}%`,
              opacity: transcribing ? 0.4 : 0.65 + v * 0.35,
            }}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          disabled={transcribing}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-white/70 transition active:scale-95 disabled:opacity-40"
          aria-label="Cancel"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="max-w-[180px] text-center text-[12px] leading-tight text-white/40">
          {transcribing
            ? "Formatting punctuation and tone automatically"
            : "Speak naturally — say “new line” or “comma” and Flow handles the rest"}
        </p>

        <button
          type="button"
          onClick={onStop}
          disabled={transcribing}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-flow-glow to-flow-dark text-white shadow-lg shadow-flow/40 transition active:scale-95 disabled:opacity-40"
          aria-label="Finish and insert"
        >
          <Check className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
