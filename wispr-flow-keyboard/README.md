# Flow Keyboard

A recreation of [Wispr Flow](https://wisprflow.ai)'s voice-first iOS keyboard.
An on-screen Apple-style QWERTY keyboard with a purple **Flow** dictation key:
tap it, speak, and your words are transcribed by Whisper and auto-formatted
into clean written text — then inserted at your cursor.

Built with **Vite + React + TypeScript + Tailwind**, transcription via a
**Supabase edge function** calling **OpenAI Whisper**.

## Features

- 🎹 Pixel-styled iOS keyboard (letters / numbers / symbols, shift, caps)
- 🎙️ Press-to-talk **Flow** key with a live waveform listening sheet
- 🧠 Whisper transcription + GPT formatting pass (filler removal, punctuation,
  spoken commands like "new line")
- 📝 Live "Notes" editor — dictated text is inserted at the caret
- 🧪 **Demo mode** — runs with rotating sample text when Supabase isn't
  configured, so the UI is always explorable

## Run locally

```sh
npm install
npm run dev
```

Open the printed URL. Without env vars it runs in **demo mode**.

## Enable real transcription

1. Create a Supabase project.
2. Set the function secret:
   ```sh
   supabase secrets set OPENAI_API_KEY=sk-...
   ```
3. Deploy the edge function:
   ```sh
   supabase functions deploy transcribe --no-verify-jwt
   ```
4. Copy `.env.example` to `.env.local` and fill in:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Restart `npm run dev`. The Flow key now records audio and returns real,
   formatted transcriptions.

## How it works

```
mic ─▶ MediaRecorder (webm/opus) ─▶ Supabase fn "transcribe"
                                        ├─ OpenAI Whisper  → raw text
                                        └─ gpt-4o-mini     → cleaned text
                                     ◀── { text }
inserted at the textarea caret
```

Browser microphone capture, level metering (Web Audio `AnalyserNode`), and
recording state live in `src/hooks/useDictation.ts`. The keyboard is
`src/components/IOSKeyboard.tsx`; the listening panel is `FlowSheet.tsx`.
