import { supabase, isSupabaseConfigured } from "./supabase";

export interface TranscribeOptions {
  /** Text already in the field, so the model can format a continuation. */
  context?: string;
  /** Tone/format hint, mirroring Wispr Flow's "auto-formatting". */
  style?: "auto" | "message" | "email" | "notes";
}

export interface TranscribeResult {
  text: string;
  /** true when the result came from the local mock, not the real backend. */
  mocked: boolean;
}

const MOCK_LINES = [
  "Hey — just confirming we're still on for tomorrow at 2. I'll send the deck over beforehand.",
  "Here are the three things I want to cover in standup: the migration status, the flaky test, and the launch date.",
  "Thanks so much for the quick turnaround on this. It looks great and I don't have any changes.",
  "Can you double-check the numbers on the second slide? Something looks off in the Q3 column.",
  "Let's push the meeting to Thursday. I want to give the team enough time to review the proposal first.",
];

let mockIndex = 0;

/**
 * Send a recorded audio blob to the Whisper edge function and get back
 * cleaned, auto-formatted text. Falls back to a rotating mock when Supabase
 * isn't configured, so the UI is always demoable.
 */
export async function transcribe(
  audio: Blob,
  options: TranscribeOptions = {},
): Promise<TranscribeResult> {
  if (!isSupabaseConfigured || !supabase) {
    // Simulate realistic latency for the demo.
    await new Promise((r) => setTimeout(r, 900));
    const text = MOCK_LINES[mockIndex % MOCK_LINES.length];
    mockIndex += 1;
    return { text, mocked: true };
  }

  const form = new FormData();
  form.append("file", audio, "speech.webm");
  form.append("style", options.style ?? "auto");
  if (options.context) form.append("context", options.context);

  const { data, error } = await supabase.functions.invoke("transcribe", {
    body: form,
  });

  if (error) throw new Error(error.message);
  if (!data?.text) throw new Error("No transcription returned");

  return { text: String(data.text).trim(), mocked: false };
}
