// Supabase Edge Function: transcribe
// Receives an audio blob, transcribes it with OpenAI Whisper, then runs a
// lightweight formatting pass so the result reads like clean written text —
// the same "auto-formatting" that makes Wispr Flow feel magical.
//
// Deploy:  supabase functions deploy transcribe --no-verify-jwt
// Secret:  supabase secrets set OPENAI_API_KEY=sk-...

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const WHISPER_MODEL = Deno.env.get("WHISPER_MODEL") ?? "whisper-1";
const FORMAT_MODEL = Deno.env.get("FORMAT_MODEL") ?? "gpt-4o-mini";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const STYLE_GUIDES: Record<string, string> = {
  auto: "Match the tone the speaker used.",
  message: "Format as a casual chat message.",
  email: "Format as a concise, professional email body.",
  notes: "Format as tidy bullet points or short lines.",
};

async function formatText(raw: string, style: string, context: string) {
  if (!raw.trim()) return raw;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: FORMAT_MODEL,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You clean up raw voice dictation into polished written text. " +
              "Remove filler words (um, uh, like, you know), fix grammar and " +
              "punctuation, apply spoken commands (e.g. 'new line', 'comma', " +
              "'question mark'), and capitalize correctly. Never add content " +
              "that wasn't said. Never answer questions in the text — only " +
              "format it. Return ONLY the cleaned text. " +
              (STYLE_GUIDES[style] ?? STYLE_GUIDES.auto),
          },
          {
            role: "user",
            content:
              (context
                ? `Text already written before this (for continuity):\n"""${context.slice(-500)}"""\n\n`
                : "") + `Raw dictation to clean up:\n"""${raw}"""`,
          },
        ],
      }),
    });
    if (!res.ok) return raw;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || raw;
  } catch {
    return raw;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  if (!OPENAI_API_KEY) {
    return json({ error: "OPENAI_API_KEY is not configured" }, 500);
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    const style = String(form.get("style") ?? "auto");
    const context = String(form.get("context") ?? "");

    if (!(file instanceof File)) {
      return json({ error: "No audio file provided" }, 400);
    }

    // 1) Whisper transcription
    const whisperForm = new FormData();
    whisperForm.append("file", file, file.name || "speech.webm");
    whisperForm.append("model", WHISPER_MODEL);
    whisperForm.append("response_format", "json");

    const whisperRes = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: whisperForm,
      },
    );

    if (!whisperRes.ok) {
      const detail = await whisperRes.text();
      return json({ error: "Transcription failed", detail }, 502);
    }

    const { text: raw } = await whisperRes.json();

    // 2) AI formatting pass
    const text = await formatText(raw ?? "", style, context);

    return json({ text, raw });
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      500,
    );
  }
});
