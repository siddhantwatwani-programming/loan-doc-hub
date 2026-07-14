import { useState } from "react";
import { Command, Sparkles, Wand2, Zap } from "lucide-react";
import { PhoneMock } from "./components/PhoneMock";
import { isSupabaseConfigured } from "./lib/supabase";

const FEATURES = [
  {
    icon: Wand2,
    title: "Auto-formatting",
    body: "Filler words vanish, punctuation appears, tone matches the app you're in.",
  },
  {
    icon: Zap,
    title: "Speak 3× faster",
    body: "Talk at 150 wpm instead of thumb-typing at 40. Flow keeps up in real time.",
  },
  {
    icon: Command,
    title: "Voice commands",
    body: "“New line”, “delete that”, “make it a list” — edit hands-free while you talk.",
  },
];

export default function App() {
  const [mocked, setMocked] = useState<boolean | null>(null);

  return (
    <div className="min-h-full bg-[radial-gradient(120%_120%_at_50%_-10%,#1a1436_0%,#06060a_55%)] text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:py-24">
        {/* copy */}
        <div className="order-2 lg:order-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-medium text-flow-glow">
            <Sparkles className="h-3.5 w-3.5" />
            Flow Keyboard for iOS
          </div>

          <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            The keyboard that
            <br />
            <span className="bg-gradient-to-r from-flow-glow to-flow bg-clip-text text-transparent">
              types what you say.
            </span>
          </h1>

          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/60">
            A drop-in replacement for your iPhone keyboard. Tap the purple key,
            speak your mind, and Flow turns it into clean, formatted text —
            anywhere you can type.
          </p>

          <div className="mt-9 space-y-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-3.5">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-flow/15 text-flow-glow">
                  <f.icon className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-white/90">
                    {f.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-white/50">
                    {f.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-9 text-[12px] leading-relaxed text-white/35">
            {isSupabaseConfigured
              ? "Live mode: audio is transcribed by Whisper via a Supabase edge function."
              : "Demo mode: add Supabase env vars to enable real Whisper transcription. Right now the purple key returns sample text so you can feel the flow."}
          </p>
        </div>

        {/* device */}
        <div className="order-1 flex justify-center lg:order-2">
          <PhoneMock onMockNotice={setMocked} />
        </div>
      </div>

      {mocked && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center">
          <div className="pointer-events-auto rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[12px] text-white/70 backdrop-blur">
            Sample text inserted — configure Supabase for real transcription.
          </div>
        </div>
      )}
    </div>
  );
}
